from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    ConsumoInsumo, Inventario, Morbilidad, RegistroClimatico, Usuario, Insumo
)
from app.schemas import (
    ConsumoInsumoCreate, ConsumoInsumoOut,
    MorbilidadCreate, MorbilidadOut,
    RegistroClimaticoCreate, RegistroClimaticoOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Consumo y Registros"])


# --- Consumo de Insumos ---

@router.get("/consumo-insumos/", response_model=list[ConsumoInsumoOut])
def listar_consumo_insumos(
    tipo_consumo: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    animal_id: Optional[int] = None,
    siembra_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(ConsumoInsumo)
    if tipo_consumo:
        q = q.filter(ConsumoInsumo.tipo_consumo == tipo_consumo)
    if fecha_desde:
        q = q.filter(ConsumoInsumo.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(ConsumoInsumo.fecha <= fecha_hasta)
    if animal_id:
        q = q.filter(ConsumoInsumo.animal_id == animal_id)
    if siembra_id:
        q = q.filter(ConsumoInsumo.siembra_id == siembra_id)
    return q.order_by(ConsumoInsumo.fecha.desc()).all()


@router.post("/consumo-insumos/", response_model=ConsumoInsumoOut, status_code=201)
def crear_consumo_insumo(
    payload: ConsumoInsumoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    insumo = db.query(Insumo).filter(Insumo.id == payload.insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    consumo = ConsumoInsumo(**payload.model_dump())
    db.add(consumo)

    inv_items = (
        db.query(Inventario)
        .filter(
            Inventario.insumo_id == payload.insumo_id,
            Inventario.cantidad > 0,
        )
        .order_by(Inventario.fecha_ingreso.asc())
        .all()
    )
    restante = payload.cantidad
    for item in inv_items:
        if restante <= 0:
            break
        disponible = float(item.cantidad)
        if disponible >= restante:
            item.cantidad = disponible - restante
            restante = 0
        else:
            item.cantidad = 0
            restante -= disponible

    db.commit()
    db.refresh(consumo)
    return consumo


# --- Morbilidad ---

@router.get("/morbilidad/", response_model=list[MorbilidadOut])
def listar_morbilidad(
    especie: Optional[str] = None,
    estado_actual: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Morbilidad)
    if especie:
        q = q.filter(Morbilidad.especie == especie)
    if estado_actual:
        q = q.filter(Morbilidad.estado_actual == estado_actual)
    if fecha_desde:
        q = q.filter(Morbilidad.fecha_deteccion >= fecha_desde)
    return q.order_by(Morbilidad.fecha_deteccion.desc()).all()


@router.post("/morbilidad/", response_model=MorbilidadOut, status_code=201)
def crear_morbilidad(
    payload: MorbilidadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    record = Morbilidad(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# --- Registros Climáticos ---

@router.get("/registros-climaticos/", response_model=list[RegistroClimaticoOut])
def listar_registros_climaticos(
    finca_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(RegistroClimatico)
    if finca_id:
        q = q.filter(RegistroClimatico.finca_id == finca_id)
    if fecha_desde:
        q = q.filter(RegistroClimatico.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(RegistroClimatico.fecha <= fecha_hasta)
    return q.order_by(RegistroClimatico.fecha.desc()).all()


@router.post("/registros-climaticos/", response_model=RegistroClimaticoOut, status_code=201)
def crear_registro_climatico(
    payload: RegistroClimaticoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    record = RegistroClimatico(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
