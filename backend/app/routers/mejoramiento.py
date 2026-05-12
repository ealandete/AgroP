from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import Reproductor, Empadre, HijoReproductor, Animal, Usuario
from app.schemas import (
    ReproductorCreate, ReproductorUpdate, ReproductorOut,
    EmpadreCreate, EmpadreOut,
    HijoReproductorOut,
    EstadisticasMejoramiento,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/mejoramiento", tags=["Mejoramiento / Genética"])


def _format_reproductor(r: Reproductor) -> ReproductorOut:
    animal = r.animal if r.animal else None
    return ReproductorOut(
        id=r.id, animal_id=r.animal_id, tipo=r.tipo,
        registro_ica=r.registro_ica, registro_asociacion=r.registro_asociacion,
        evaluacion_genetica=r.evaluacion_genetica,
        score_conformacion=r.score_conformacion, score_temperamento=r.score_temperamento,
        fecha_ultima_evaluacion=r.fecha_ultima_evaluacion, proxima_evaluacion=r.proxima_evaluacion,
        semen_disponible=r.semen_disponible or False,
        precio_semen=float(r.precio_semen) if r.precio_semen else None,
        precio_monta=float(r.precio_monta) if r.precio_monta else None,
        pedigree=r.pedigree,
        activo=r.activo if r.activo is not None else True,
        animal_codigo=animal.codigo if animal else None,
        animal_nombre=animal.nombre if animal else None,
        created_at=r.created_at, updated_at=r.updated_at,
    )


def _format_empadre(e: Empadre) -> EmpadreOut:
    reproductor = e.reproductor
    receptora = e.receptora
    return EmpadreOut(
        id=e.id, reproductor_id=e.reproductor_id, receptora_id=e.receptora_id,
        fecha=e.fecha, tipo=e.tipo, resultado=e.resultado or "pendiente",
        fecha_resultado=e.fecha_resultado, observaciones=e.observaciones,
        reproductor_nombre=reproductor.animal.nombre if reproductor and reproductor.animal else None,
        receptora_codigo=receptora.codigo if receptora else None,
        created_at=e.created_at,
    )


def _format_hijo(h: HijoReproductor) -> HijoReproductorOut:
    animal = h.animal
    return HijoReproductorOut(
        id=h.id, animal_id=h.animal_id, empadre_id=h.empadre_id,
        animal_codigo=animal.codigo if animal else None,
        animal_nombre=animal.nombre if animal else None,
        created_at=h.created_at,
    )


@router.get("/reproductores", response_model=list[ReproductorOut])
def listar_reproductores(
    tipo: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Reproductor)
    if tipo:
        q = q.filter(Reproductor.tipo == tipo)
    if activo is not None:
        q = q.filter(Reproductor.activo == activo)
    return [_format_reproductor(r) for r in q.order_by(Reproductor.id.desc()).all()]


@router.post("/reproductores", response_model=ReproductorOut, status_code=201)
def crear_reproductor(
    payload: ReproductorCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == payload.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    existente = db.query(Reproductor).filter(
        Reproductor.animal_id == payload.animal_id
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="El animal ya está registrado como reproductor")
    data = payload.model_dump()
    data["finca_id"] = current_user.finca_id
    reproductor = Reproductor(**data)
    db.add(reproductor)
    db.commit()
    db.refresh(reproductor)
    return _format_reproductor(reproductor)


@router.put("/reproductores/{reproductor_id}", response_model=ReproductorOut)
def actualizar_reproductor(
    reproductor_id: int,
    payload: ReproductorUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    reproductor = db.query(Reproductor).filter(Reproductor.id == reproductor_id).first()
    if not reproductor:
        raise HTTPException(status_code=404, detail="Reproductor no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(reproductor, k, v)
    db.commit()
    db.refresh(reproductor)
    return _format_reproductor(reproductor)


@router.get("/reproductores/{reproductor_id}/hijas", response_model=list[HijoReproductorOut])
def listar_hijas(
    reproductor_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    reproductor = db.query(Reproductor).filter(Reproductor.id == reproductor_id).first()
    if not reproductor:
        raise HTTPException(status_code=404, detail="Reproductor no encontrado")
    hijos = db.query(HijoReproductor).filter(
        HijoReproductor.reproductor_id == reproductor_id
    ).all()
    return [_format_hijo(h) for h in hijos]


@router.post("/empadre", response_model=EmpadreOut, status_code=201)
def planear_empadre(
    payload: EmpadreCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    reproductor = db.query(Reproductor).filter(Reproductor.id == payload.reproductor_id).first()
    if not reproductor:
        raise HTTPException(status_code=404, detail="Reproductor no encontrado")
    receptora = db.query(Animal).filter(Animal.id == payload.receptora_id).first()
    if not receptora:
        raise HTTPException(status_code=404, detail="Receptora no encontrada")
    empadre = Empadre(
        finca_id=current_user.finca_id,
        reproductor_id=payload.reproductor_id,
        receptora_id=payload.receptora_id,
        fecha=payload.fecha,
        tipo=payload.tipo,
        observaciones=payload.observaciones,
    )
    db.add(empadre)
    db.commit()
    db.refresh(empadre)
    return _format_empadre(empadre)


@router.get("/empadres", response_model=list[EmpadreOut])
def listar_empadres(
    resultado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Empadre)
    if resultado:
        q = q.filter(Empadre.resultado == resultado)
    return [_format_empadre(e) for e in q.order_by(Empadre.fecha.desc()).all()]


@router.get("/estadisticas", response_model=EstadisticasMejoramiento)
def estadisticas_mejoramiento(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    finca_id = current_user.finca_id
    total_reproductores = db.query(func.count(Reproductor.id)).filter(
        Reproductor.finca_id == finca_id
    ).scalar() or 0
    activos = db.query(func.count(Reproductor.id)).filter(
        Reproductor.finca_id == finca_id,
        Reproductor.activo == True,
    ).scalar() or 0
    inicio_mes = date.today().replace(day=1)
    empadres_mes = db.query(func.count(Empadre.id)).filter(
        Empadre.fecha >= inicio_mes
    ).scalar() or 0
    total_empadres = db.query(func.count(Empadre.id)).filter(
        Empadre.finca_id == finca_id
    ).scalar() or 0
    exitosos = db.query(func.count(Empadre.id)).filter(
        Empadre.finca_id == finca_id,
        Empadre.resultado == "preñada",
    ).scalar() or 0
    tasa_exito = (exitosos / total_empadres * 100) if total_empadres else 0
    total_hijos = db.query(func.count(HijoReproductor.id)).filter(
        HijoReproductor.id > 0
    ).scalar() or 0
    return EstadisticasMejoramiento(
        total_reproductores=total_reproductores,
        reproductores_activos=activos,
        empadres_mes=empadres_mes,
        tasa_exito_pct=round(tasa_exito, 1),
        total_hijos=total_hijos,
        progreso_genetico=f"+{round(tasa_exito * 0.1, 1)}% en última generación",
    )
