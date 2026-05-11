from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.models import (
    Reproduccion, Lactancia, Ordeno, Pesaje, Sanidad,
    AlimentacionDiaria, MovimientoAnimal, PlanificacionPastoreo,
    LaborCampo, Animal, Usuario, Lote, Siembra, Parto,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Operaciones"])


# ---- REPRODUCCION ----
@router.get("/reproduccion/")
def listar_reproduccion(
    animal_id: Optional[int] = None,
    resultado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Reproduccion)
    if animal_id:
        q = q.filter(Reproduccion.animal_id == animal_id)
    if resultado:
        q = q.filter(Reproduccion.resultado == resultado)
    return q.order_by(Reproduccion.fecha_servicio.desc()).all()


@router.post("/reproduccion/")
def crear_reproduccion(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    r = Reproduccion(**data)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/reproduccion/{reproduccion_id}")
def actualizar_reproduccion(reproduccion_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    r = db.query(Reproduccion).filter(Reproduccion.id == reproduccion_id).first()
    if not r:
        raise HTTPException(404)
    for k, v in data.items():
        setattr(r, k, v)
    db.commit()
    return r


# ---- LACTANCIAS ----
@router.get("/lactancias/")
def listar_lactancias(
    estado: Optional[str] = None,
    animal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Lactancia)
    if estado:
        q = q.filter(Lactancia.estado == estado)
    if animal_id:
        q = q.filter(Lactancia.animal_id == animal_id)
    return q.order_by(Lactancia.fecha_inicio.desc()).all()


@router.post("/lactancias/")
def crear_lactancia(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    lc = Lactancia(**data)
    db.add(lc)
    db.commit()
    db.refresh(lc)
    return lc


# ---- ORDENOS (milk records) ----
@router.get("/ordenos/")
def listar_ordenos(
    animal_id: Optional[int] = None,
    lactancia_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Ordeno)
    if animal_id:
        q = q.filter(Ordeno.animal_id == animal_id)
    if lactancia_id:
        q = q.filter(Ordeno.lactancia_id == lactancia_id)
    if fecha_desde:
        q = q.filter(Ordeno.fecha >= fecha_desde)
    return q.order_by(Ordeno.fecha.desc()).limit(500).all()


@router.post("/ordenos/")
def crear_ordeno(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    o = Ordeno(**data)
    if not o.total_dia:
        o.total_dia = (float(data.get("ordeno_am") or 0) + float(data.get("ordeno_pm") or 0))
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


# ---- PESAJES ----
@router.get("/pesajes/")
def listar_pesajes(
    animal_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Pesaje)
    if animal_id:
        q = q.filter(Pesaje.animal_id == animal_id)
    return q.order_by(Pesaje.fecha.desc()).limit(200).all()


@router.post("/pesajes/")
def crear_pesaje(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    p = Pesaje(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ---- SANIDAD ----
@router.get("/sanidad/")
def listar_sanidad(
    animal_id: Optional[int] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Sanidad)
    if animal_id:
        q = q.filter(Sanidad.animal_id == animal_id)
    if tipo:
        q = q.filter(Sanidad.tipo == tipo)
    return q.order_by(Sanidad.fecha.desc()).limit(200).all()


@router.post("/sanidad/")
def crear_sanidad(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    s = Sanidad(**data)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


# ---- ALIMENTACION DIARIA ----
@router.get("/alimentacion/")
def listar_alimentacion(
    lote_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(AlimentacionDiaria)
    if lote_id:
        q = q.filter(AlimentacionDiaria.lote_id == lote_id)
    if fecha_desde:
        q = q.filter(AlimentacionDiaria.fecha >= fecha_desde)
    return q.order_by(AlimentacionDiaria.fecha.desc()).limit(200).all()


@router.post("/alimentacion/")
def crear_alimentacion(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    a = AlimentacionDiaria(**data)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


# ---- MOVIMIENTOS ----
@router.get("/movimientos/")
def listar_movimientos(
    animal_id: Optional[int] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(MovimientoAnimal)
    if animal_id:
        q = q.filter(MovimientoAnimal.animal_id == animal_id)
    if tipo:
        q = q.filter(MovimientoAnimal.tipo == tipo)
    return q.order_by(MovimientoAnimal.fecha.desc()).limit(200).all()


@router.post("/movimientos/")
def crear_movimiento(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    m = MovimientoAnimal(**data)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


# ---- PASTOREO ----
@router.get("/pastoreo/")
def listar_pastoreo(
    lote_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(PlanificacionPastoreo)
    if lote_id:
        q = q.filter(PlanificacionPastoreo.lote_id == lote_id)
    if estado:
        q = q.filter(PlanificacionPastoreo.estado == estado)
    return q.order_by(PlanificacionPastoreo.fecha_inicio.desc()).limit(100).all()


# ---- LABORES DE CAMPO ----
@router.get("/labores/")
def listar_labores(
    lote_id: Optional[int] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(LaborCampo)
    if lote_id:
        q = q.filter(LaborCampo.lote_id == lote_id)
    if tipo:
        q = q.filter(LaborCampo.tipo == tipo)
    return q.order_by(LaborCampo.fecha.desc()).limit(200).all()


@router.post("/labores/")
def crear_labor(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    l = LaborCampo(**data)
    db.add(l)
    db.commit()
    db.refresh(l)
    return l


# ---- RESUMEN OPERACIONES ----
@router.get("/operaciones/resumen")
def resumen_operaciones(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    hoy = date.today()
    return {
        "reproduccion_activas": db.query(func.count(Reproduccion.id)).filter(Reproduccion.resultado == "preñada").scalar() or 0,
        "lactancias_activas": db.query(func.count(Lactancia.id)).filter(Lactancia.estado == "activa").scalar() or 0,
        "leche_hoy": (db.query(func.sum(Ordeno.total_dia)).filter(Ordeno.fecha == hoy).scalar()) or 0,
        "pesajes_mes": db.query(func.count(Pesaje.id)).filter(Pesaje.fecha >= hoy.replace(day=1)).scalar() or 0,
        "sanidad_mes": db.query(func.count(Sanidad.id)).filter(Sanidad.fecha >= hoy.replace(day=1)).scalar() or 0,
        "labores_mes": db.query(func.count(LaborCampo.id)).filter(LaborCampo.fecha >= hoy.replace(day=1)).scalar() or 0,
        "movimientos_mes": db.query(func.count(MovimientoAnimal.id)).filter(MovimientoAnimal.fecha >= hoy.replace(day=1)).scalar() or 0,
    }


# ---- PARTOS ----
@router.get("/partos/")
def listar_partos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Parto).order_by(Parto.fecha_parto.desc()).all()


@router.post("/partos/")
def crear_parto(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    p = Parto(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
