import json
import os
import math
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Any
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Lote
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/recomendaciones", tags=["Recomendaciones / AI"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CULTIVOS_MIXTOS_PATH = os.path.join(DATA_DIR, "cultivos_mixtos.json")


def _load_data():
    if not os.path.exists(CULTIVOS_MIXTOS_PATH):
        return {"compatibilidades": [], "suelos_cultivos": [], "rendimientos_referencia": {}, "sistemas_riego": {}}
    with open(CULTIVOS_MIXTOS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _save_data(data):
    with open(CULTIVOS_MIXTOS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ─── Schemas ─────────────────────────────────────────────────

class AnalisisSueloInput(BaseModel):
    ph: float
    n_ppm: float = Field(0, alias="nitrogeno_ppm")
    p_ppm: float = Field(0, alias="fosforo_ppm")
    k_ppm: float = Field(0, alias="potasio_ppm")
    mo_pct: float = Field(0, alias="materia_organica_pct")
    textura: str = "franca"
    altitud_msnm: Optional[float] = None
    precipitacion_mm: Optional[float] = None
    uso_actual: Optional[str] = None

    class Config:
        populate_by_name = True


class CultivoRecomendado(BaseModel):
    cultivo: str
    match_pct: float
    razones: list[str]
    rendimiento_est_kg_ha: float
    ciclo_dias: int


class EnmiendaRecomendada(BaseModel):
    tipo: str
    descripcion: str
    dosis: str
    prioridad: str


class AnalisisSueloOutput(BaseModel):
    cultivos_recomendados: list[CultivoRecomendado]
    apto_ganaderia: bool
    ganaderia_observacion: str
    enmiendas: list[EnmiendaRecomendada]
    riego_recomendado: Optional[str]
    observaciones: list[str]


class CultivoMixtoInput(BaseModel):
    lote_id: int
    area_ha: float
    cultivo_principal: str
    cultivo_secundario: str


class CultivoMixtoOutput(BaseModel):
    compatibilidad: str
    score: int
    notas: str
    espaciamiento_recomendado: str
    rendimiento_est_principal_kg: float
    rendimiento_est_secundario_kg: float
    sistema_ejemplo: str


class RiegoInput(BaseModel):
    area_ha: float
    cultivo: str
    textura: str = "franca"
    pendiente_pct: float = 0
    fuente_agua: str = "rio"
    caudal_disponible_lps: Optional[float] = None


class RiegoRecomendacion(BaseModel):
    sistema: str
    descripcion: str
    eficiencia: float
    agua_necesaria_mm_mes: float
    agua_total_m3_mes: float
    horas_riego_dia: float
    frecuencia_dias: int
    costo_estimado_ha: float
    diagrama: str


class ProduccionCalculoInput(BaseModel):
    tipo: str = "cultivo"
    area_ha: Optional[float] = None
    cultivo: Optional[str] = None
    rendimiento_esperado_kg_ha: Optional[float] = None
    cabezas: Optional[int] = None
    peso_promedio_kg: Optional[float] = None
    dias_ciclo: Optional[int] = None
    produccion_diaria_l: Optional[float] = None
    costo_operativo_ha: Optional[float] = None
    precio_venta_kg: Optional[float] = None
    costo_unitario: Optional[float] = None


class ProduccionCalculoOutput(BaseModel):
    produccion_total_kg: Optional[float] = None
    area_requerida_ha: Optional[float] = None
    ingreso_bruto: Optional[float] = None
    costo_total: Optional[float] = None
    utilidad_neta: Optional[float] = None
    rentabilidad_pct: Optional[float] = None
    detalle: str


# ─── Endpoints ────────────────────────────────────────────────

@router.post("/analizar-suelo", response_model=AnalisisSueloOutput)
def analizar_suelo(
    payload: AnalisisSueloInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    data = _load_data()
    suelos = data.get("suelos_cultivos", [])
    rends = data.get("rendimientos_recomendacion", data.get("rendimientos_referencia", {}))

    ph = payload.ph
    n = payload.n_ppm
    p = payload.p_ppm
    k = payload.k_ppm
    mo = payload.mo_pct
    textura = payload.textura.lower()

    cultivos_ranked = []
    for sc in suelos:
        score = 0.0
        razones = []
        if ph < sc["ph_min"] or ph > sc["ph_max"]:
            continue
        score += 30
        razones.append(f"pH {ph} en rango óptimo ({sc['ph_min']}-{sc['ph_max']})")

        if textura == sc["textura"]:
            score += 20
            razones.append(f"Textura {textura} ideal")
        elif textura in ("franca", "franco_arenosa", "franco_arcillosa") and sc["textura"] in ("franca", "arenosa", "arcillosa"):
            score += 10
            razones.append(f"Textura {textura} aceptable")

        if payload.altitud_msnm is not None and payload.altitud_msnm <= sc["altitud_max"]:
            score += 15
            razones.append(f"Altitud {payload.altitud_msnm} msnm apta")

        if payload.precipitacion_mm is not None:
            try:
                parts = sc["precipitacion_mm"].replace(" ", "").split("-")
                pmin, pmax = float(parts[0]), float(parts[1])
                if pmin <= payload.precipitacion_mm <= pmax:
                    score += 10
                    razones.append("Precipitación en rango recomendado")
            except (ValueError, IndexError):
                pass

        if n < 20:
            razones.append("Requiere fertilización nitrogenada")
        if p < 15:
            razones.append("Requiere fósforo")
        if k < 0.2:
            razones.append("Requiere potasio")

        rend_info = rends.get(sc["cultivo"], {})
        rend_kg_ha = rend_info.get("kg_ha", 0)
        ciclo = rend_info.get("ciclo_dias", 365)

        cultivos_ranked.append(CultivoRecomendado(
            cultivo=sc["cultivo"],
            match_pct=round(score, 1),
            razones=razones,
            rendimiento_est_kg_ha=rend_kg_ha,
            ciclo_dias=ciclo,
        ))

    cultivos_ranked.sort(key=lambda c: c.match_pct, reverse=True)

    apto_ganaderia = textura in ("franca", "franco_arenosa") and 5.5 <= ph <= 7.5
    ganaderia_obs = "Apto para ganadería" if apto_ganaderia else "Suelo con limitaciones para ganadería extensiva"

    enmiendas = []
    if ph < 5.5:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Encalado", descripcion="Aplicar cal dolomítica para elevar pH",
            dosis="2-4 ton/ha según análisis", prioridad="alta",
        ))
    if ph > 7.5:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Azufre", descripcion="Aplicar azufre elemental para reducir pH",
            dosis="500-1000 kg/ha", prioridad="media",
        ))
    if mo < 3:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Materia Orgánica", descripcion="Incorporar compost o abono verde",
            dosis="10-20 ton/ha de compost", prioridad="alta",
        ))
    if n < 20:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Nitrógeno", descripcion="Fertilización nitrogenada",
            dosis="80-120 kg/ha de urea", prioridad="alta",
        ))
    elif n < 50:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Nitrógeno", descripcion="Fertilización de mantenimiento",
            dosis="40-60 kg/ha de urea", prioridad="media",
        ))
    if p < 15:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Fósforo", descripcion="Fertilización fosfatada",
            dosis="60-80 kg/ha de DAP", prioridad="alta",
        ))
    if k < 0.2:
        enmiendas.append(EnmiendaRecomendada(
            tipo="Potasio", descripcion="Fertilización potásica",
            dosis="60-100 kg/ha de KCl", prioridad="alta",
        ))

    riego_rec = None
    if textura in ("arenoso", "arenosa"):
        riego_rec = "Sistema de riego por goteo recomendado por baja retención de humedad"

    obs = []
    if textura in ("arenoso", "arenosa"):
        obs.append("Suelo arenoso: alta permeabilidad, requiere riego frecuente y materia orgánica")
    elif textura in ("arcilloso", "arcillosa"):
        obs.append("Suelo arcilloso: mejorar drenaje, evitar encharcamiento")
    if mo > 10:
        obs.append("Alto contenido de materia orgánica")
    if len(cultivos_ranked) == 0:
        obs.append("No se encontraron cultivos compatibles con las condiciones actuales del suelo")

    return AnalisisSueloOutput(
        cultivos_recomendados=cultivos_ranked,
        apto_ganaderia=apto_ganaderia,
        ganaderia_observacion=ganaderia_obs,
        enmiendas=enmiendas,
        riego_recomendado=riego_rec,
        observaciones=obs,
    )


