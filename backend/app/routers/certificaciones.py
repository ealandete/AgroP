from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Certificacion, NoConformidad, Usuario
from app.schemas import (
    CertificacionCreate, CertificacionUpdate, CertificacionOut,
    NoConformidadCreate, NoConformidadOut,
    AlertaCertificacionOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/certificaciones", tags=["Certificaciones"])


@router.get("/", response_model=list[CertificacionOut])
def listar_certificaciones(
    finca_id: Optional[int] = None,
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Certificacion)
    if finca_id:
        q = q.filter(Certificacion.finca_id == finca_id)
    if tipo:
        q = q.filter(Certificacion.tipo == tipo)
    if estado:
        q = q.filter(Certificacion.estado == estado)
    return q.order_by(Certificacion.fecha_emision.desc()).all()


@router.post("/", response_model=CertificacionOut, status_code=201)
def crear_certificacion(
    payload: CertificacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cert = Certificacion(**payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.put("/{cert_id}", response_model=CertificacionOut)
def actualizar_certificacion(
    cert_id: int,
    payload: CertificacionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cert = db.query(Certificacion).filter(Certificacion.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificación no encontrada")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cert, k, v)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/no-conformidades/", response_model=list[NoConformidadOut])
def listar_no_conformidades(
    certificacion_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(NoConformidad)
    if certificacion_id:
        q = q.filter(NoConformidad.certificacion_id == certificacion_id)
    return q.order_by(NoConformidad.fecha.desc()).all()


@router.post("/no-conformidades/", response_model=NoConformidadOut, status_code=201)
def crear_no_conformidad(
    payload: NoConformidadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    nc = NoConformidad(**payload.model_dump())
    db.add(nc)
    db.commit()
    db.refresh(nc)
    return nc


@router.get("/alertas", response_model=list[AlertaCertificacionOut])
def alertas_certificaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    limite = hoy + timedelta(days=60)
    certificaciones = db.query(Certificacion).filter(
        Certificacion.estado == "activa",
        Certificacion.fecha_vencimiento.isnot(None),
        Certificacion.fecha_vencimiento <= limite,
    ).all()

    resultado = []
    for c in certificaciones:
        dias_restantes = (c.fecha_vencimiento - hoy).days
        severidad = "critica" if dias_restantes <= 30 else "media"
        resultado.append(AlertaCertificacionOut(
            id=c.id,
            nombre=c.nombre,
            tipo=c.tipo,
            entidad_certificadora=c.entidad_certificadora,
            fecha_vencimiento=c.fecha_vencimiento,
            dias_restantes=dias_restantes,
            severidad=severidad,
        ))
    return resultado
