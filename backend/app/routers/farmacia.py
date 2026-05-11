from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db
from app.models import Medicamento, InventarioFarmacia, AplicacionMedicamento, Animal, Usuario
from app.schemas import (
    MedicamentoCreate, MedicamentoUpdate, MedicamentoOut,
    InventarioFarmaciaCreate, InventarioFarmaciaOut,
    AplicacionMedicamentoCreate, AplicacionMedicamentoOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/farmacia", tags=["Farmacia"])


def _calc_stock(db, medicina_id):
    return float(
        db.query(func.coalesce(func.sum(InventarioFarmacia.cantidad), 0))
        .filter(InventarioFarmacia.medicina_id == medicina_id)
        .scalar() or 0
    )


def _format_medicamento(m, db):
    return MedicamentoOut(
        id=m.id, nombre=m.nombre,
        principio_activo=m.principio_activo,
        categoria=m.categoria, presentacion=m.presentacion,
        concentracion=m.concentracion, via_admin=m.via_admin,
        dosis_referencia=m.dosis_referencia,
        intervalo_retiro=m.intervalo_retiro,
        fabricante=m.fabricante,
        requiere_receta=m.requiere_receta,
        activo=m.activo, created_at=m.created_at,
        stock_actual=_calc_stock(db, m.id),
    )


@router.get("/", response_model=list[MedicamentoOut])
def listar_medicamentos(
    categoria: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Medicamento)
    if categoria:
        q = q.filter(Medicamento.categoria == categoria)
    if activo is not None:
        q = q.filter(Medicamento.activo == activo)
    medicamentos = q.order_by(Medicamento.nombre).all()
    return [_format_medicamento(m, db) for m in medicamentos]


@router.post("/", response_model=MedicamentoOut, status_code=201)
def crear_medicamento(
    payload: MedicamentoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    medicamento = Medicamento(**payload.model_dump())
    db.add(medicamento)
    db.commit()
    db.refresh(medicamento)
    return _format_medicamento(medicamento, db)


@router.put("/{medicamento_id}", response_model=MedicamentoOut)
def actualizar_medicamento(
    medicamento_id: int,
    payload: MedicamentoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    med = db.query(Medicamento).filter(Medicamento.id == medicamento_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(med, k, v)
    db.commit()
    db.refresh(med)
    return _format_medicamento(med, db)


@router.delete("/{medicamento_id}")
def eliminar_medicamento(
    medicamento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    med = db.query(Medicamento).filter(Medicamento.id == medicamento_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    med.activo = False
    db.commit()
    return {"mensaje": "Medicamento desactivado correctamente"}


@router.get("/inventario", response_model=list[InventarioFarmaciaOut])
def listar_inventario(
    medicina_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(InventarioFarmacia)
    if medicina_id:
        q = q.filter(InventarioFarmacia.medicina_id == medicina_id)
    items = q.order_by(InventarioFarmacia.fecha_vencimiento.asc()).all()
    result = []
    for i in items:
        med = db.query(Medicamento).filter(Medicamento.id == i.medicina_id).first()
        result.append(InventarioFarmaciaOut(
            id=i.id, medicina_id=i.medicina_id, lote=i.lote,
            cantidad=i.cantidad, fecha_vencimiento=i.fecha_vencimiento,
            created_at=i.created_at,
            medicina_nombre=med.nombre if med else None,
        ))
    return result


@router.post("/inventario", response_model=InventarioFarmaciaOut, status_code=201)
def agregar_stock(
    payload: InventarioFarmaciaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    med = db.query(Medicamento).filter(Medicamento.id == payload.medicina_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")
    item = InventarioFarmacia(
        medicina_id=payload.medicina_id,
        lote=payload.lote,
        cantidad=payload.cantidad,
        fecha_vencimiento=payload.fecha_vencimiento,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return InventarioFarmaciaOut(
        id=item.id, medicina_id=item.medicina_id, lote=item.lote,
        cantidad=item.cantidad, fecha_vencimiento=item.fecha_vencimiento,
        created_at=item.created_at,
        medicina_nombre=med.nombre,
    )


@router.get("/aplicaciones", response_model=list[AplicacionMedicamentoOut])
def listar_aplicaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    items = db.query(AplicacionMedicamento).order_by(
        AplicacionMedicamento.fecha.desc()
    ).all()
    result = []
    for a in items:
        animal = db.query(Animal).filter(Animal.id == a.animal_id).first()
        med = db.query(Medicamento).filter(Medicamento.id == a.medicina_id).first()
        result.append(AplicacionMedicamentoOut(
            id=a.id, animal_id=a.animal_id, medicina_id=a.medicina_id,
            fecha=a.fecha, dosis=a.dosis, responsable=a.responsable,
            created_at=a.created_at,
            animal_codigo=animal.codigo if animal else None,
            medicina_nombre=med.nombre if med else None,
        ))
    return result


@router.post("/aplicaciones", response_model=AplicacionMedicamentoOut, status_code=201)
def registrar_aplicacion(
    payload: AplicacionMedicamentoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == payload.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    med = db.query(Medicamento).filter(Medicamento.id == payload.medicina_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicamento no encontrado")

    stock_total = _calc_stock(db, payload.medicina_id)
    if stock_total <= 0:
        raise HTTPException(status_code=400, detail="No hay stock disponible para este medicamento")

    inv_item = db.query(InventarioFarmacia).filter(
        InventarioFarmacia.medicina_id == payload.medicina_id,
        InventarioFarmacia.cantidad > 0,
    ).order_by(InventarioFarmacia.fecha_vencimiento.asc()).first()
    if inv_item:
        inv_item.cantidad -= 1

    aplicacion = AplicacionMedicamento(
        animal_id=payload.animal_id,
        medicina_id=payload.medicina_id,
        fecha=payload.fecha,
        dosis=payload.dosis,
        responsable=payload.responsable or f"{current_user.nombre} {current_user.apellido or ''}".strip(),
    )
    db.add(aplicacion)
    db.commit()
    db.refresh(aplicacion)
    return AplicacionMedicamentoOut(
        id=aplicacion.id, animal_id=aplicacion.animal_id,
        medicina_id=aplicacion.medicina_id,
        fecha=aplicacion.fecha, dosis=aplicacion.dosis,
        responsable=aplicacion.responsable,
        created_at=aplicacion.created_at,
        animal_codigo=animal.codigo,
        medicina_nombre=med.nombre,
    )
