from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.database import get_db
from app.models import Plantacion, CrecimientoForestal, EspecieForestal, Lote
from app.schemas import (
    PlantacionCreate, PlantacionUpdate, PlantacionOut,
    CrecimientoForestalCreate, CrecimientoForestalOut,
    EspecieForestalOut
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/forestal", tags=["Forestal / Plantaciones"])


@router.get("/plantaciones/", response_model=list[PlantacionOut])
def listar_plantaciones(
    lote_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Plantacion)
    if lote_id:
        q = q.filter(Plantacion.lote_id == lote_id)
    if estado:
        q = q.filter(Plantacion.estado == estado)
    items = q.order_by(desc(Plantacion.fecha_plantacion)).all()
    result = []
    for p in items:
        d = {c.name: getattr(p, c.name) for c in Plantacion.__table__.columns}
        d["lote_nombre"] = p.lote.nombre if p.lote else None
        d["especie_nombre"] = p.especie_rel.nombre_comun if p.especie_rel else p.especie
        result.append(d)
    return result


@router.post("/plantaciones/", response_model=PlantacionOut, status_code=201)
def crear_plantacion(payload: PlantacionCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    lote = db.query(Lote).filter(Lote.id == payload.lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    plantacion = Plantacion(**payload.model_dump())
    db.add(plantacion)
    db.commit()
    db.refresh(plantacion)
    plantacion.lote_nombre = lote.nombre
    if plantacion.especie_id:
        esp = db.query(EspecieForestal).filter(EspecieForestal.id == plantacion.especie_id).first()
        plantacion.especie_nombre = esp.nombre_comun if esp else plantacion.especie
    return plantacion


@router.put("/plantaciones/{plantacion_id}", response_model=PlantacionOut)
def actualizar_plantacion(plantacion_id: int, payload: PlantacionUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    p = db.query(Plantacion).filter(Plantacion.id == plantacion_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantacion no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    p.lote_nombre = p.lote.nombre if p.lote else None
    p.especie_nombre = p.especie_rel.nombre_comun if p.especie_rel else p.especie
    return p


@router.get("/plantaciones/{plantacion_id}/crecimientos", response_model=list[CrecimientoForestalOut])
def listar_crecimientos(plantacion_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    p = db.query(Plantacion).filter(Plantacion.id == plantacion_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantacion no encontrada")
    return db.query(CrecimientoForestal).filter(
        CrecimientoForestal.plantacion_id == plantacion_id
    ).order_by(CrecimientoForestal.fecha).all()


@router.post("/plantaciones/{plantacion_id}/crecimientos", response_model=CrecimientoForestalOut, status_code=201)
def crear_crecimiento(plantacion_id: int, payload: CrecimientoForestalCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    p = db.query(Plantacion).filter(Plantacion.id == plantacion_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantacion no encontrada")
    c = CrecimientoForestal(plantacion_id=plantacion_id, **payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/especies", response_model=list[EspecieForestalOut])
def listar_especies(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(EspecieForestal).order_by(EspecieForestal.nombre_comun).all()


@router.post("/especies/", response_model=EspecieForestalOut, status_code=201)
def crear_especie(payload: EspecieForestalOut, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    esp = EspecieForestal(**payload.model_dump())
    db.add(esp)
    db.commit()
    db.refresh(esp)
    return esp


@router.get("/resumen")
def resumen_forestal(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    activas = db.query(Plantacion).count()
    total_arboles = db.query(Plantacion.total_arboles).filter(Plantacion.total_arboles != None).all()
    total = sum(t[0] for t in total_arboles if t[0])
    area = db.query(Plantacion.area_ha).filter(Plantacion.area_ha != None).all()
    area_total = sum(a[0] for a in area if a[0])
    return {
        "plantaciones_activas": activas,
        "total_arboles": total,
        "area_reforestada_ha": area_total,
    }
