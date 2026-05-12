from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.models import Residuo, Compost, Usuario
from app.schemas import (
    ResiduoCreate, ResiduoOut,
    CompostCreate, CompostUpdate, CompostOut,
    EstadisticasResiduos,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/residuos", tags=["Residuos / Compost"])


def _format_residuo(r: Residuo) -> ResiduoOut:
    return ResiduoOut(
        id=r.id, finca_id=r.finca_id, tipo=r.tipo, origen=r.origen,
        cantidad_kg=float(r.cantidad_kg), fecha=r.fecha,
        disposicion=r.disposicion, observaciones=r.observaciones,
        created_at=r.created_at,
    )


def _format_compost(c: Compost) -> CompostOut:
    return CompostOut(
        id=c.id, finca_id=c.finca_id, nombre=c.nombre,
        fecha_inicio=c.fecha_inicio, fecha_estimada_fin=c.fecha_estimada_fin,
        fecha_fin=c.fecha_fin, materiales=c.materiales,
        volumen_m3=float(c.volumen_m3) if c.volumen_m3 else None,
        temperatura=float(c.temperatura) if c.temperatura else None,
        humedad=float(c.humedad) if c.humedad else None,
        estado=c.estado, observaciones=c.observaciones,
        created_at=c.created_at, updated_at=c.updated_at,
    )


@router.get("/", response_model=list[ResiduoOut])
def listar_residuos(
    tipo: Optional[str] = Query(None),
    origen: Optional[str] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Residuo).filter(Residuo.finca_id == current_user.finca_id)
    if tipo:
        q = q.filter(Residuo.tipo == tipo)
    if origen:
        q = q.filter(Residuo.origen == origen)
    if fecha_desde:
        q = q.filter(Residuo.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(Residuo.fecha <= fecha_hasta)
    return [_format_residuo(r) for r in q.order_by(Residuo.fecha.desc()).all()]


@router.post("/", response_model=ResiduoOut, status_code=201)
def registrar_residuo(
    payload: ResiduoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    residuo = Residuo(
        finca_id=current_user.finca_id,
        **payload.model_dump(),
    )
    db.add(residuo)
    db.commit()
    db.refresh(residuo)
    return _format_residuo(residuo)


@router.get("/compost", response_model=list[CompostOut])
def listar_compost(
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Compost).filter(Compost.finca_id == current_user.finca_id)
    if estado:
        q = q.filter(Compost.estado == estado)
    return [_format_compost(c) for c in q.order_by(Compost.fecha_inicio.desc()).all()]


@router.post("/compost", response_model=CompostOut, status_code=201)
def crear_compost(
    payload: CompostCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    compost = Compost(
        finca_id=current_user.finca_id,
        **payload.model_dump(),
    )
    db.add(compost)
    db.commit()
    db.refresh(compost)
    return _format_compost(compost)


@router.put("/compost/{compost_id}", response_model=CompostOut)
def actualizar_compost(
    compost_id: int,
    payload: CompostUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    compost = db.query(Compost).filter(
        Compost.id == compost_id,
        Compost.finca_id == current_user.finca_id,
    ).first()
    if not compost:
        raise HTTPException(status_code=404, detail="Lote de compost no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(compost, k, v)
    db.commit()
    db.refresh(compost)
    return _format_compost(compost)


@router.get("/estadisticas", response_model=EstadisticasResiduos)
def estadisticas_residuos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    finca_id = current_user.finca_id
    inicio_mes = date.today().replace(day=1)

    total_mes = float(
        db.query(func.coalesce(func.sum(Residuo.cantidad_kg), 0))
        .filter(Residuo.finca_id == finca_id, Residuo.fecha >= inicio_mes)
        .scalar() or 0
    )

    reciclado_kg = float(
        db.query(func.coalesce(func.sum(Residuo.cantidad_kg), 0))
        .filter(
            Residuo.finca_id == finca_id,
            Residuo.fecha >= inicio_mes,
            Residuo.disposicion.in_(["compost", "reciclaje", "lombricultivo"]),
        )
        .scalar() or 0
    )

    tasa_reciclaje = (reciclado_kg / total_mes * 100) if total_mes else 0

    compost_activo = db.query(func.count(Compost.id)).filter(
        Compost.finca_id == finca_id,
        Compost.estado.in_(["activo", "en_correccion"]),
    ).scalar() or 0

    proximo = db.query(Compost).filter(
        Compost.finca_id == finca_id,
        Compost.estado == "activo",
        Compost.fecha_estimada_fin.isnot(None),
    ).order_by(Compost.fecha_estimada_fin.asc()).first()

    desglose = (
        db.query(Residuo.tipo, func.sum(Residuo.cantidad_kg))
        .filter(Residuo.finca_id == finca_id, Residuo.fecha >= inicio_mes)
        .group_by(Residuo.tipo)
        .all()
    )

    return EstadisticasResiduos(
        total_residuos_mes=round(total_mes, 2),
        compost_activo=compost_activo,
        tasa_reciclaje_pct=round(tasa_reciclaje, 1),
        proximo_compost_listo=str(proximo.fecha_estimada_fin) if proximo else None,
        desglose_tipo=[{"tipo": t, "kg": round(float(k), 2)} for t, k in desglose],
    )
