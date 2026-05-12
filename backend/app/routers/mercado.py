from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models import PrecioUsuario, Usuario
from app.schemas import (
    PrecioReferenciaOut, TendenciaOut,
    PrecioUsuarioCreate, PrecioUsuarioOut,
    ResumenMercado,
)
from app.utils.auth import get_current_user
import random

router = APIRouter(prefix="/api/mercado", tags=["Mercado / Precios"])

PRECIOS_REFERENCIA = [
    {"producto": "Leche cruda", "precio_ref": 1800, "unidad": "L", "categoria": "lacteos"},
    {"producto": "Bovino en pie", "precio_ref": 8500, "unidad": "kg", "categoria": "carne"},
    {"producto": "Cerdo en pie", "precio_ref": 7000, "unidad": "kg", "categoria": "carne"},
    {"producto": "Pollo beneficiado", "precio_ref": 9500, "unidad": "kg", "categoria": "carne"},
    {"producto": "Huevo de mesa", "precio_ref": 450, "unidad": "unidad", "categoria": "huevos"},
    {"producto": "Maíz amarillo", "precio_ref": 1200, "unidad": "kg", "categoria": "granos"},
    {"producto": "Arroz paddy", "precio_ref": 1500, "unidad": "kg", "categoria": "granos"},
    {"producto": "Café pergamino", "precio_ref": 8000, "unidad": "kg", "categoria": "cafe"},
    {"producto": "Cacao seco", "precio_ref": 12000, "unidad": "kg", "categoria": "cacao"},
    {"producto": "Plátano hartón", "precio_ref": 1200, "unidad": "kg", "categoria": "frutas"},
    {"producto": "Yuca industrial", "precio_ref": 900, "unidad": "kg", "categoria": "tuberculos"},
    {"producto": "Miel de abeja", "precio_ref": 25000, "unidad": "kg", "categoria": "apicola"},
    {"producto": "Queso costeño", "precio_ref": 12000, "unidad": "kg", "categoria": "lacteos"},
]

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]


def _generar_tendencia(producto: str) -> list[dict]:
    base = 0
    for p in PRECIOS_REFERENCIA:
        if p["producto"].lower() == producto.lower():
            base = p["precio_ref"]
            break
    if not base:
        base = 5000
    tendencia = []
    for i in range(12):
        variacion = random.uniform(-0.08, 0.08)
        precio = round(base * (1 + variacion), -1)
        tendencia.append({"mes": MESES[i], "precio": precio})
    return tendencia


@router.get("/precios", response_model=List[PrecioReferenciaOut])
def listar_precios_referencia():
    return PRECIOS_REFERENCIA


@router.get("/tendencia/{producto}", response_model=List[TendenciaOut])
def tendencia_producto(producto: str):
    return _generar_tendencia(producto)


@router.post("/precios/usuario", response_model=PrecioUsuarioOut, status_code=201)
def guardar_precio_usuario(
    payload: PrecioUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    finca_id = current_user.finca_id
    if not finca_id:
        raise HTTPException(status_code=400, detail="El usuario no tiene una finca asignada")
    existente = db.query(PrecioUsuario).filter(
        PrecioUsuario.finca_id == finca_id,
        PrecioUsuario.producto == payload.producto,
    ).first()
    if existente:
        existente.precio = payload.precio
        existente.unidad = payload.unidad
    else:
        existente = PrecioUsuario(
            finca_id=finca_id,
            producto=payload.producto,
            precio=payload.precio,
            unidad=payload.unidad,
        )
        db.add(existente)
    db.commit()
    db.refresh(existente)
    return existente


@router.get("/precios/usuario", response_model=List[PrecioUsuarioOut])
def listar_precios_usuario(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    finca_id = current_user.finca_id
    if not finca_id:
        return []
    return db.query(PrecioUsuario).filter(
        PrecioUsuario.finca_id == finca_id
    ).all()


@router.get("/resumen", response_model=ResumenMercado)
def resumen_mercado(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    finca_id = current_user.finca_id
    ajustados = 0
    if finca_id:
        ajustados = db.query(PrecioUsuario).filter(
            PrecioUsuario.finca_id == finca_id
        ).count()
    return ResumenMercado(
        total_productos=len(PRECIOS_REFERENCIA),
        productos_ajustados=ajustados,
        tendencia_general="mixta",
    )
