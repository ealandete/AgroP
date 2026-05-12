from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional

from app.database import get_db
from app.models import ProcedimientoVeterinario, Animal, Usuario
from app.schemas import (
    ProcedimientoVeterinarioCreate, ProcedimientoVeterinarioUpdate,
    ProcedimientoVeterinarioOut, ProcedimientoStats,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/procedimientos-veterinarios", tags=["Procedimientos Veterinarios"])


@router.get("/", response_model=list[ProcedimientoVeterinarioOut])
def listar_procedimientos(
    animal_id: Optional[int] = None,
    tipo: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(ProcedimientoVeterinario).join(Animal)
    if animal_id:
        q = q.filter(ProcedimientoVeterinario.animal_id == animal_id)
    if tipo:
        q = q.filter(ProcedimientoVeterinario.tipo == tipo)
    if fecha_desde:
        q = q.filter(ProcedimientoVeterinario.fecha >= fecha_desde)
    resultados = q.order_by(ProcedimientoVeterinario.fecha.desc()).all()
    out = []
    for p in resultados:
        out.append(ProcedimientoVeterinarioOut(
            **{c.name: getattr(p, c.name) for c in ProcedimientoVeterinario.__table__.columns},
            animal_codigo=p.animal.codigo if p.animal else None,
            animal_nombre=p.animal.nombre if p.animal else None,
        ))
    return out


@router.post("/", response_model=ProcedimientoVeterinarioOut, status_code=201)
def crear_procedimiento(
    payload: ProcedimientoVeterinarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == payload.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    proc = ProcedimientoVeterinario(**payload.model_dump())
    db.add(proc)
    db.commit()
    db.refresh(proc)
    return ProcedimientoVeterinarioOut(
        **{c.name: getattr(proc, c.name) for c in ProcedimientoVeterinario.__table__.columns},
        animal_codigo=animal.codigo,
        animal_nombre=animal.nombre,
    )


@router.put("/{procedimiento_id}", response_model=ProcedimientoVeterinarioOut)
def actualizar_procedimiento(
    procedimiento_id: int,
    payload: ProcedimientoVeterinarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    proc = db.query(ProcedimientoVeterinario).filter(ProcedimientoVeterinario.id == procedimiento_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procedimiento no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(proc, k, v)
    db.commit()
    db.refresh(proc)
    animal = db.query(Animal).filter(Animal.id == proc.animal_id).first()
    return ProcedimientoVeterinarioOut(
        **{c.name: getattr(proc, c.name) for c in ProcedimientoVeterinario.__table__.columns},
        animal_codigo=animal.codigo if animal else None,
        animal_nombre=animal.nombre if animal else None,
    )


@router.get("/{animal_id}/historial", response_model=list[ProcedimientoVeterinarioOut])
def historial_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    procs = db.query(ProcedimientoVeterinario).filter(
        ProcedimientoVeterinario.animal_id == animal_id
    ).order_by(ProcedimientoVeterinario.fecha.desc()).all()
    out = []
    for p in procs:
        out.append(ProcedimientoVeterinarioOut(
            **{c.name: getattr(p, c.name) for c in ProcedimientoVeterinario.__table__.columns},
            animal_codigo=animal.codigo,
            animal_nombre=animal.nombre,
        ))
    return out


@router.get("/estadisticas/stats", response_model=ProcedimientoStats)
def estadisticas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    primer_dia_mes = hoy.replace(day=1)

    total_mes = db.query(func.count(ProcedimientoVeterinario.id)).filter(
        ProcedimientoVeterinario.fecha >= primer_dia_mes
    ).scalar() or 0

    total_exitosos = db.query(func.count(ProcedimientoVeterinario.id)).filter(
        ProcedimientoVeterinario.fecha >= primer_dia_mes,
        ProcedimientoVeterinario.resultado == "exitoso",
    ).scalar() or 0

    tasa_exito = round((total_exitosos / total_mes * 100), 1) if total_mes > 0 else 0

    costo_mes = db.query(func.coalesce(func.sum(ProcedimientoVeterinario.costo), 0)).filter(
        ProcedimientoVeterinario.fecha >= primer_dia_mes
    ).scalar() or 0

    por_tipo = (
        db.query(
            ProcedimientoVeterinario.tipo,
            func.count(ProcedimientoVeterinario.id).label("total"),
        )
        .filter(ProcedimientoVeterinario.fecha >= primer_dia_mes)
        .group_by(ProcedimientoVeterinario.tipo)
        .all()
    )

    seguimientos = db.query(func.count(ProcedimientoVeterinario.id)).filter(
        ProcedimientoVeterinario.seguimiento_recomendado.isnot(None),
        ProcedimientoVeterinario.seguimiento_recomendado != "",
    ).scalar() or 0

    return ProcedimientoStats(
        procedimientos_mes=total_mes,
        total_por_tipo=[{"tipo": r[0], "total": r[1]} for r in por_tipo],
        tasa_exito=tasa_exito,
        costo_total_mes=float(costo_mes),
        proximos_seguimientos=seguimientos,
    )
