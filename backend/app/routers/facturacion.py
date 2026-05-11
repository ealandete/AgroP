from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from app.database import get_db
from app.models import FacturaCabecera, FacturaItem, Usuario
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/facturacion", tags=["Facturación"])


@router.get("/")
def listar_facturas(estado: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(FacturaCabecera)
    if estado: q = q.filter(FacturaCabecera.estado == estado)
    facturas = q.order_by(FacturaCabecera.fecha_emision.desc(), FacturaCabecera.numero_factura.desc()).limit(50).all()
    result = []
    for f in facturas:
        items = db.query(FacturaItem).filter(FacturaItem.factura_id == f.id).all()
        result.append({
            "id": f.id, "cliente_id": f.cliente_id, "prefijo": f.prefijo, "numero_factura": f.numero_factura,
            "fecha_emision": str(f.fecha_emision), "fecha_vencimiento": str(f.fecha_vencimiento) if f.fecha_vencimiento else None,
            "forma_pago": f.forma_pago, "subtotal": float(f.subtotal or 0), "iva_porcentaje": float(f.iva_porcentaje or 0),
            "iva_total": float(f.iva_total or 0), "retencion_fuente_total": float(f.retencion_fuente_total or 0),
            "retencion_ica_total": float(f.retencion_ica_total or 0),
            "total_bruto": float(f.total_bruto or 0), "total_impuestos": float(f.total_impuestos or 0),
            "total_neto": float(f.total_neto or 0), "observaciones": f.observaciones, "estado": f.estado,
            "items": [{"id": i.id, "producto_id": i.producto_id, "descripcion": i.descripcion,
                        "cantidad": float(i.cantidad), "unidad_medida": i.unidad_medida,
                        "precio_unitario": float(i.precio_unitario), "iva_porcentaje": float(i.iva_porcentaje),
                        "subtotal": float(i.subtotal or 0)} for i in items],
        })
    return result


@router.post("/")
def crear_factura(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    prefijo = data.get("prefijo", "FAG")
    # Auto-incrementar consecutivo
    ultimo = db.query(func.max(FacturaCabecera.numero_factura)).filter(FacturaCabecera.prefijo == prefijo).scalar() or 0
    numero = ultimo + 1

    items_data = data.pop("items", [])

    f = FacturaCabecera(**data, prefijo=prefijo, numero_factura=numero)
    db.add(f)
    db.flush()

    subtotal = 0
    iva_total = 0
    for item in items_data:
        cant = float(item.get("cantidad", 0))
        precio = float(item.get("precio_unitario", 0))
        iva_pct = float(item.get("iva_porcentaje", data.get("iva_porcentaje", 19.0)))
        item_subtotal = cant * precio
        item_iva = item_subtotal * iva_pct / 100 if iva_pct > 0 else 0
        fi = FacturaItem(
            factura_id=f.id, producto_id=item.get("producto_id"),
            descripcion=item.get("descripcion", ""), cantidad=cant,
            unidad_medida=item.get("unidad_medida", "unidad"),
            precio_unitario=precio, iva_porcentaje=iva_pct,
            iva_unitario=item_iva / cant if cant > 0 else 0,
            subtotal=item_subtotal + item_iva,
        )
        subtotal += item_subtotal
        iva_total += item_iva
        db.add(fi)

    ret_fte_pct = float(data.get("retencion_fuente_porcentaje", 0))
    ret_ica_pct = float(data.get("retencion_ica_porcentaje", 0))
    ret_fte = subtotal * ret_fte_pct / 100
    ret_ica = subtotal * ret_ica_pct / 100

    f.subtotal = subtotal
    f.iva_total = iva_total
    f.retencion_fuente_total = ret_fte
    f.retencion_ica_total = ret_ica
    f.total_bruto = subtotal
    f.total_impuestos = iva_total
    f.total_neto = subtotal + iva_total - ret_fte - ret_ica

    db.commit()
    db.refresh(f)

    # Return full factura
    return {"id": f.id, "prefijo": f.prefijo, "numero_factura": f.numero_factura, "total_neto": float(f.total_neto), "estado": f.estado}


@router.get("/{factura_id}")
def obtener_factura(factura_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    f = db.query(FacturaCabecera).filter(FacturaCabecera.id == factura_id).first()
    if not f: raise HTTPException(404)
    items = db.query(FacturaItem).filter(FacturaItem.factura_id == f.id).all()
    return {"factura": f, "items": items}
