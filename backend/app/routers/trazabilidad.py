from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import (
    Animal, Sanidad, MovimientoAnimal, Reproduccion, Parto,
    Pesaje, Ordeno, Siembra, Tratamiento, LaborCampo, Cosecha,
    Producto, Produccion, Venta, Finca, Raza, Usuario, Lote
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/trazabilidad", tags=["Trazabilidad"])


@router.get("/animal/{animal_id}")
def trazabilidad_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")

    raza = db.query(Raza).filter(Raza.id == animal.raza_id).first()
    eventos = []

    sanidad = db.query(Sanidad).filter(Sanidad.animal_id == animal_id).order_by(Sanidad.fecha).all()
    for s in sanidad:
        eventos.append({
            "fecha": str(s.fecha),
            "tipo": "sanitario",
            "titulo": s.tipo.capitalize(),
            "descripcion": f"{s.diagnostico or ''} - {s.producto_aplicado or ''}",
            "responsable": s.veterinario or "",
            "detalles": {
                "producto": s.producto_aplicado,
                "dosis": s.dosis,
                "via": s.via_aplicacion,
                "costo": float(s.costo) if s.costo else None,
                "proximo_control": str(s.fecha_proximo_control) if s.fecha_proximo_control else None,
            }
        })

    movimientos = db.query(MovimientoAnimal).filter(MovimientoAnimal.animal_id == animal_id).order_by(MovimientoAnimal.fecha).all()
    for m in movimientos:
        eventos.append({
            "fecha": str(m.fecha),
            "tipo": "movimiento",
            "titulo": m.tipo.replace("_", " ").title(),
            "descripcion": f"De: {m.origen or ''} -> {m.destino or ''}",
            "responsable": "",
            "detalles": {
                "origen": m.origen,
                "destino": m.destino,
                "motivo": m.motivo,
                "guia_ica": m.guia_ica,
            }
        })

    repro = db.query(Reproduccion).filter(Reproduccion.animal_id == animal_id).order_by(Reproduccion.fecha_servicio).all()
    for r in repro:
        eventos.append({
            "fecha": str(r.fecha_servicio or r.created_at.date()),
            "tipo": "reproduccion",
            "titulo": f"Servicio ({r.tipo_servicio.replace('_', ' ')})",
            "descripcion": f"Resultado: {r.resultado or 'pendiente'}",
            "responsable": "",
            "detalles": {
                "tipo_servicio": r.tipo_servicio,
                "toro_pajuela": r.toro_pajuela,
                "resultado": r.resultado,
                "fecha_parto_estimada": str(r.fecha_parto_estimada) if r.fecha_parto_estimada else None,
                "fecha_parto_real": str(r.fecha_parto_real) if r.fecha_parto_real else None,
                "numero_crias": r.numero_crias,
            }
        })

    partos = db.query(Parto).filter(Parto.animal_id == animal_id).order_by(Parto.fecha_parto).all()
    for p in partos:
        eventos.append({
            "fecha": str(p.fecha_parto),
            "tipo": "reproduccion",
            "titulo": "Parto",
            "descripcion": f"{p.crias_vivas or 0} crias vivas, {p.crias_muertas or 0} muertas",
            "responsable": "",
            "detalles": {
                "tipo_parto": p.tipo_parto,
                "numero_crias": p.numero_crias,
                "crias_vivas": p.crias_vivas,
                "crias_muertas": p.crias_muertas,
                "peso_promedio": float(p.peso_promedio_cria_kg) if p.peso_promedio_cria_kg else None,
            }
        })

    ordenos = db.query(Ordeno).filter(Ordeno.animal_id == animal_id).order_by(Ordeno.fecha).all()
    for o in ordenos:
        eventos.append({
            "fecha": str(o.fecha),
            "tipo": "produccion",
            "titulo": "Ordeno",
            "descripcion": f"Total: {float(o.total_dia or 0):.2f} L",
            "responsable": "",
            "detalles": {
                "am": float(o.ordeno_am) if o.ordeno_am else None,
                "pm": float(o.ordeno_pm) if o.ordeno_pm else None,
                "total_dia": float(o.total_dia) if o.total_dia else None,
                "calidad": o.calidad,
            }
        })

    pesajes = db.query(Pesaje).filter(Pesaje.animal_id == animal_id).order_by(Pesaje.fecha).all()
    for p in pesajes:
        eventos.append({
            "fecha": str(p.fecha),
            "tipo": "produccion",
            "titulo": "Pesaje",
            "descripcion": f"{float(p.peso_kg):.2f} kg",
            "responsable": "",
            "detalles": {
                "peso_kg": float(p.peso_kg),
                "condicion_corporal": p.condicion_corporal,
                "ganancia_diaria": float(p.ganancia_diaria) if p.ganancia_diaria else None,
                "metodo": p.metodo,
            }
        })

    if animal.fecha_salida:
        eventos.append({
            "fecha": str(animal.fecha_salida),
            "tipo": "venta",
            "titulo": "Salida",
            "descripcion": f"Motivo: {animal.motivo_salida or 'No especificado'}",
            "responsable": "",
            "detalles": {
                "motivo": animal.motivo_salida,
                "fecha_salida": str(animal.fecha_salida),
            }
        })

    eventos.sort(key=lambda e: e["fecha"])

    return {
        "animal": {
            "id": animal.id,
            "codigo": animal.codigo,
            "nombre": animal.nombre,
            "especie": animal.especie,
            "raza": raza.nombre if raza else None,
            "sexo": animal.sexo,
            "fecha_nacimiento": str(animal.fecha_nacimiento) if animal.fecha_nacimiento else None,
            "fecha_ingreso": str(animal.fecha_ingreso),
            "fecha_salida": str(animal.fecha_salida) if animal.fecha_salida else None,
            "activo": animal.activo,
        },
        "eventos": eventos,
        "total_eventos": len(eventos),
        "certificaciones": [],
    }


@router.get("/cultivo/{siembra_id}")
def trazabilidad_cultivo(
    siembra_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    siembra = db.query(Siembra).filter(Siembra.id == siembra_id).first()
    if not siembra:
        raise HTTPException(status_code=404, detail="Siembra no encontrada")

    lote = db.query(Lote).filter(Lote.id == siembra.lote_id).first()
    eventos = []

    tratamientos = db.query(Tratamiento).filter(Tratamiento.siembra_id == siembra_id).order_by(Tratamiento.fecha_aplicacion).all()
    for t in tratamientos:
        eventos.append({
            "fecha": str(t.fecha_aplicacion),
            "tipo": "tratamiento",
            "titulo": t.tipo.capitalize(),
            "descripcion": f"{t.producto} - {t.dosis or ''}",
            "responsable": t.responsable or "",
            "detalles": {
                "producto": t.producto,
                "principio_activo": t.principio_activo,
                "dosis": t.dosis,
                "cantidad": float(t.cantidad_aplicada) if t.cantidad_aplicada else None,
                "costo": float(t.costo) if t.costo else None,
                "efectividad": t.efectividad,
            }
        })

    labores = db.query(LaborCampo).filter(LaborCampo.siembra_id == siembra_id).order_by(LaborCampo.fecha).all()
    for l in labores:
        eventos.append({
            "fecha": str(l.fecha),
            "tipo": "labor",
            "titulo": l.tipo.replace("_", " ").title(),
            "descripcion": l.descripcion or "",
            "responsable": "",
            "detalles": {
                "tipo": l.tipo,
                "horas_trabajo": float(l.horas_trabajo) if l.horas_trabajo else None,
                "num_trabajadores": l.numero_trabajadores,
                "costo_mano_obra": float(l.costo_mano_obra) if l.costo_mano_obra else None,
                "insumos": l.insumos_utilizados,
            }
        })

    cosechas = db.query(Cosecha).filter(Cosecha.siembra_id == siembra_id).order_by(Cosecha.fecha).all()
    for c in cosechas:
        eventos.append({
            "fecha": str(c.fecha),
            "tipo": "cosecha",
            "titulo": "Cosecha",
            "descripcion": f"{float(c.cantidad_kg):.2f} kg - Calidad: {c.calidad or 'N/A'}",
            "responsable": "",
            "detalles": {
                "cantidad_kg": float(c.cantidad_kg),
                "calidad": c.calidad,
                "humedad": float(c.humedad_relativa) if c.humedad_relativa else None,
                "metodo": c.metodo,
                "destino": c.destino,
            }
        })

    eventos.sort(key=lambda e: e["fecha"])

    return {
        "siembra": {
            "id": siembra.id,
            "cultivo": siembra.cultivo,
            "lote": lote.nombre if lote else None,
            "fecha_siembra": str(siembra.fecha_siembra),
            "fecha_cosecha_estimada": str(siembra.fecha_cosecha_estimada) if siembra.fecha_cosecha_estimada else None,
            "fecha_cosecha_real": str(siembra.fecha_cosecha_real) if siembra.fecha_cosecha_real else None,
            "area_ha": float(siembra.area_ha) if siembra.area_ha else None,
            "estado": siembra.estado,
            "rendimiento_kg": float(siembra.rendimiento_kg) if siembra.rendimiento_kg else None,
        },
        "eventos": eventos,
        "total_eventos": len(eventos),
    }


@router.get("/producto/{lote}")
def trazabilidad_producto(
    lote: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    producto = db.query(Producto).filter(
        (Producto.id == lote) | (Producto.codigo == lote)
    ).first()
    if not producto:
        try:
            producto = db.query(Producto).filter(Producto.id == int(lote)).first()
        except ValueError:
            pass
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    origen_animal = None
    origen_cultivo = None

    produccion = db.query(Produccion).filter(Produccion.producto_id == producto.id).order_by(Produccion.fecha).all()
    produccion_events = []
    for p in produccion:
        item = {
            "fecha": str(p.fecha),
            "cantidad": float(p.cantidad),
        }
        if p.animal_id:
            animal = db.query(Animal).filter(Animal.id == p.animal_id).first()
            item["animal_origen"] = animal.codigo if animal else None
            origen_animal = animal
        if p.siembra_id:
            siembra = db.query(Siembra).filter(Siembra.id == p.siembra_id).first()
            item["cultivo_origen"] = siembra.cultivo if siembra else None
            origen_cultivo = siembra
        produccion_events.append(item)

    ventas = db.query(Venta).filter(Venta.producto_id == producto.id).order_by(Venta.fecha).all()

    eventos = []
    for p in produccion_events:
        eventos.append({
            "fecha": p["fecha"],
            "tipo": "produccion",
            "titulo": "Produccion",
            "descripcion": f"{p['cantidad']:.2f} {producto.unidad_medida}",
            "responsable": "",
            "detalles": p,
        })

    for v in ventas:
        eventos.append({
            "fecha": str(v.fecha),
            "tipo": "venta",
            "titulo": "Venta",
            "descripcion": f"Cliente: {v.cliente or 'N/A'} - {float(v.cantidad):.2f} {producto.unidad_medida}",
            "responsable": "",
            "detalles": {
                "cliente": v.cliente,
                "cantidad": float(v.cantidad),
                "precio_unitario": float(v.precio_unitario),
                "total": float(v.total) if v.total else None,
                "medio_pago": v.medio_pago,
            }
        })

    eventos.sort(key=lambda e: e["fecha"])

    return {
        "producto": {
            "id": producto.id,
            "nombre": producto.nombre,
            "tipo": producto.tipo,
            "unidad_medida": producto.unidad_medida,
        },
        "origen": {
            "animal": {"id": origen_animal.id, "codigo": origen_animal.codigo, "especie": origen_animal.especie} if origen_animal else None,
            "cultivo": {"id": origen_cultivo.id, "cultivo": origen_cultivo.cultivo} if origen_cultivo else None,
        },
        "eventos": eventos,
        "total_eventos": len(eventos),
    }


@router.get("/qr/{codigo}")
def qr_trazabilidad(
    codigo: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    producto = db.query(Producto).filter(
        (Producto.codigo == codigo) | (Producto.nombre.ilike(f"%{codigo}%"))
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    base_url = f"{current_user.finca.nombre if current_user.finca else 'agrop'}"
    trace_url = f"/trazabilidad/producto/{producto.codigo or producto.id}"

    return {
        "producto": {
            "id": producto.id,
            "nombre": producto.nombre,
            "tipo": producto.tipo,
            "codigo": producto.codigo,
        },
        "finca_origen": {
            "nombre": current_user.finca.nombre if current_user.finca else "No asignada",
        },
        "certificaciones": [],
        "trace_url": trace_url,
        "qr_data": f"AGROP-TRACE:{producto.codigo or producto.id}:{producto.nombre}",
    }
