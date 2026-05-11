from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.models import FuenteAgua, ConsumoAgua, CalidadAgua, Lote, Usuario
from app.schemas import (
    FuenteAguaCreate, FuenteAguaUpdate, FuenteAguaOut,
    ConsumoAguaCreate, ConsumoAguaOut,
    CalidadAguaCreate, CalidadAguaOut,
    ResumenAgua,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/agua", tags=["Agua / Riego"])


def _format_fuente(f):
    return FuenteAguaOut(
        id=f.id, finca_id=f.finca_id, nombre=f.nombre, tipo=f.tipo,
        caudal_lps=float(f.caudal_lps) if f.caudal_lps else None,
        coordenadas=f.coordenadas,
        profundidad_m=float(f.profundidad_m) if f.profundidad_m else None,
        activo=f.activo,
        created_at=f.created_at, updated_at=f.updated_at,
    )


@router.get("/fuentes/", response_model=list[FuenteAguaOut])
def listar_fuentes(
    finca_id: Optional[int] = Query(None),
    tipo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(FuenteAgua)
    if finca_id:
        q = q.filter(FuenteAgua.finca_id == finca_id)
    if tipo:
        q = q.filter(FuenteAgua.tipo == tipo)
    return [_format_fuente(f) for f in q.order_by(FuenteAgua.nombre).all()]


@router.post("/fuentes/", response_model=FuenteAguaOut, status_code=201)
def crear_fuente(
    payload: FuenteAguaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    fuente = FuenteAgua(**payload.model_dump())
    db.add(fuente)
    db.commit()
    db.refresh(fuente)
    return _format_fuente(fuente)


@router.put("/fuentes/{fuente_id}", response_model=FuenteAguaOut)
def actualizar_fuente(
    fuente_id: int,
    payload: FuenteAguaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    fuente = db.query(FuenteAgua).filter(FuenteAgua.id == fuente_id).first()
    if not fuente:
        raise HTTPException(status_code=404, detail="Fuente de agua no encontrada")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(fuente, k, v)
    db.commit()
    db.refresh(fuente)
    return _format_fuente(fuente)


@router.get("/consumo/", response_model=list[ConsumoAguaOut])
def listar_consumo(
    fuente_id: Optional[int] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(ConsumoAgua)
    if fuente_id:
        q = q.filter(ConsumoAgua.fuente_id == fuente_id)
    if fecha_desde:
        q = q.filter(ConsumoAgua.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(ConsumoAgua.fecha <= fecha_hasta)
    resultados = q.order_by(ConsumoAgua.fecha.desc()).all()
    out = []
    for c in resultados:
        fuente = db.query(FuenteAgua).filter(FuenteAgua.id == c.fuente_id).first()
        lote = db.query(Lote).filter(Lote.id == c.lote_id).first() if c.lote_id else None
        out.append(ConsumoAguaOut(
            id=c.id, fuente_id=c.fuente_id, fecha=c.fecha,
            cantidad_m3=float(c.cantidad_m3), tipo_uso=c.tipo_uso,
            lote_id=c.lote_id, observaciones=c.observaciones,
            created_at=c.created_at,
            fuente_nombre=fuente.nombre if fuente else None,
            lote_nombre=lote.nombre if lote else None,
        ))
    return out


@router.post("/consumo/", response_model=ConsumoAguaOut, status_code=201)
def registrar_consumo(
    payload: ConsumoAguaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    fuente = db.query(FuenteAgua).filter(FuenteAgua.id == payload.fuente_id).first()
    if not fuente:
        raise HTTPException(status_code=404, detail="Fuente de agua no encontrada")
    consumo = ConsumoAgua(**payload.model_dump())
    db.add(consumo)
    db.commit()
    db.refresh(consumo)
    lote = db.query(Lote).filter(Lote.id == consumo.lote_id).first() if consumo.lote_id else None
    return ConsumoAguaOut(
        id=consumo.id, fuente_id=consumo.fuente_id, fecha=consumo.fecha,
        cantidad_m3=float(consumo.cantidad_m3), tipo_uso=consumo.tipo_uso,
        lote_id=consumo.lote_id, observaciones=consumo.observaciones,
        created_at=consumo.created_at,
        fuente_nombre=fuente.nombre,
        lote_nombre=lote.nombre if lote else None,
    )


@router.get("/calidad/", response_model=list[CalidadAguaOut])
def listar_calidad(
    fuente_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(CalidadAgua)
    if fuente_id:
        q = q.filter(CalidadAgua.fuente_id == fuente_id)
    resultados = q.order_by(CalidadAgua.fecha.desc()).all()
    out = []
    for c in resultados:
        fuente = db.query(FuenteAgua).filter(FuenteAgua.id == c.fuente_id).first()
        out.append(CalidadAguaOut(
            id=c.id, fuente_id=c.fuente_id, fecha=c.fecha,
            ph=float(c.ph) if c.ph else None,
            turbiedad_ntu=float(c.turbiedad_ntu) if c.turbiedad_ntu else None,
            coliformes=c.coliformes,
            conductividad=float(c.conductividad) if c.conductividad else None,
            observaciones=c.observaciones,
            created_at=c.created_at,
            fuente_nombre=fuente.nombre if fuente else None,
        ))
    return out


@router.post("/calidad/", response_model=CalidadAguaOut, status_code=201)
def registrar_calidad(
    payload: CalidadAguaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    fuente = db.query(FuenteAgua).filter(FuenteAgua.id == payload.fuente_id).first()
    if not fuente:
        raise HTTPException(status_code=404, detail="Fuente de agua no encontrada")
    calidad = CalidadAgua(**payload.model_dump())
    db.add(calidad)
    db.commit()
    db.refresh(calidad)
    return CalidadAguaOut(
        id=calidad.id, fuente_id=calidad.fuente_id, fecha=calidad.fecha,
        ph=float(calidad.ph) if calidad.ph else None,
        turbiedad_ntu=float(calidad.turbiedad_ntu) if calidad.turbiedad_ntu else None,
        coliformes=calidad.coliformes,
        conductividad=float(calidad.conductividad) if calidad.conductividad else None,
        observaciones=calidad.observaciones,
        created_at=calidad.created_at,
        fuente_nombre=fuente.nombre,
    )


@router.get("/resumen", response_model=ResumenAgua)
def resumen_agua(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    total_fuentes = db.query(func.count(FuenteAgua.id)).scalar() or 0
    fuentes_activas = db.query(func.count(FuenteAgua.id)).filter(FuenteAgua.activo == True).scalar() or 0

    inicio_mes = date.today().replace(day=1)
    consumo_mes = float(
        db.query(func.coalesce(func.sum(ConsumoAgua.cantidad_m3), 0))
        .filter(ConsumoAgua.fecha >= inicio_mes)
        .scalar() or 0
    )

    ultimo_test = (
        db.query(CalidadAgua)
        .order_by(CalidadAgua.fecha.desc())
        .first()
    )
    calidad_info = None
    if ultimo_test:
        fuente_cal = db.query(FuenteAgua).filter(FuenteAgua.id == ultimo_test.fuente_id).first()
        calidad_info = {
            "fecha": str(ultimo_test.fecha),
            "fuente": fuente_cal.nombre if fuente_cal else None,
            "ph": float(ultimo_test.ph) if ultimo_test.ph else None,
        }

    alertas = 0
    fuentes_sin_caudal = (
        db.query(FuenteAgua)
        .filter(FuenteAgua.activo == True, FuenteAgua.caudal_lps == None)
        .count()
    )
    alertas += fuentes_sin_caudal

    return ResumenAgua(
        total_fuentes=total_fuentes,
        fuentes_activas=fuentes_activas,
        consumo_mes=consumo_mes,
        calidad_ultimo_test=calidad_info,
        alertas=alertas,
    )
