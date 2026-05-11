from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    Animal, MovimientoAnimal, Finca, Insumo, TransferenciaInsumo,
    Venta, Costo, Usuario,
)
from app.schemas import (
    TransferirAnimalRequest, TransferenciaInsumoCreate,
    TransferenciaInsumoOut, ConsolidadoContable, ConsolidadoFinca,
    AnimalOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Transferencias y Consolidado"])


@router.post("/animales/transferir", response_model=AnimalOut)
def transferir_animal(
    payload: TransferirAnimalRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == payload.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")

    animal.finca_id = payload.finca_destino_id
    movimiento = MovimientoAnimal(
        animal_id=payload.animal_id,
        fecha=payload.fecha,
        tipo="traslado_interno",
        origen=str(payload.finca_origen_id),
        destino=str(payload.finca_destino_id),
        motivo=payload.motivo,
    )
    db.add(movimiento)
    db.commit()
    db.refresh(animal)
    return animal


@router.get("/transferencias-insumos/", response_model=list[TransferenciaInsumoOut])
def listar_transferencias_insumos(
    finca_origen_id: Optional[int] = None,
    finca_destino_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(TransferenciaInsumo).options(
        joinedload(TransferenciaInsumo.insumo),
        joinedload(TransferenciaInsumo.finca_origen),
        joinedload(TransferenciaInsumo.finca_destino),
    )
    if finca_origen_id:
        q = q.filter(TransferenciaInsumo.finca_origen_id == finca_origen_id)
    if finca_destino_id:
        q = q.filter(TransferenciaInsumo.finca_destino_id == finca_destino_id)
    if fecha_desde:
        q = q.filter(TransferenciaInsumo.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(TransferenciaInsumo.fecha <= fecha_hasta)
    resultados = []
    for t in q.order_by(TransferenciaInsumo.fecha.desc()).all():
        resultados.append(TransferenciaInsumoOut(
            id=t.id,
            insumo_id=t.insumo_id,
            cantidad=float(t.cantidad),
            finca_origen_id=t.finca_origen_id,
            finca_destino_id=t.finca_destino_id,
            fecha=t.fecha,
            costo_unitario=float(t.costo_unitario) if t.costo_unitario else None,
            tipo=t.tipo,
            observaciones=t.observaciones,
            created_at=t.created_at,
            insumo_nombre=t.insumo.nombre if t.insumo else None,
            finca_origen_nombre=t.finca_origen.nombre if t.finca_origen else None,
            finca_destino_nombre=t.finca_destino.nombre if t.finca_destino else None,
        ))
    return resultados


@router.post("/transferencias-insumos/", response_model=TransferenciaInsumoOut, status_code=201)
def crear_transferencia_insumo(
    payload: TransferenciaInsumoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    reg = TransferenciaInsumo(**payload.model_dump())
    db.add(reg)
    db.commit()
    db.refresh(reg)

    db.refresh(reg, attribute_names=["insumo", "finca_origen", "finca_destino"])
    return TransferenciaInsumoOut(
        id=reg.id,
        insumo_id=reg.insumo_id,
        cantidad=float(reg.cantidad),
        finca_origen_id=reg.finca_origen_id,
        finca_destino_id=reg.finca_destino_id,
        fecha=reg.fecha,
        costo_unitario=float(reg.costo_unitario) if reg.costo_unitario else None,
        tipo=reg.tipo,
        observaciones=reg.observaciones,
        created_at=reg.created_at,
        insumo_nombre=reg.insumo.nombre if reg.insumo else None,
        finca_origen_nombre=reg.finca_origen.nombre if reg.finca_origen else None,
        finca_destino_nombre=reg.finca_destino.nombre if reg.finca_destino else None,
    )


@router.get("/consolidado-contable/", response_model=ConsolidadoContable)
def consolidado_contable(
    finca_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q_ventas = db.query(Venta)
    q_costos = db.query(Costo)
    q_animales = db.query(Animal)
    q_fincas = db.query(Finca)

    if finca_id:
        q_ventas = q_ventas.filter(Venta.finca_id == finca_id)
        q_costos = q_costos.filter(Costo.finca_id == finca_id)
        q_animales = q_animales.filter(Animal.finca_id == finca_id)

    total_ingresos = sum(float(v.total or 0) for v in q_ventas.all())
    total_gastos = sum(float(c.monto or 0) for c in q_costos.all())
    total_animales = q_animales.filter(Animal.activo == True).count()
    area_total = sum(float(f.area_total or 0) for f in q_fincas.all())

    balance = total_ingresos - total_gastos
    margen = (balance / total_ingresos * 100) if total_ingresos > 0 else 0

    fincas = db.query(Finca).filter(Finca.activo == True).all()
    ingreso_por_finca = []
    gasto_por_finca = []

    for f in fincas:
        ing_f = sum(float(v.total or 0) for v in db.query(Venta).filter(Venta.finca_id == f.id).all())
        gas_f = sum(float(c.monto or 0) for c in db.query(Costo).filter(Costo.finca_id == f.id).all())
        ingreso_por_finca.append(ConsolidadoFinca(
            finca_id=f.id, finca_nombre=f.nombre,
            total_ingresos=ing_f, total_gastos=gas_f, balance=ing_f - gas_f,
        ))
        gasto_por_finca.append(ConsolidadoFinca(
            finca_id=f.id, finca_nombre=f.nombre,
            total_ingresos=ing_f, total_gastos=gas_f, balance=ing_f - gas_f,
        ))

    return ConsolidadoContable(
        total_ingresos=total_ingresos,
        total_gastos=total_gastos,
        balance=balance,
        margen=margen,
        ingreso_por_finca=ingreso_por_finca,
        gasto_por_finca=gasto_por_finca,
        total_animales=total_animales,
        area_total=area_total,
    )
