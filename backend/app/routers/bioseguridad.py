from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db
from app.models import VisitaBioseguridad, Desinfeccion, IngresoVehiculo, Usuario
from app.schemas import (
    VisitaCreate, VisitaUpdateSalida, VisitaOut,
    DesinfeccionCreate, DesinfeccionOut,
    VehiculoCreate, VehiculoOut,
    ResumenBioseguridad,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/bioseguridad", tags=["Bioseguridad"])


@router.get("/visitas/", response_model=list[VisitaOut])
def listar_visitas(
    fecha: Optional[date] = None,
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(VisitaBioseguridad)
    if fecha:
        q = q.filter(func.date(VisitaBioseguridad.fecha_ingreso) == fecha)
    if finca_id:
        q = q.filter(VisitaBioseguridad.finca_id == finca_id)
    return q.order_by(VisitaBioseguridad.fecha_ingreso.desc()).all()


@router.post("/visitas/", response_model=VisitaOut, status_code=201)
def crear_visita(
    payload: VisitaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    visita = VisitaBioseguridad(**payload.model_dump())
    db.add(visita)
    db.commit()
    db.refresh(visita)
    return visita


@router.put("/visitas/{visita_id}", response_model=VisitaOut)
def registrar_salida(
    visita_id: int,
    payload: VisitaUpdateSalida,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    visita = db.query(VisitaBioseguridad).filter(VisitaBioseguridad.id == visita_id).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    visita.fecha_salida = payload.fecha_salida
    if payload.observaciones:
        visita.observaciones = payload.observaciones
    db.commit()
    db.refresh(visita)
    return visita


@router.get("/desinfeccion/", response_model=list[DesinfeccionOut])
def listar_desinfecciones(
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Desinfeccion)
    if finca_id:
        q = q.filter(Desinfeccion.finca_id == finca_id)
    return q.order_by(Desinfeccion.fecha.desc()).all()


@router.post("/desinfeccion/", response_model=DesinfeccionOut, status_code=201)
def crear_desinfeccion(
    payload: DesinfeccionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    desinfeccion = Desinfeccion(**payload.model_dump())
    db.add(desinfeccion)
    db.commit()
    db.refresh(desinfeccion)
    return desinfeccion


@router.get("/vehiculos/", response_model=list[VehiculoOut])
def listar_vehiculos(
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(IngresoVehiculo)
    if finca_id:
        q = q.filter(IngresoVehiculo.finca_id == finca_id)
    return q.order_by(IngresoVehiculo.fecha.desc()).all()


@router.post("/vehiculos/", response_model=VehiculoOut, status_code=201)
def crear_vehiculo(
    payload: VehiculoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    vehiculo = IngresoVehiculo(**payload.model_dump())
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.get("/resumen", response_model=ResumenBioseguridad)
def resumen_bioseguridad(
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)

    q_visitas = db.query(func.count(VisitaBioseguridad.id))
    q_desinf = db.query(func.count(Desinfeccion.id))
    q_vehic = db.query(func.count(IngresoVehiculo.id))

    if finca_id:
        q_visitas = q_visitas.filter(VisitaBioseguridad.finca_id == finca_id)
        q_desinf = q_desinf.filter(Desinfeccion.finca_id == finca_id)
        q_vehic = q_vehic.filter(IngresoVehiculo.finca_id == finca_id)

    visitas_mes = q_visitas.filter(func.date(VisitaBioseguridad.fecha_ingreso) >= inicio_mes).scalar() or 0
    desinfecciones_mes = q_desinf.filter(Desinfeccion.fecha >= inicio_mes).scalar() or 0
    vehiculos_mes = q_vehic.filter(IngresoVehiculo.fecha >= inicio_mes).scalar() or 0

    q_sin_desinf = db.query(func.count(IngresoVehiculo.id))
    if finca_id:
        q_sin_desinf = q_sin_desinf.filter(IngresoVehiculo.finca_id == finca_id)
    sin_desinfeccion = q_sin_desinf.filter(
        IngresoVehiculo.desinfeccion_si_no == False,
        IngresoVehiculo.fecha >= inicio_mes,
    ).scalar() or 0

    return ResumenBioseguridad(
        visitas_mes=visitas_mes,
        desinfecciones_mes=desinfecciones_mes,
        vehiculos_mes=vehiculos_mes,
        alertas_bioseguridad=sin_desinfeccion,
    )
