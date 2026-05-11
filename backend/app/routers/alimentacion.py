from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    Alimento, Dieta, DietaComponente, ConsumoDiario,
    Lote, Animal, Usuario,
)
from app.schemas import (
    AlimentoCreate, AlimentoUpdate, AlimentoOut,
    DietaCreate, DietaOut,
    DietaComponenteCreate, DietaComponenteOut,
    ConsumoDiarioCreate, ConsumoDiarioOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Alimentacion"])


# ─── Alimentos ───────────────────────────────────────────────

@router.get("/alimentos/", response_model=list[AlimentoOut])
def listar_alimentos(
    categoria: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Alimento)
    if categoria:
        q = q.filter(Alimento.categoria == categoria)
    if activo is not None:
        q = q.filter(Alimento.activo == activo)
    return q.order_by(Alimento.nombre).all()


@router.post("/alimentos/", response_model=AlimentoOut, status_code=201)
def crear_alimento(
    payload: AlimentoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    alimento = Alimento(**payload.model_dump())
    db.add(alimento)
    db.commit()
    db.refresh(alimento)
    return alimento


@router.put("/alimentos/{alimento_id}", response_model=AlimentoOut)
def actualizar_alimento(
    alimento_id: int,
    payload: AlimentoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    alim = db.query(Alimento).filter(Alimento.id == alimento_id).first()
    if not alim:
        raise HTTPException(status_code=404, detail="Alimento no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(alim, k, v)
    db.commit()
    db.refresh(alim)
    return alim


# ─── Dietas ──────────────────────────────────────────────────

@router.get("/dietas/", response_model=list[DietaOut])
def listar_dietas(
    tipo: Optional[str] = Query(None),
    especie: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Dieta)
    if tipo:
        q = q.filter(Dieta.tipo == tipo)
    if especie:
        q = q.filter(Dieta.especie == especie)
    dietas = q.order_by(Dieta.nombre).all()
    result = []
    for d in dietas:
        componentes = (
            db.query(DietaComponente)
            .filter(DietaComponente.dieta_id == d.id)
            .all()
        )
        comp_out = []
        for c in componentes:
            alim = db.query(Alimento).filter(Alimento.id == c.alimento_id).first()
            comp_out.append(DietaComponenteOut(
                id=c.id, dieta_id=c.dieta_id, alimento_id=c.alimento_id,
                porcentaje=float(c.porcentaje) if c.porcentaje else None,
                cantidad_kg=float(c.cantidad_kg) if c.cantidad_kg else None,
                costo=float(c.costo) if c.costo else None,
                created_at=c.created_at,
                alimento_nombre=alim.nombre if alim else None,
            ))
        result.append(DietaOut(
            id=d.id, nombre=d.nombre, tipo=d.tipo,
            especie=d.especie, observaciones=d.observaciones,
            activo=d.activo,
            created_at=d.created_at, updated_at=d.updated_at,
            componentes=comp_out,
        ))
    return result


@router.post("/dietas/", response_model=DietaOut, status_code=201)
def crear_dieta(
    payload: DietaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    dieta = Dieta(**payload.model_dump())
    db.add(dieta)
    db.commit()
    db.refresh(dieta)
    return DietaOut(
        id=dieta.id, nombre=dieta.nombre, tipo=dieta.tipo,
        especie=dieta.especie, observaciones=dieta.observaciones,
        activo=dieta.activo,
        created_at=dieta.created_at, updated_at=dieta.updated_at,
        componentes=[],
    )


@router.get("/dietas/{dieta_id}/componentes", response_model=list[DietaComponenteOut])
def listar_componentes(
    dieta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    dieta = db.query(Dieta).filter(Dieta.id == dieta_id).first()
    if not dieta:
        raise HTTPException(status_code=404, detail="Dieta no encontrada")
    componentes = (
        db.query(DietaComponente)
        .filter(DietaComponente.dieta_id == dieta_id)
        .all()
    )
    result = []
    for c in componentes:
        alim = db.query(Alimento).filter(Alimento.id == c.alimento_id).first()
        result.append(DietaComponenteOut(
            id=c.id, dieta_id=c.dieta_id, alimento_id=c.alimento_id,
            porcentaje=float(c.porcentaje) if c.porcentaje else None,
            cantidad_kg=float(c.cantidad_kg) if c.cantidad_kg else None,
            costo=float(c.costo) if c.costo else None,
            created_at=c.created_at,
            alimento_nombre=alim.nombre if alim else None,
        ))
    return result


@router.post("/dietas/{dieta_id}/componentes", response_model=DietaComponenteOut, status_code=201)
def agregar_componente(
    dieta_id: int,
    payload: DietaComponenteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    dieta = db.query(Dieta).filter(Dieta.id == dieta_id).first()
    if not dieta:
        raise HTTPException(status_code=404, detail="Dieta no encontrada")
    alim = db.query(Alimento).filter(Alimento.id == payload.alimento_id).first()
    if not alim:
        raise HTTPException(status_code=404, detail="Alimento no encontrado")
    componente = DietaComponente(dieta_id=dieta_id, **payload.model_dump())
    db.add(componente)
    db.commit()
    db.refresh(componente)
    return DietaComponenteOut(
        id=componente.id, dieta_id=componente.dieta_id,
        alimento_id=componente.alimento_id,
        porcentaje=float(componente.porcentaje) if componente.porcentaje else None,
        cantidad_kg=float(componente.cantidad_kg) if componente.cantidad_kg else None,
        costo=float(componente.costo) if componente.costo else None,
        created_at=componente.created_at,
        alimento_nombre=alim.nombre,
    )


# ─── Consumo Diario ──────────────────────────────────────────

@router.get("/consumo-diario/", response_model=list[ConsumoDiarioOut])
def listar_consumo_diario(
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    lote_id: Optional[int] = Query(None),
    alimento_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(ConsumoDiario)
    if fecha_desde:
        q = q.filter(ConsumoDiario.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(ConsumoDiario.fecha <= fecha_hasta)
    if lote_id:
        q = q.filter(ConsumoDiario.lote_id == lote_id)
    if alimento_id:
        q = q.filter(ConsumoDiario.alimento_id == alimento_id)
    registros = q.order_by(ConsumoDiario.fecha.desc()).all()
    result = []
    for r in registros:
        alim = db.query(Alimento).filter(Alimento.id == r.alimento_id).first()
        lote = db.query(Lote).filter(Lote.id == r.lote_id).first() if r.lote_id else None
        animal = db.query(Animal).filter(Animal.id == r.animal_id).first() if r.animal_id else None
        result.append(ConsumoDiarioOut(
            id=r.id, fecha=r.fecha, lote_id=r.lote_id,
            animal_id=r.animal_id, alimento_id=r.alimento_id,
            cantidad_kg=float(r.cantidad_kg),
            costo=float(r.costo) if r.costo else None,
            created_at=r.created_at,
            alimento_nombre=alim.nombre if alim else None,
            lote_nombre=lote.nombre if lote else None,
            animal_codigo=animal.codigo if animal else None,
        ))
    return result


@router.post("/consumo-diario/", response_model=ConsumoDiarioOut, status_code=201)
def registrar_consumo_diario(
    payload: ConsumoDiarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    alim = db.query(Alimento).filter(Alimento.id == payload.alimento_id).first()
    if not alim:
        raise HTTPException(status_code=404, detail="Alimento no encontrado")
    if payload.lote_id:
        lote = db.query(Lote).filter(Lote.id == payload.lote_id).first()
        if not lote:
            raise HTTPException(status_code=404, detail="Lote no encontrado")
    if payload.animal_id:
        animal = db.query(Animal).filter(Animal.id == payload.animal_id).first()
        if not animal:
            raise HTTPException(status_code=404, detail="Animal no encontrado")

    registro = ConsumoDiario(**payload.model_dump())
    db.add(registro)
    db.commit()
    db.refresh(registro)

    lote = db.query(Lote).filter(Lote.id == registro.lote_id).first() if registro.lote_id else None
    animal = db.query(Animal).filter(Animal.id == registro.animal_id).first() if registro.animal_id else None
    return ConsumoDiarioOut(
        id=registro.id, fecha=registro.fecha, lote_id=registro.lote_id,
        animal_id=registro.animal_id, alimento_id=registro.alimento_id,
        cantidad_kg=float(registro.cantidad_kg),
        costo=float(registro.costo) if registro.costo else None,
        created_at=registro.created_at,
        alimento_nombre=alim.nombre,
        lote_nombre=lote.nombre if lote else None,
        animal_codigo=animal.codigo if animal else None,
    )
