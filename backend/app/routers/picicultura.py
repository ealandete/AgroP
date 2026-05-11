from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime

from app.database import get_db
from app.models import Estanque, CosechaPez, CalidadAguaEstanque, AlimentacionPeces, Usuario, Finca
from app.schemas import (
    EstanqueCreate, EstanqueUpdate, EstanqueOut,
    CosechaPezCreate, CosechaPezOut,
    CalidadAguaEstanqueCreate, CalidadAguaEstanqueOut,
    AlimentacionPecesCreate, AlimentacionPecesOut,
    ResumenPicicultura,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/estanques", tags=["Picicultura"])


def _format_estanque(e):
    return EstanqueOut(
        id=e.id, finca_id=e.finca_id, nombre=e.nombre, codigo=e.codigo,
        area_m2=float(e.area_m2) if e.area_m2 else None,
        profundidad_m=float(e.profundidad_m) if e.profundidad_m else None,
        tipo=e.tipo, especie_cultivada=e.especie_cultivada,
        capacidad_peces=e.capacidad_peces,
        sistema_aireacion=e.sistema_aireacion,
        fecha_construccion=e.fecha_construccion,
        activo=e.activo,
        created_at=e.created_at, updated_at=e.updated_at,
    )


@router.get("/", response_model=list[EstanqueOut])
def listar_estanques(
    finca_id: Optional[int] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Estanque)
    if finca_id:
        q = q.filter(Estanque.finca_id == finca_id)
    if activo is not None:
        q = q.filter(Estanque.activo == activo)
    return [_format_estanque(e) for e in q.order_by(Estanque.nombre).all()]


@router.post("/", response_model=EstanqueOut, status_code=201)
def crear_estanque(
    payload: EstanqueCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    finca = db.query(Finca).filter(Finca.id == payload.finca_id).first()
    if not finca:
        raise HTTPException(status_code=404, detail="Finca no encontrada")
    estanque = Estanque(**payload.model_dump())
    db.add(estanque)
    db.commit()
    db.refresh(estanque)
    return _format_estanque(estanque)


@router.put("/{estanque_id}", response_model=EstanqueOut)
def actualizar_estanque(
    estanque_id: int,
    payload: EstanqueUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(estanque, k, v)
    db.commit()
    db.refresh(estanque)
    return _format_estanque(estanque)


@router.delete("/{estanque_id}")
def eliminar_estanque(
    estanque_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    estanque.activo = False
    db.commit()
    return {"detail": "Estanque desactivado"}


# ─── Cosechas ─────────────────────────────────────────────────

@router.get("/{estanque_id}/cosechas", response_model=list[CosechaPezOut])
def listar_cosechas(
    estanque_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    cosechas = (
        db.query(CosechaPez)
        .filter(CosechaPez.estanque_id == estanque_id)
        .order_by(CosechaPez.fecha.desc())
        .all()
    )
    out = []
    for c in cosechas:
        out.append(CosechaPezOut(
            id=c.id, estanque_id=c.estanque_id, fecha=c.fecha,
            cantidad_kg=float(c.cantidad_kg),
            peso_promedio_g=float(c.peso_promedio_g) if c.peso_promedio_g else None,
            sobrevivencia_pct=float(c.sobrevivencia_pct) if c.sobrevivencia_pct else None,
            destino=c.destino, observaciones=c.observaciones,
            created_at=c.created_at,
            estanque_nombre=estanque.nombre,
        ))
    return out


@router.post("/{estanque_id}/cosechas", response_model=CosechaPezOut, status_code=201)
def registrar_cosecha(
    estanque_id: int,
    payload: CosechaPezCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    cosecha = CosechaPez(estanque_id=estanque_id, **payload.model_dump())
    db.add(cosecha)
    db.commit()
    db.refresh(cosecha)
    return CosechaPezOut(
        id=cosecha.id, estanque_id=cosecha.estanque_id, fecha=cosecha.fecha,
        cantidad_kg=float(cosecha.cantidad_kg),
        peso_promedio_g=float(cosecha.peso_promedio_g) if cosecha.peso_promedio_g else None,
        sobrevivencia_pct=float(cosecha.sobrevivencia_pct) if cosecha.sobrevivencia_pct else None,
        destino=cosecha.destino, observaciones=cosecha.observaciones,
        created_at=cosecha.created_at,
        estanque_nombre=estanque.nombre,
    )


# ─── Calidad de Agua ──────────────────────────────────────────

@router.get("/{estanque_id}/calidad-agua", response_model=list[CalidadAguaEstanqueOut])
def listar_calidad_agua(
    estanque_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    registros = (
        db.query(CalidadAguaEstanque)
        .filter(CalidadAguaEstanque.estanque_id == estanque_id)
        .order_by(CalidadAguaEstanque.fecha.desc())
        .all()
    )
    out = []
    for r in registros:
        out.append(CalidadAguaEstanqueOut(
            id=r.id, estanque_id=r.estanque_id, fecha=r.fecha,
            temperatura_agua=float(r.temperatura_agua) if r.temperatura_agua else None,
            ph=float(r.ph) if r.ph else None,
            oxigeno_disuelto_mgl=float(r.oxigeno_disuelto_mgl) if r.oxigeno_disuelto_mgl else None,
            amoniaco_mgl=float(r.amoniaco_mgl) if r.amoniaco_mgl else None,
            turbidez=float(r.turbidez) if r.turbidez else None,
            observaciones=r.observaciones,
            created_at=r.created_at,
            estanque_nombre=estanque.nombre,
        ))
    return out


@router.post("/{estanque_id}/calidad-agua", response_model=CalidadAguaEstanqueOut, status_code=201)
def registrar_calidad_agua(
    estanque_id: int,
    payload: CalidadAguaEstanqueCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    registro = CalidadAguaEstanque(estanque_id=estanque_id, **payload.model_dump())
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return CalidadAguaEstanqueOut(
        id=registro.id, estanque_id=registro.estanque_id, fecha=registro.fecha,
        temperatura_agua=float(registro.temperatura_agua) if registro.temperatura_agua else None,
        ph=float(registro.ph) if registro.ph else None,
        oxigeno_disuelto_mgl=float(registro.oxigeno_disuelto_mgl) if registro.oxigeno_disuelto_mgl else None,
        amoniaco_mgl=float(registro.amoniaco_mgl) if registro.amoniaco_mgl else None,
        turbidez=float(registro.turbidez) if registro.turbidez else None,
        observaciones=registro.observaciones,
        created_at=registro.created_at,
        estanque_nombre=estanque.nombre,
    )


# ─── Alimentacion ─────────────────────────────────────────────

@router.get("/{estanque_id}/alimentacion", response_model=list[AlimentacionPecesOut])
def listar_alimentacion(
    estanque_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    registros = (
        db.query(AlimentacionPeces)
        .filter(AlimentacionPeces.estanque_id == estanque_id)
        .order_by(AlimentacionPeces.fecha.desc())
        .all()
    )
    out = []
    for r in registros:
        out.append(AlimentacionPecesOut(
            id=r.id, estanque_id=r.estanque_id, fecha=r.fecha,
            tipo_alimento=r.tipo_alimento,
            cantidad_kg=float(r.cantidad_kg),
            frecuencia_diaria=r.frecuencia_diaria,
            created_at=r.created_at,
            estanque_nombre=estanque.nombre,
        ))
    return out


@router.post("/{estanque_id}/alimentacion", response_model=AlimentacionPecesOut, status_code=201)
def registrar_alimentacion(
    estanque_id: int,
    payload: AlimentacionPecesCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    estanque = db.query(Estanque).filter(Estanque.id == estanque_id).first()
    if not estanque:
        raise HTTPException(status_code=404, detail="Estanque no encontrado")
    registro = AlimentacionPeces(estanque_id=estanque_id, **payload.model_dump())
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return AlimentacionPecesOut(
        id=registro.id, estanque_id=registro.estanque_id, fecha=registro.fecha,
        tipo_alimento=registro.tipo_alimento,
        cantidad_kg=float(registro.cantidad_kg),
        frecuencia_diaria=registro.frecuencia_diaria,
        created_at=registro.created_at,
        estanque_nombre=estanque.nombre,
    )


# ─── Resumen ──────────────────────────────────────────────────

@router.get("/resumen", response_model=ResumenPicicultura)
def resumen_picicultura(
    finca_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Estanque)
    if finca_id:
        q = q.filter(Estanque.finca_id == finca_id)
    estanques_activos = q.filter(Estanque.activo == True).count()

    inicio_mes = date.today().replace(day=1)
    cosechas_q = db.query(CosechaPez).join(Estanque)
    cosechas_q = cosechas_q.filter(CosechaPez.fecha >= inicio_mes)
    if finca_id:
        cosechas_q = cosechas_q.filter(Estanque.finca_id == finca_id)
    cosechas_mes = cosechas_q.count()
    total_kg_mes = float(
        db.query(func.coalesce(func.sum(CosechaPez.cantidad_kg), 0))
        .join(Estanque)
        .filter(CosechaPez.fecha >= inicio_mes)
        .scalar() or 0
    )

    ph_promedio = db.query(func.avg(CalidadAguaEstanque.ph)).scalar()
    calidad_promedio_ph = round(float(ph_promedio), 2) if ph_promedio else None

    return ResumenPicicultura(
        estanques_activos=estanques_activos,
        cosechas_mes=cosechas_mes,
        total_kg_mes=total_kg_mes,
        calidad_promedio_ph=calidad_promedio_ph,
    )
