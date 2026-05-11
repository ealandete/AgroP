from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import Siembra, Cosecha, VariedadCultivo, Lote, Usuario, PlagaEnfermedad, Tratamiento, Morbilidad
from app.schemas import (
    SiembraCreate, SiembraOut, CosechaCreate, CosechaOut,
    VariedadCultivoOut, PlagaOut, TratamientoCreate, TratamientoOut,
    SaludCultivoOut, MarcarPlantaIn, ValidarUsoOut
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/cultivos", tags=["Cultivos"])


# --- SIEMBRAS ---
@router.get("/", response_model=list[SiembraOut])
def listar_siembras(
    estado: Optional[str] = None,
    cultivo: Optional[str] = None,
    lote_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Siembra)
    if estado:
        q = q.filter(Siembra.estado == estado)
    if cultivo:
        q = q.filter(Siembra.cultivo == cultivo)
    if lote_id:
        q = q.filter(Siembra.lote_id == lote_id)
    return q.order_by(Siembra.fecha_siembra.desc()).all()


@router.get("/{siembra_id}", response_model=SiembraOut)
def obtener_siembra(siembra_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    siembra = db.query(Siembra).filter(Siembra.id == siembra_id).first()
    if not siembra:
        raise HTTPException(status_code=404, detail="Siembra no encontrada")
    return siembra


@router.post("/", response_model=SiembraOut, status_code=201)
def crear_siembra(payload: SiembraCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    data = {k: v for k, v in payload.model_dump().items() if hasattr(Siembra, k)}
    siembra = Siembra(**data)
    db.add(siembra)
    db.commit()
    db.refresh(siembra)
    return siembra


@router.put("/{siembra_id}", response_model=SiembraOut)
def actualizar_siembra(siembra_id: int, payload: SiembraCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    siembra = db.query(Siembra).filter(Siembra.id == siembra_id).first()
    if not siembra:
        raise HTTPException(status_code=404, detail="Siembra no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(siembra, k, v)
    db.commit()
    db.refresh(siembra)
    return siembra


# --- COSECHAS ---
@router.get("/{siembra_id}/cosechas", response_model=list[CosechaOut])
def listar_cosechas(siembra_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Cosecha).filter(Cosecha.siembra_id == siembra_id).order_by(Cosecha.fecha.desc()).all()


@router.post("/{siembra_id}/cosechas", response_model=CosechaOut, status_code=201)
def crear_cosecha(siembra_id: int, payload: CosechaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    payload.siembra_id = siembra_id
    cosecha = Cosecha(**payload.model_dump())
    db.add(cosecha)

    # Actualizar rendimiento de la siembra
    siembra = db.query(Siembra).filter(Siembra.id == siembra_id).first()
    if siembra:
        total = db.query(Cosecha).filter(Cosecha.siembra_id == siembra_id).with_entities(
            __import__("sqlalchemy").sql.func.sum(Cosecha.cantidad_kg)
        ).scalar() or 0
        siembra.rendimiento_kg = float(total) + float(payload.cantidad_kg)
        if siembra.area_ha and float(siembra.area_ha) > 0:
            siembra.rendimiento_ha = siembra.rendimiento_kg / float(siembra.area_ha)

    db.commit()
    db.refresh(cosecha)
    return cosecha


# --- VARIEDADES ---
@router.get("/variedades/", response_model=list[VariedadCultivoOut])
def listar_variedades(cultivo: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(VariedadCultivo)
    if cultivo:
        q = q.filter(VariedadCultivo.cultivo == cultivo)
    return q.order_by(VariedadCultivo.cultivo, VariedadCultivo.variedad).all()


# --- PLAGAS ---
@router.get("/plagas/", response_model=list[PlagaOut])
def listar_plagas(
    tipo: Optional[str] = None,
    afecta_a: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(PlagaEnfermedad)
    if tipo:
        q = q.filter(PlagaEnfermedad.tipo == tipo)
    if afecta_a:
        q = q.filter(PlagaEnfermedad.afecta_a == afecta_a)
    return q.order_by(PlagaEnfermedad.nombre).all()


# --- TRATAMIENTOS ---
@router.post("/tratamientos/", response_model=TratamientoOut, status_code=201)
def crear_tratamiento(payload: TratamientoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    tr = Tratamiento(**payload.model_dump())
    db.add(tr)
    db.commit()
    db.refresh(tr)
    return tr


@router.get("/tratamientos/", response_model=list[TratamientoOut])
def listar_tratamientos(
    tipo: Optional[str] = None,
    lote_id: Optional[int] = None,
    animal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Tratamiento)
    if tipo:
        q = q.filter(Tratamiento.tipo == tipo)
    if lote_id:
        q = q.filter(Tratamiento.lote_id == lote_id)
    if animal_id:
        q = q.filter(Tratamiento.animal_id == animal_id)
    return q.order_by(Tratamiento.fecha_aplicacion.desc()).all()


# --- SALUD DEL CULTIVO ---
@router.get("/{siembra_id}/salud", response_model=SaludCultivoOut)
def salud_cultivo(siembra_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    siembra = db.query(Siembra).filter(Siembra.id == siembra_id).first()
    if not siembra:
        raise HTTPException(status_code=404, detail="Siembra no encontrada")

    area_ha = float(siembra.area_ha) if siembra.area_ha else 0
    densidad_por_ha = 10000
    total_plantas = int(area_ha * densidad_por_ha)

    casos = (
        db.query(Morbilidad)
        .filter(
            Morbilidad.lote_id == siembra.lote_id,
            Morbilidad.siembra_id == siembra_id,
        )
        .order_by(Morbilidad.fecha_deteccion.desc())
        .all()
    )

    plantas_afectadas = sum(
        max(1, int(area_ha * (1 if c.severidad == "alta" else 0.5 if c.severidad == "media" else 0.1)))
        for c in casos
    ) if casos else 0

    if total_plantas > 0:
        salud_pct = round(((total_plantas - plantas_afectadas) / total_plantas) * 100, 2)
    else:
        salud_pct = 100.0

    return SaludCultivoOut(
        total_plantas=total_plantas,
        plantas_afectadas=plantas_afectadas,
        salud_pct=salud_pct,
        casos=[
            {
                "id": c.id,
                "fecha_deteccion": str(c.fecha_deteccion),
                "tipo_afectacion": c.tipo_afectacion,
                "severidad": c.severidad,
                "ubicacion": c.ubicacion,
                "observaciones": c.observaciones,
                "estado_actual": c.estado_actual,
            }
            for c in casos
        ],
    )


@router.post("/{siembra_id}/marcar-planta", status_code=201)
def marcar_planta(siembra_id: int, payload: MarcarPlantaIn, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    siembra = db.query(Siembra).filter(Siembra.id == siembra_id).first()
    if not siembra:
        raise HTTPException(status_code=404, detail="Siembra no encontrada")

    registro = Morbilidad(
        lote_id=siembra.lote_id,
        siembra_id=siembra_id,
        especie=siembra.cultivo,
        fecha_deteccion=date.today(),
        tipo_afectacion=payload.tipo_afectacion,
        severidad=payload.severidad,
        ubicacion=payload.ubicacion,
        observaciones=payload.observaciones,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return {
        "detail": "Registro creado",
        "id": registro.id,
    }


# --- VALIDAR USO DE LOTE ---
@router.get("/lotes/{lote_id}/validar-uso", response_model=ValidarUsoOut)
def validar_uso_lote(lote_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")

    area_ha = float(lote.area_ha) if lote.area_ha else 0

    resultado = (
        db.query(func.sum(Siembra.area_ha))
        .filter(
            Siembra.lote_id == lote_id,
            Siembra.estado.in_(["activo", "cosechado"]),
        )
        .scalar()
    )
    area_cultivada = float(resultado) if resultado else 0
    area_disponible = round(area_ha - area_cultivada, 4)

    warnings = []
    if area_cultivada > area_ha:
        warnings.append(f"El área cultivada ({area_cultivada} ha) supera el área del lote ({area_ha} ha)")

    return ValidarUsoOut(
        lote_id=lote_id,
        area_ha=area_ha,
        area_cultivada=round(area_cultivada, 4),
        area_disponible=area_disponible,
        warnings=warnings,
    )
