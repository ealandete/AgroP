from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import (
    AplicacionMicronutriente, EstadoPastura, Nacimiento,
    AnalisisSuelo, Lote, Usuario, Animal, Ordeno,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["AgroTecnico"])


# ---- ANALISIS DE SUELO MEJORADO ----
@router.get("/suelos/analisis/")
def listar_analisis_suelos(
    lote_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(AnalisisSuelo)
    if lote_id: q = q.filter(AnalisisSuelo.lote_id == lote_id)
    return q.order_by(AnalisisSuelo.fecha.desc()).limit(100).all()


@router.get("/suelos/recomendaciones/")
def recomendaciones_suelo(lote_id: int, db: Session = Depends(get_db)):
    """IA simulada: recomienda cultivos segun pH, textura y nutrientes"""
    ultimo = db.query(AnalisisSuelo).filter(AnalisisSuelo.lote_id == lote_id).order_by(AnalisisSuelo.fecha.desc()).first()
    if not ultimo: return {"error": "Sin analisis de suelo"}

    ph = float(ultimo.ph or 6.5)
    textura = ultimo.textura or "franco"
    n = float(ultimo.nitrogeno or 30)
    p = float(ultimo.fosforo or 15)
    k = float(ultimo.potasio or 150)

    recomendaciones = []
    # Logica basica de recomendacion
    if 5.5 <= ph <= 7.0 and textura in ("franco", "arenoso"):
        recomendaciones.append({"cultivo": "maiz", "tipo": "pan_coger", "confianza": 85, "razon": f"pH {ph} ideal. Textura {textura} favorable."})
        recomendaciones.append({"cultivo": "frijol", "tipo": "pan_coger", "confianza": 80, "razon": "Rotacion recomendada post-maiz"})
    if 5.0 <= ph <= 6.5 and textura in ("arcilloso", "franco"):
        recomendaciones.append({"cultivo": "arroz", "tipo": "pan_coger", "confianza": 90, "razon": f"Textura {textura} retiene agua, ideal para arroz"})
    if 5.5 <= ph <= 7.5:
        recomendaciones.append({"cultivo": "cafe", "tipo": "permanente", "confianza": 75, "razon": "Cultivo permanente apto para la region Caribe"})
        recomendaciones.append({"cultivo": "platano", "tipo": "permanente", "confianza": 78, "razon": "Alta demanda hidrica, verificar disponibilidad de riego"})
    if n < 20:
        recomendaciones.append({"cultivo": "frijol", "tipo": "pan_coger", "confianza": 70, "razon": "Leguminosa fijadora de N, mejora el suelo"})

    # Micronutrientes
    micro = {"Zn": "Aplicar 2 kg/ha de sulfato de zinc" if ph > 6.5 else "Niveles adecuados",
             "B": "Aplicar 1 kg/ha de Borax" if ph > 7.0 else "Monitorear en floracion",
             "Fe": "Quelato de hierro 3 kg/ha" if ph > 7.5 else "Niveles normales"}

    return {
        "lote_id": lote_id,
        "ph_actual": ph,
        "textura": textura,
        "nutrientes": {"N": n, "P": p, "K": k},
        "cultivos_recomendados": sorted(recomendaciones, key=lambda x: x["confianza"], reverse=True)[:5],
        "micronutrientes_recomendados": micro,
    }


# ---- MICRONUTRIENTES ----
@router.get("/micronutrientes/")
def listar_micronutrientes(lote_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(AplicacionMicronutriente)
    if lote_id: q = q.filter(AplicacionMicronutriente.lote_id == lote_id)
    return q.order_by(AplicacionMicronutriente.fecha.desc()).limit(50).all()


@router.post("/micronutrientes/")
def crear_micronutriente(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    a = AplicacionMicronutriente(**data)
    db.add(a); db.commit(); db.refresh(a)
    return a


# ---- PASTURAS ----
@router.get("/pasturas/")
def listar_pasturas(lote_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(EstadoPastura)
    if lote_id: q = q.filter(EstadoPastura.lote_id == lote_id)
    return q.order_by(EstadoPastura.fecha_evaluacion.desc()).limit(50).all()


@router.post("/pasturas/")
def crear_pastura(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    ep = EstadoPastura(**data)
    db.add(ep); db.commit(); db.refresh(ep)
    return ep


@router.get("/pasturas/recomendaciones/")
def recomendaciones_pasturas(lote_id: int, db: Session = Depends(get_db)):
    """IA simulada: recomienda descanso, carga animal y manejo de pasturas"""
    ultimo = db.query(EstadoPastura).filter(EstadoPastura.lote_id == lote_id).order_by(EstadoPastura.fecha_evaluacion.desc()).first()
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote: return {"error": "Lote no encontrado"}

    area = float(lote.area_ha or 1)
    cobertura = float(ultimo.cobertura_porcentaje) if ultimo else 70
    altura = float(ultimo.altura_promedio_cm) if ultimo else 30
    dias_descanso = ultimo.dias_descanso_desde_ultimo_pastoreo if ultimo else 7

    # Calcular carga animal segun cobertura
    if cobertura >= 85:
        carga = round(area * 2.5, 1)
        estado = "Excelente"
    elif cobertura >= 70:
        carga = round(area * 1.8, 1)
        estado = "Buena"
    elif cobertura >= 50:
        carga = round(area * 1.0, 1)
        estado = "Regular - Reducir carga"
    else:
        carga = 0
        estado = "Degradada - Requiere renovacion"

    # Dias de descanso recomendados
    if altura > 40: dias_rec = 21
    elif altura > 25: dias_rec = 28
    else: dias_rec = 35

    return {
        "lote_id": lote_id,
        "lote_nombre": lote.nombre,
        "area_ha": area,
        "cobertura_actual_pct": cobertura,
        "estado_pastura": estado,
        "dias_descanso_actual": dias_descanso or 0,
        "dias_descanso_recomendados": dias_rec,
        "carga_animal_recomendada_ugg_ha": round(carga / area, 2) if area > 0 else 0,
        "total_ugg_soportadas": round(carga, 0),
        "recomendacion": f"Dejar descansar {dias_rec} dias." if dias_rec > (dias_descanso or 0) else "Pastura lista para pastoreo.",
        "razas_recomendadas": ["Brahman", "Gyr", "Angus"] if cobertura >= 70 else ["Criollo", "Romosinuano"],
    }


# ---- NACIMIENTOS + GENEALOGIA ----
@router.get("/nacimientos/")
def listar_nacimientos(madre_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Nacimiento)
    if madre_id: q = q.filter(Nacimiento.madre_id == madre_id)
    return q.order_by(Nacimiento.fecha_nacimiento.desc()).limit(100).all()


@router.post("/nacimientos/")
def crear_nacimiento(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    n = Nacimiento(**data)
    db.add(n); db.commit(); db.refresh(n)
    return n


@router.get("/genealogia/{animal_id}")
def genealogia_animal(animal_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal: raise HTTPException(404)
    arbol = {"id": animal.id, "codigo": animal.codigo, "nombre": animal.nombre, "especie": animal.especie}
    if animal.madre_id:
        madre = db.query(Animal).filter(Animal.id == animal.madre_id).first()
        if madre: arbol["madre"] = {"id": madre.id, "codigo": madre.codigo, "nombre": madre.nombre}
    if animal.padre_id:
        padre = db.query(Animal).filter(Animal.id == animal.padre_id).first()
        if padre: arbol["padre"] = {"id": padre.id, "codigo": padre.codigo, "nombre": padre.nombre}
    return arbol


# ---- PRODUCCION LECHE POR ANIMAL (KPIs) ----
@router.get("/leche/animal/{animal_id}")
def produccion_leche_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal: raise HTTPException(404)
    ordenos = db.query(Ordeno).filter(Ordeno.animal_id == animal_id).order_by(Ordeno.fecha.desc()).limit(90).all()
    total_lts = sum(float(o.total_dia or 0) for o in ordenos)
    promedio = total_lts / len(ordenos) if ordenos else 0
    return {
        "animal_id": animal_id,
        "codigo": animal.codigo,
        "nombre": animal.nombre,
        "total_lts_periodo": round(total_lts, 1),
        "promedio_diario": round(promedio, 1),
        "dias_registrados": len(ordenos),
        "ordenos": [{"fecha": str(o.fecha), "total_dia": float(o.total_dia or 0), "lactando": o.lactando} for o in ordenos[:30]],
    }
