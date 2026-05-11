from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    Venta, Producto, Costo, CategoriaFinanciera, Produccion,
    Proveedor, Insumo, Inventario, Usuario, Compra
)
from app.schemas import (
    VentaCreate, VentaOut, ProductoCreate, ProductoOut,
    CostoCreate, CostoOut, InsumoCreate, InsumoOut,
    InventarioCreate, InventarioOut, ProveedorOut,
    InsumoUpdate, ProduccionUpdate, ProduccionOut,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/finanzas", tags=["Finanzas e Inventario"])


# --- VENTAS ---
@router.get("/ventas", response_model=list[VentaOut])
def listar_ventas(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    producto_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Venta)
    if fecha_desde:
        q = q.filter(Venta.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(Venta.fecha <= fecha_hasta)
    if producto_id:
        q = q.filter(Venta.producto_id == producto_id)
    return q.order_by(Venta.fecha.desc()).all()


@router.post("/ventas", response_model=VentaOut, status_code=201)
def crear_venta(payload: VentaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    venta = Venta(**payload.model_dump())
    if not venta.total:
        venta.total = float(payload.cantidad) * float(payload.precio_unitario)
    db.add(venta)
    db.commit()
    db.refresh(venta)
    return venta


@router.get("/productos", response_model=list[ProductoOut])
def listar_productos(tipo: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Producto)
    if tipo:
        q = q.filter(Producto.tipo == tipo)
    return q.order_by(Producto.tipo, Producto.nombre).all()


# --- COSTOS ---
@router.get("/costos", response_model=list[CostoOut])
def listar_costos(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Costo)
    if fecha_desde:
        q = q.filter(Costo.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(Costo.fecha <= fecha_hasta)
    if categoria_id:
        q = q.filter(Costo.categoria_id == categoria_id)
    return q.order_by(Costo.fecha.desc()).all()


@router.post("/costos", response_model=CostoOut, status_code=201)
def crear_costo(payload: CostoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    costo = Costo(**payload.model_dump())
    db.add(costo)
    db.commit()
    db.refresh(costo)
    return costo


@router.get("/categorias", response_model=list[dict])
def listar_categorias(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return [{"id": c.id, "nombre": c.nombre, "tipo": c.tipo} for c in db.query(CategoriaFinanciera).all()]


# --- INVENTARIO ---
@router.get("/insumos", response_model=list[InsumoOut])
def listar_insumos(tipo: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Insumo).filter(Insumo.activo == True)
    if tipo:
        q = q.filter(Insumo.tipo == tipo)
    return q.order_by(Insumo.nombre).all()


@router.post("/insumos", response_model=InsumoOut, status_code=201)
def crear_insumo(payload: InsumoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    insumo = Insumo(**payload.model_dump())
    db.add(insumo)
    db.commit()
    db.refresh(insumo)
    return insumo


@router.get("/inventario", response_model=list[InventarioOut])
def listar_inventario(
    insumo_id: Optional[int] = None,
    proximos_vencer: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Inventario).filter(Inventario.cantidad > 0)
    if insumo_id:
        q = q.filter(Inventario.insumo_id == insumo_id)
    if proximos_vencer:
        from datetime import date, timedelta
        q = q.filter(Inventario.fecha_vencimiento <= date.today() + timedelta(days=30))
    return q.order_by(Inventario.fecha_vencimiento.asc()).all()


@router.post("/inventario", response_model=InventarioOut, status_code=201)
def crear_inventario(payload: InventarioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    inv = Inventario(**payload.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/proveedores", response_model=list[ProveedorOut])
def listar_proveedores(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Proveedor).filter(Proveedor.activo == True).order_by(Proveedor.nombre).all()


# --- INSUMOS (PUT / DELETE) ---
@router.put("/insumos/{insumo_id}", response_model=InsumoOut)
def actualizar_insumo(
    insumo_id: int,
    payload: InsumoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    insumo = db.query(Insumo).filter(Insumo.id == insumo_id, Insumo.activo == True).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(insumo, k, v)
    db.commit()
    db.refresh(insumo)
    return insumo


@router.delete("/insumos/{insumo_id}")
def eliminar_insumo(
    insumo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    insumo = db.query(Insumo).filter(Insumo.id == insumo_id, Insumo.activo == True).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    insumo.activo = False
    db.commit()
    return {"detail": "Insumo desactivado"}


# --- PRODUCCION (PUT) ---
@router.put("/produccion/{id}", response_model=ProduccionOut)
def actualizar_produccion(
    id: int,
    payload: ProduccionUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    prod = db.query(Produccion).filter(Produccion.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Registro de producción no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    return prod


@router.get("/produccion", response_model=list[dict])
def listar_produccion(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Produccion)
    if fecha_desde:
        q = q.filter(Produccion.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(Produccion.fecha <= fecha_hasta)
    result = []
    for p in q.order_by(Produccion.fecha.desc()).all():
        prod = db.query(Producto).filter(Producto.id == p.producto_id).first()
        result.append({
            "id": p.id, "producto_id": p.producto_id,
            "producto": prod.nombre if prod else "",
            "fecha": str(p.fecha), "cantidad": float(p.cantidad),
            "observaciones": p.observaciones,
        })
    return result