@router.post("/cultivos-mixtos", response_model=CultivoMixtoOutput)
def recomendar_cultivo_mixto(
    payload: CultivoMixtoInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    data = _load_data()
    comps = data.get("compatibilidades", [])
    rends = data.get("rendimientos_referencia", {})
    c1 = payload.cultivo_principal.lower().strip()
    c2 = payload.cultivo_secundario.lower().strip()

    match = None
    for c in comps:
        if {c["cultivo1"], c["cultivo2"]} == {c1, c2}:
            match = c
            break

    if not match:
        if c1 == c2:
            raise HTTPException(status_code=400, detail="No se puede asociar el mismo cultivo")
        return CultivoMixtoOutput(
            compatibilidad="desconocida",
            score=0,
            notas="No hay datos de compatibilidad para esta combinación. Se recomienda probar en pequeña escala.",
            espaciamiento_recomendado="Consultar manual técnico",
            rendimiento_est_principal_kg=0,
            rendimiento_est_secundario_kg=0,
            sistema_ejemplo="",
        )

    compat_map = {"alta": 10, "media": 5, "baja": 1}
    score_val = compat_map.get(match["compatibilidad"], 0)

    r1 = rends.get(c1, {}).get("kg_ha", 0)
    r2 = rends.get(c2, {}).get("kg_ha", 0)

    area = payload.area_ha
    espacios = {
        "alta": "Cultivar en surcos alternos a 2-3 metros de distancia",
        "media": "Dejar 3-4 metros entre especies para evitar competencia",
        "baja": "No recomendado para siembra conjunta en el mismo lote",
    }

    ejemplos = {
        ("coco", "mango"): "Sistema agroforestal de coco con mango en relevo",
        ("coco", "platano"): "Coco como dosel alto, plátano como cultivo intercalado",
        ("cafe", "platano"): "Sistema tradicional colombiano de café bajo sombra de plátano",
        ("maiz", "frijol"): "Sistema Milpa mesoamericano, el frijol trepa por el maíz",
        ("maiz", "calabaza"): "Sistema Milpa, la calabaza cubre el suelo",
        ("yuca", "mani"): "Yuca asociada con maní para fijación de nitrógeno",
        ("pastura", "arboles"): "Sistema silvopastoril intensivo (SSPi)",
        ("tomate", "albahaca"): "La albahaca repele insectos del tomate",
    }
    sistema = ejemplos.get((c1, c2)) or ejemplos.get((c2, c1)) or "Asociación de cultivos"

    return CultivoMixtoOutput(
        compatibilidad=match["compatibilidad"],
        score=score_val,
        notas=match["notas"],
        espaciamiento_recomendado=espacios.get(match["compatibilidad"], "Consultar manual"),
        rendimiento_est_principal_kg=round(r1 * area * 0.8, 2),
        rendimiento_est_secundario_kg=round(r2 * area * 0.6, 2),
        sistema_ejemplo=sistema,
    )


@router.post("/riego", response_model=RiegoRecomendacion)
def recomendar_riego(
    payload: RiegoInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    data = _load_data()
    sis = data.get("sistemas_riego", {})

    textura = payload.textura.lower()
    pendiente = payload.pendiente_pct
    cultivo = payload.cultivo.lower().strip()

    candidatos = []
    for key, s in sis.items():
        puntaje = 0
        if cultivo in s["ideal_para"]:
            puntaje += 40
        if pendiente <= s["pendiente_max"]:
            puntaje += 30
        else:
            puntaje -= 20
        if textura in ("arenoso", "arenosa") and key == "goteo":
            puntaje += 15
        elif textura in ("arcilloso", "arcillosa") and key in ("gravedad", "aspersion"):
            puntaje += 10
        elif textura in ("franca",) and key == "aspersion":
            puntaje += 10
        if payload.fuente_agua in ("rio", "nacimiento", "embalse") and key in ("pivote", "aspersion"):
            puntaje += 5
        elif payload.fuente_agua == "pozo" and key == "goteo":
            puntaje += 5
        candidatos.append((puntaje, key, s))

    candidatos.sort(key=lambda x: x[0], reverse=True)

    if not candidatos or candidatos[0][0] < 0:
        selected_key = "aspersion"
        selected = sis.get("aspersion", {})
    else:
        _, selected_key, selected = candidatos[0]

    eto = 120
    kc_map = {
        "tomate": 1.1, "fresa": 0.9, "citricos": 0.7, "cafe": 0.8, "cacao": 0.8,
        "platano": 1.0, "mango": 0.7, "maiz": 1.0, "frijol": 0.8, "papa": 0.9,
        "pastura": 0.8, "arroz": 1.2, "yuca": 0.8, "coco": 0.7,
    }
    kc = kc_map.get(cultivo, 0.85)
    agua_mm = round(eto * kc / selected.get("eficiencia", 0.75), 1)

    area = payload.area_ha
    agua_m3 = round(agua_mm * area * 10, 1)
    horas = round(agua_mm / 5.0, 1) if agua_mm else 0
    frecuencia = 3 if textura in ("arenoso", "arenosa") else 5 if textura in ("franca",) else 7

    return RiegoRecomendacion(
        sistema=selected.get("nombre", selected_key.capitalize()),
        descripcion=selected.get("descripcion", ""),
        eficiencia=selected.get("eficiencia", 0.75),
        agua_necesaria_mm_mes=agua_mm,
        agua_total_m3_mes=agua_m3,
        horas_riego_dia=horas,
        frecuencia_dias=frecuencia,
        costo_estimado_ha=selected.get("costo_ha", 0),
        diagrama=f"💧 {selected.get('nombre', selected_key)} → Cultivo: {cultivo} | Eficiencia: {selected.get('eficiencia', 0.75)*100:.0f}%",
    )


@router.post("/calcular-produccion", response_model=ProduccionCalculoOutput)
def calcular_produccion(
    payload: ProduccionCalculoInput,
    current_user=Depends(get_current_user),
):
    data = _load_data()
    if payload.tipo == "cultivo":
        if not payload.area_ha or not payload.cultivo:
            raise HTTPException(status_code=400, detail="area_ha y cultivo son requeridos")
        rends = data.get("rendimientos_referencia", {})
        ref = rends.get(payload.cultivo.lower(), {})
        rend = payload.rendimiento_esperado_kg_ha or ref.get("kg_ha", 0)
        total = round(rend * payload.area_ha, 2)
        detalle = f"{payload.cultivo.capitalize()} | {payload.area_ha} ha × {rend} kg/ha = {total:,.0f} kg"
        area_ha = payload.area_ha
    elif payload.tipo == "pecuario":
        if not payload.cabezas or not payload.peso_promedio_kg:
            raise HTTPException(status_code=400, detail="cabezas y peso_promedio_kg son requeridos")
        rend = 0.55
        total = round(payload.cabezas * payload.peso_promedio_kg * rend, 2)
        detalle = f"{payload.cabezas} cabezas × {payload.peso_promedio_kg} kg × rendimiento {rend*100:.0f}% = {total:,.0f} kg carne"
        area_ha = None
    elif payload.tipo == "leche":
        if not payload.cabezas or not payload.produccion_diaria_l:
            raise HTTPException(status_code=400, detail="cabezas y produccion_diaria_l son requeridos")
        dias = payload.dias_ciclo or 30
        total = round(payload.cabezas * payload.produccion_diaria_l * dias, 2)
        detalle = f"{payload.cabezas} vacas × {payload.produccion_diaria_l} L/día × {dias} días = {total:,.0f} L"
        area_ha = None
    else:
        raise HTTPException(status_code=400, detail="tipo debe ser cultivo, pecuario o leche")

    ingreso = round(total * (payload.precio_venta_kg or 0), 2) if payload.precio_venta_kg else None
    costo = round((payload.costo_operativo_ha or 0) * (area_ha or 1), 2) if payload.costo_operativo_ha is not None else None
    if payload.costo_unitario:
        costo = round(total * payload.costo_unitario, 2)

    utilidad = round(ingreso - costo, 2) if ingreso is not None and costo is not None else None
    rentabilidad = round((utilidad / costo) * 100, 1) if utilidad is not None and costo and costo > 0 else None

    return ProduccionCalculoOutput(
        produccion_total_kg=total,
        area_requerida_ha=area_ha,
        ingreso_bruto=ingreso,
        costo_total=costo,
        utilidad_neta=utilidad,
        rentabilidad_pct=rentabilidad,
        detalle=detalle,
    )


@router.get("/especies-compatibles")
def listar_compatibles(current_user=Depends(get_current_user)):
    data = _load_data()
    return {
        "compatibilidades": data.get("compatibilidades", []),
        "sistemas_riego": data.get("sistemas_riego", {}),
        "rendimientos": data.get("rendimientos_referencia", {}),
    }


@router.get("/cultivos-disponibles")
def listar_cultivos(current_user=Depends(get_current_user)):
    data = _load_data()
    cultivos = set()
    for sc in data.get("suelos_cultivos", []):
        cultivos.add(sc["cultivo"])
    return {"cultivos": sorted(cultivos)}


@router.post("/compatibilidades")
def agregar_compatibilidad(
    payload: dict,
    current_user=Depends(get_current_user),
):
    cultivo1 = payload.get("cultivo1", "").strip().lower()
    cultivo2 = payload.get("cultivo2", "").strip().lower()
    compatibilidad = payload.get("compatibilidad", "media")
    notas = payload.get("notas", "")
    if not cultivo1 or not cultivo2:
        raise HTTPException(status_code=400, detail="cultivo1 y cultivo2 son requeridos")

    data = _load_data()
    for c in data["compatibilidades"]:
        if {c["cultivo1"], c["cultivo2"]} == {cultivo1, cultivo2}:
            c["compatibilidad"] = compatibilidad
            c["notas"] = notas
            _save_data(data)
            return {"detail": "Compatibilidad actualizada", "cultivo1": cultivo1, "cultivo2": cultivo2}
    data["compatibilidades"].append({
        "cultivo1": cultivo1, "cultivo2": cultivo2,
        "compatibilidad": compatibilidad, "notas": notas,
    })
    _save_data(data)
    return {"detail": "Compatibilidad creada", "cultivo1": cultivo1, "cultivo2": cultivo2}
