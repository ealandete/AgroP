from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import VigilanciaEpidemiologica, Usuario
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/vigilancia-epidemiologica", tags=["Vigilancia Epidemiológica"])


@router.get("/")
def listar_eventos(
    especie: Optional[str] = Query(None),
    tipo_evento: Optional[str] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(VigilanciaEpidemiologica)
    if especie:
        q = q.filter(VigilanciaEpidemiologica.especie == especie)
    if tipo_evento:
        q = q.filter(VigilanciaEpidemiologica.tipo_evento == tipo_evento)
    if fecha_desde:
        q = q.filter(VigilanciaEpidemiologica.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(VigilanciaEpidemiologica.fecha <= fecha_hasta)
    return q.order_by(VigilanciaEpidemiologica.fecha.desc()).all()


@router.post("/", status_code=201)
def crear_evento(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    evento = VigilanciaEpidemiologica(**data)
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento


@router.get("/stats")
def stats_vigilancia(
    especie: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    from sqlalchemy import func
    q = db.query(VigilanciaEpidemiologica)
    if especie:
        q = q.filter(VigilanciaEpidemiologica.especie == especie)

    total_eventos = q.count()
    total_afectados = q.with_entities(func.sum(VigilanciaEpidemiologica.animales_afectados)).scalar() or 0
    total_muertos = q.with_entities(func.sum(VigilanciaEpidemiologica.animales_muertos)).scalar() or 0
    notificados_ica = q.filter(VigilanciaEpidemiologica.notificado_ica == True).count()

    return {
        "total_eventos": total_eventos,
        "total_afectados": int(total_afectados),
        "total_muertos": int(total_muertos),
        "notificados_ica": notificados_ica,
    }
