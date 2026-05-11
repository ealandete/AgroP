from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.models import PlanActividad, Presupuesto, PresupuestoPartida, Usuario
from app.schemas import (
    PlanActividadCreate, PlanActividadOut,
    PresupuestoCreate, PresupuestoOut,
    PresupuestoPartidaCreate, PresupuestoPartidaOut,
    IndicadoresActividades,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Planeación"])


# --- Plan de Actividades ---

@router.get("/plan-actividades/", response_model=list[PlanActividadOut])
def listar_plan_actividades(
    tipo_actividad: Optional[str] = None,
    estado: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(PlanActividad)
    if tipo_actividad:
        q = q.filter(PlanActividad.tipo_actividad == tipo_actividad)
    if estado:
        q = q.filter(PlanActividad.estado == estado)
    if fecha_desde:
        q = q.filter(PlanActividad.fecha_programada >= fecha_desde)
    if fecha_hasta:
        q = q.filter(PlanActividad.fecha_programada <= fecha_hasta)
    if finca_id:
        q = q.filter(PlanActividad.finca_id == finca_id)
    return q.order_by(PlanActividad.fecha_programada).all()


@router.post("/plan-actividades/", response_model=PlanActividadOut, status_code=201)
def crear_plan_actividad(
    payload: PlanActividadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    actividad = PlanActividad(**payload.model_dump())
    db.add(actividad)
    db.commit()
    db.refresh(actividad)
    return actividad


@router.put("/plan-actividades/{id}", response_model=PlanActividadOut)
def actualizar_plan_actividad(
    id: int,
    payload: PlanActividadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    actividad = db.query(PlanActividad).filter(PlanActividad.id == id).first()
    if not actividad:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(actividad, k, v)
    db.commit()
    db.refresh(actividad)
    return actividad


@router.get("/indicadores-actividades/", response_model=IndicadoresActividades)
def indicadores_actividades(
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(PlanActividad)
    if finca_id:
        q = q.filter(PlanActividad.finca_id == finca_id)

    total = q.count()
    completadas = q.filter(PlanActividad.estado == "completada").count()
    vencidas = q.filter(
        PlanActividad.estado != "completada",
        PlanActividad.fecha_programada < date.today(),
    ).count()
    cumplimiento_pct = round((completadas / total * 100) if total > 0 else 0, 1)

    return IndicadoresActividades(
        total_programadas=total,
        completadas=completadas,
        vencidas=vencidas,
        cumplimiento_pct=cumplimiento_pct,
    )


# --- Presupuestos ---

@router.get("/presupuestos/", response_model=list[PresupuestoOut])
def listar_presupuestos(
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Presupuesto)
    if finca_id:
        q = q.filter(Presupuesto.finca_id == finca_id)
    presupuestos = q.order_by(Presupuesto.created_at.desc()).all()
    result = []
    for p in presupuestos:
        p_dict = {
            "id": p.id,
            "finca_id": p.finca_id,
            "nombre": p.nombre,
            "periodo": p.periodo,
            "monto_total": float(p.monto_total) if p.monto_total else 0,
            "estado": p.estado,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "partidas": [
                {
                    "id": pa.id,
                    "presupuesto_id": pa.presupuesto_id,
                    "nombre": pa.nombre,
                    "monto_estimado": float(pa.monto_estimado) if pa.monto_estimado else 0,
                    "monto_real": float(pa.monto_real) if pa.monto_real else 0,
                    "created_at": pa.created_at,
                }
                for pa in p.partidas
            ] if hasattr(p, "partidas") else [],
        }
        result.append(p_dict)
    return result


@router.post("/presupuestos/", response_model=PresupuestoOut, status_code=201)
def crear_presupuesto(
    payload: PresupuestoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    presupuesto = Presupuesto(**payload.model_dump())
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)
    return {
        "id": presupuesto.id,
        "finca_id": presupuesto.finca_id,
        "nombre": presupuesto.nombre,
        "periodo": presupuesto.periodo,
        "monto_total": float(presupuesto.monto_total) if presupuesto.monto_total else 0,
        "estado": presupuesto.estado,
        "created_at": presupuesto.created_at,
        "updated_at": presupuesto.updated_at,
        "partidas": [],
    }


@router.get("/presupuestos/{id}/partidas", response_model=list[PresupuestoPartidaOut])
def listar_partidas(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == id).first()
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return db.query(PresupuestoPartida).filter(
        PresupuestoPartida.presupuesto_id == id
    ).all()


@router.post("/presupuestos/{id}/partidas", response_model=PresupuestoPartidaOut, status_code=201)
def crear_actualizar_partida(
    id: int,
    payload: PresupuestoPartidaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == id).first()
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    partida = PresupuestoPartida(presupuesto_id=id, **payload.model_dump())
    db.add(partida)
    db.commit()
    db.refresh(partida)
    return partida
