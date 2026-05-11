from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db
from app.models import Equipo, Mantenimiento, Usuario
from app.schemas import (
    EquipoCreate, EquipoUpdate, EquipoOut,
    MantenimientoCreate, MantenimientoUpdate, MantenimientoOut,
    AlertaMantenimientoOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/equipos", tags=["Equipos"])


@router.get("/", response_model=list[EquipoOut])
def listar_equipos(
    finca_id: Optional[int] = None,
    categoria: Optional[str] = None,
    activo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Equipo)
    if finca_id:
        q = q.filter(Equipo.finca_id == finca_id)
    if categoria:
        q = q.filter(Equipo.categoria == categoria)
    if activo is not None:
        q = q.filter(Equipo.activo == activo)
    return q.order_by(Equipo.nombre).all()


@router.get("/alertas-mantenimiento", response_model=list[AlertaMantenimientoOut])
def alertas_mantenimiento(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    limite = hoy + timedelta(days=30)
    alertas = []
    equipos = db.query(Equipo).filter(Equipo.activo == True, Equipo.estado != "baja").all()
    for eq in equipos:
        ultimo = db.query(func.max(Mantenimiento.fecha)).filter(
            Mantenimiento.equipo_id == eq.id,
            Mantenimiento.proximo_mantenimiento_fecha.isnot(None),
        ).scalar()

        dias_restantes = None
        if eq.proximo_mantenimiento_km is not None or eq.proximo_mantenimiento_horas is not None:
            dias_restantes = 0

        if ultimo:
            dias_desde_ultimo = (hoy - ultimo).days
            dias_restantes = max(30 - dias_desde_ultimo, 0)

        alertas.append(AlertaMantenimientoOut(
            equipo_id=eq.id,
            equipo_nombre=eq.nombre,
            equipo_marca=eq.marca,
            equipo_modelo=eq.modelo,
            categoria=eq.categoria,
            proximo_mantenimiento_km=eq.proximo_mantenimiento_km,
            proximo_mantenimiento_horas=eq.proximo_mantenimiento_horas,
            ultimo_mantenimiento_fecha=ultimo,
            dias_restantes=dias_restantes,
        ))

    return alertas


@router.get("/{equipo_id}", response_model=EquipoOut)
def obtener_equipo(equipo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    equipo = db.query(Equipo).filter(Equipo.id == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    return equipo


@router.post("/", response_model=EquipoOut, status_code=201)
def crear_equipo(payload: EquipoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    equipo = Equipo(**payload.model_dump())
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return equipo


@router.put("/{equipo_id}", response_model=EquipoOut)
def actualizar_equipo(equipo_id: int, payload: EquipoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    equipo = db.query(Equipo).filter(Equipo.id == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(equipo, k, v)
    db.commit()
    db.refresh(equipo)
    return equipo


@router.delete("/{equipo_id}")
def eliminar_equipo(equipo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    equipo = db.query(Equipo).filter(Equipo.id == equipo_id).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado")
    equipo.activo = False
    db.commit()
    return {"detail": "Equipo desactivado"}


@router.get("/{equipo_id}/mantenimientos", response_model=list[MantenimientoOut])
def listar_mantenimientos(equipo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Mantenimiento).filter(
        Mantenimiento.equipo_id == equipo_id
    ).order_by(Mantenimiento.fecha.desc()).all()


@router.post("/{equipo_id}/mantenimientos", response_model=MantenimientoOut, status_code=201)
def crear_mantenimiento(equipo_id: int, payload: MantenimientoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    payload.equipo_id = equipo_id
    mantenimiento = Mantenimiento(**payload.model_dump())
    db.add(mantenimiento)
    db.commit()
    db.refresh(mantenimiento)
    return mantenimiento


@router.put("/mantenimientos/{mantenimiento_id}", response_model=MantenimientoOut)
def actualizar_mantenimiento(mantenimiento_id: int, payload: MantenimientoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    mantenimiento = db.query(Mantenimiento).filter(Mantenimiento.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(mantenimiento, k, v)
    db.commit()
    db.refresh(mantenimiento)
    return mantenimiento
