from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import (
    Cliente, PlanCuenta, Personal, Nomina, DocumentoSistema,
    VigilanciaEpidemiologica, KpiConfig, Usuario,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["ERP"])


# ---- CLIENTES ----
@router.get("/clientes/")
def listar_clientes(activo: bool = True, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Cliente)
    if activo:
        q = q.filter(Cliente.activo == True)
    return q.order_by(Cliente.nombre).all()


@router.post("/clientes/")
def crear_cliente(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = Cliente(**data)
    db.add(c); db.commit(); db.refresh(c)
    return c


@router.put("/clientes/{cliente_id}")
def actualizar_cliente(cliente_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c: raise HTTPException(404)
    for k, v in data.items(): setattr(c, k, v)
    db.commit()
    return c


# ---- PLAN DE CUENTAS ----
@router.get("/plan-cuentas/")
def listar_plan_cuentas(tipo: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(PlanCuenta).filter(PlanCuenta.activo == True)
    if tipo: q = q.filter(PlanCuenta.tipo == tipo)
    return q.order_by(PlanCuenta.codigo).all()


# ---- PERSONAL ----
@router.get("/personal/")
def listar_personal(activo: bool = True, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Personal).filter(Personal.activo == activo).order_by(Personal.apellido).all()


@router.post("/personal/")
def crear_personal(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    p = Personal(**data)
    db.add(p); db.commit(); db.refresh(p)
    return p


# ---- NOMINAS ----
@router.get("/nominas/")
def listar_nominas(personal_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Nomina)
    if personal_id: q = q.filter(Nomina.personal_id == personal_id)
    return q.order_by(Nomina.periodo.desc()).limit(100).all()


@router.post("/nominas/")
def crear_nomina(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    n = Nomina(**data)
    n.total_devengado = float(data.get("salario_base", 0)) + float(data.get("auxilio_transporte", 0)) + float(data.get("bonificaciones", 0))
    n.total_deducciones = float(data.get("deducciones", 0))
    n.neto_pagado = n.total_devengado - n.total_deducciones
    db.add(n); db.commit(); db.refresh(n)
    return n


# ---- DOCUMENTOS SISTEMA ----
@router.get("/documentos-sistema/")
def listar_documentos(tipo: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(DocumentoSistema)
    if tipo: q = q.filter(DocumentoSistema.tipo == tipo)
    return q.order_by(DocumentoSistema.fecha_emision.desc()).all()


@router.post("/documentos-sistema/")
def crear_documento(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    d = DocumentoSistema(**data)
    db.add(d); db.commit(); db.refresh(d)
    return d


# ---- VIGILANCIA EPIDEMIOLOGICA ----
@router.get("/vigilancia/")
def listar_vigilancia(
    especie: Optional[str] = None,
    tipo_evento: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(VigilanciaEpidemiologica)
    if especie: q = q.filter(VigilanciaEpidemiologica.especie == especie)
    if tipo_evento: q = q.filter(VigilanciaEpidemiologica.tipo_evento == tipo_evento)
    return q.order_by(VigilanciaEpidemiologica.fecha.desc()).all()


@router.post("/vigilancia/")
def crear_vigilancia(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    v = VigilanciaEpidemiologica(**data)
    db.add(v); db.commit(); db.refresh(v)
    return v


# ---- KPIs ----
@router.get("/kpis/")
def listar_kpis(categoria: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(KpiConfig).filter(KpiConfig.activo == True)
    if categoria: q = q.filter(KpiConfig.categoria == categoria)
    return q.order_by(KpiConfig.categoria, KpiConfig.nombre).all()
