from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from typing import Optional

from app.database import get_db
from app.models import Sensor, LecturaSensor, Lote
from app.schemas import (
    SensorCreate, SensorUpdate, SensorOut,
    LecturaSensorCreate, LecturaSensorOut, SensorResumen
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/sensores", tags=["Sensores / Estaciones"])


@router.get("/", response_model=list[SensorOut])
def listar_sensores(
    finca_id: Optional[int] = Query(None),
    tipo: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Sensor)
    if finca_id:
        q = q.filter(Sensor.finca_id == finca_id)
    if tipo:
        q = q.filter(Sensor.tipo == tipo)
    if activo is not None:
        q = q.filter(Sensor.activo == activo)
    sensores = q.order_by(Sensor.nombre).all()
    result = []
    for s in sensores:
        d = {c.name: getattr(s, c.name) for c in Sensor.__table__.columns}
        d["lote_nombre"] = s.lote.nombre if s.lote else None
        ultima = db.query(LecturaSensor).filter(
            LecturaSensor.sensor_id == s.id
        ).order_by(desc(LecturaSensor.fecha)).first()
        if ultima:
            d["ultima_lectura"] = {"fecha": ultima.fecha.isoformat(), "variable": ultima.variable, "valor": float(ultima.valor), "unidad": ultima.unidad}
        result.append(d)
    return result


@router.post("/", response_model=SensorOut, status_code=201)
def crear_sensor(payload: SensorCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    lote = db.query(Lote).filter(Lote.id == sensor.lote_id).first()
    sensor.lote_nombre = lote.nombre if lote else None
    return sensor


@router.put("/{sensor_id}", response_model=SensorOut)
def actualizar_sensor(sensor_id: int, payload: SensorUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(sensor, k, v)
    db.commit()
    db.refresh(sensor)
    lote = db.query(Lote).filter(Lote.id == sensor.lote_id).first()
    sensor.lote_nombre = lote.nombre if lote else None
    return sensor


@router.delete("/{sensor_id}")
def eliminar_sensor(sensor_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    sensor.activo = False
    db.commit()
    return {"message": "Sensor desactivado"}


@router.get("/{sensor_id}/lecturas", response_model=list[LecturaSensorOut])
def listar_lecturas(
    sensor_id: int,
    fecha_desde: Optional[datetime] = Query(None),
    fecha_hasta: Optional[datetime] = Query(None),
    variable: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    q = db.query(LecturaSensor).filter(LecturaSensor.sensor_id == sensor_id)
    if fecha_desde:
        q = q.filter(LecturaSensor.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(LecturaSensor.fecha <= fecha_hasta)
    if variable:
        q = q.filter(LecturaSensor.variable == variable)
    return q.order_by(desc(LecturaSensor.fecha)).all()


@router.post("/{sensor_id}/lecturas", response_model=LecturaSensorOut, status_code=201)
def crear_lectura(sensor_id: int, payload: LecturaSensorCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    lectura = LecturaSensor(sensor_id=sensor_id, **payload.model_dump())
    db.add(lectura)
    db.commit()
    db.refresh(lectura)
    return lectura


@router.get("/{sensor_id}/ultima-lectura")
def ultima_lectura(sensor_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    variables = sensor.variables_medidas or []
    if isinstance(variables, list) and len(variables) > 0:
        result = {}
        for var in variables:
            ultima = db.query(LecturaSensor).filter(
                LecturaSensor.sensor_id == sensor_id, LecturaSensor.variable == var
            ).order_by(desc(LecturaSensor.fecha)).first()
            if ultima:
                result[var] = {"fecha": ultima.fecha.isoformat(), "valor": float(ultima.valor), "unidad": ultima.unidad}
        return result
    ultima = db.query(LecturaSensor).filter(
        LecturaSensor.sensor_id == sensor_id
    ).order_by(desc(LecturaSensor.fecha)).first()
    if not ultima:
        return {}
    return {ultima.variable: {"fecha": ultima.fecha.isoformat(), "valor": float(ultima.valor), "unidad": ultima.unidad}}


@router.get("/resumen", response_model=SensorResumen)
def resumen_sensores(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total = db.query(Sensor).count()
    activos = db.query(Sensor).filter(Sensor.activo == True).count()
    estaciones = db.query(Sensor).filter(Sensor.tipo == "estacion_meteorologica").count()
    ultimas = db.query(LecturaSensor).order_by(desc(LecturaSensor.fecha)).limit(10).all()
    ultimas_list = []
    for u in ultimas:
        sens = db.query(Sensor).filter(Sensor.id == u.sensor_id).first()
        ultimas_list.append({
            "sensor_id": u.sensor_id,
            "sensor_nombre": sens.nombre if sens else None,
            "fecha": u.fecha.isoformat(),
            "variable": u.variable,
            "valor": float(u.valor),
            "unidad": u.unidad,
        })
    return SensorResumen(total_sensores=total, activos=activos, estaciones_meteorologicas=estaciones, ultimas_lecturas=ultimas_list)
