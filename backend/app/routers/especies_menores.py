from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date

from app.database import get_db
from app.models import (
    LoteAves, ProduccionHuevos, Camada, EngordePorcino, Colmena, CosechaMiel,
    Animal, Usuario, Raza, Lote, Finca,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Especies Menores"])


# ============================================================
# AVICOLA - Lotes de Aves
# ============================================================

@router.get("/lotes-aves/")
def listar_lotes_aves(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(LoteAves).order_by(LoteAves.codigo).all()


@router.post("/lotes-aves/")
def crear_lote_aves(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    l = LoteAves(**data)
    db.add(l)
    db.commit()
    db.refresh(l)
    return l


@router.put("/lotes-aves/{lote_id}")
def actualizar_lote_aves(lote_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    l = db.query(LoteAves).filter(LoteAves.id == lote_id).first()
    if not l:
        raise HTTPException(404, detail="Lote no encontrado")
    for k, v in data.items():
        setattr(l, k, v)
    db.commit()
    return l


@router.delete("/lotes-aves/{lote_id}")
def eliminar_lote_aves(lote_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    l = db.query(LoteAves).filter(LoteAves.id == lote_id).first()
    if not l:
        raise HTTPException(404, detail="Lote no encontrado")
    db.delete(l)
    db.commit()
    return {"detail": "Lote eliminado"}


# ============================================================
# AVICOLA - Produccion de Huevos
# ============================================================

@router.get("/produccion-huevos/")
def listar_huevos(
    lote_aves_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(ProduccionHuevos)
    if lote_aves_id:
        q = q.filter(ProduccionHuevos.lote_aves_id == lote_aves_id)
    if fecha_desde:
        q = q.filter(ProduccionHuevos.fecha >= fecha_desde)
    return q.order_by(ProduccionHuevos.fecha.desc()).limit(100).all()


@router.post("/produccion-huevos/")
def crear_huevos(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    h = ProduccionHuevos(**data)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.put("/produccion-huevos/{prod_id}")
def actualizar_huevos(prod_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    h = db.query(ProduccionHuevos).filter(ProduccionHuevos.id == prod_id).first()
    if not h:
        raise HTTPException(404, detail="Registro no encontrado")
    for k, v in data.items():
        setattr(h, k, v)
    db.commit()
    return h


@router.get("/produccion-huevos/stats")
def stats_huevos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoy = date.today()
    # Hoy
    hoy_data = db.query(func.sum(ProduccionHuevos.huevos_puestos)).filter(ProduccionHuevos.fecha == hoy).scalar() or 0
    # Esta semana
    desde = hoy.replace(day=max(1, hoy.day - 6))
    semana = db.query(func.sum(ProduccionHuevos.huevos_puestos)).filter(ProduccionHuevos.fecha >= desde).scalar() or 0
    # Promedio diario
    avg = db.query(func.avg(ProduccionHuevos.huevos_puestos)).filter(ProduccionHuevos.fecha >= desde).scalar() or 0
    # Tasa de postura
    lote = db.query(func.sum(LoteAves.cantidad_actual)).filter(LoteAves.tipo_produccion == "huevos").scalar() or 1
    tasa = round((avg / lote * 100), 1) if lote > 0 else 0
    return {"huevos_hoy": int(hoy_data), "huevos_semana": int(semana), "promedio_diario": round(float(avg), 1), "tasa_postura_pct": tasa, "aves_produccion": int(lote)}


# ============================================================
# PORCICOLA - Camadas
# ============================================================

@router.get("/camadas/")
def listar_camadas(
    madre_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Camada)
    if madre_id:
        q = q.filter(Camada.madre_id == madre_id)
    return q.order_by(Camada.fecha_parto.desc()).all()


@router.post("/camadas/")
def crear_camada(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = Camada(**data)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/camadas/{camada_id}")
def actualizar_camada(camada_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = db.query(Camada).filter(Camada.id == camada_id).first()
    if not c:
        raise HTTPException(404, detail="Camada no encontrada")
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    return c


@router.delete("/camadas/{camada_id}")
def eliminar_camada(camada_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = db.query(Camada).filter(Camada.id == camada_id).first()
    if not c:
        raise HTTPException(404, detail="Camada no encontrada")
    db.delete(c)
    db.commit()
    return {"detail": "Camada eliminada"}


@router.get("/camadas/stats")
def stats_camadas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    hoy = date.today()
    stats = db.query(
        func.count(Camada.id).label("total"),
        func.avg(Camada.lechones_nacidos).label("promedio_nacidos"),
        func.avg(Camada.lechones_vivos).label("promedio_vivos"),
        func.avg(Camada.lechones_destetados).label("promedio_destetados"),
        func.sum(Camada.lechones_nacidos).label("total_nacidos"),
        func.sum(Camada.lechones_destetados).label("total_destetados"),
    ).first()
    return {
        "total_camadas": stats[0] or 0,
        "promedio_nacidos": round(float(stats[1] or 0), 1),
        "promedio_vivos": round(float(stats[2] or 0), 1),
        "promedio_destetados": round(float(stats[3] or 0), 1),
        "total_nacidos": stats[4] or 0,
        "total_destetados": stats[5] or 0,
        "tasa_supervivencia": round((stats[5] / stats[4] * 100) if stats[4] else 0, 1),
    }


# ============================================================
# PORCICOLA - Engorde
# ============================================================

@router.get("/engorde-porcino/")
def listar_engorde(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(EngordePorcino)
    if estado:
        q = q.filter(EngordePorcino.estado == estado)
    return q.order_by(EngordePorcino.fecha_inicio.desc()).all()


@router.post("/engorde-porcino/")
def crear_engorde(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    e = EngordePorcino(**data)
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.put("/engorde-porcino/{engorde_id}")
def actualizar_engorde(engorde_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    e = db.query(EngordePorcino).filter(EngordePorcino.id == engorde_id).first()
    if not e:
        raise HTTPException(404, detail="Engorde no encontrado")
    for k, v in data.items():
        setattr(e, k, v)
    db.commit()
    return e


@router.delete("/engorde-porcino/{engorde_id}")
def eliminar_engorde(engorde_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    e = db.query(EngordePorcino).filter(EngordePorcino.id == engorde_id).first()
    if not e:
        raise HTTPException(404, detail="Engorde no encontrado")
    db.delete(e)
    db.commit()
    return {"detail": "Engorde eliminado"}


# ============================================================
# APICULTURA - Colmenas
# ============================================================

@router.get("/colmenas/")
def listar_colmenas(
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Colmena)
    if estado:
        q = q.filter(Colmena.estado == estado)
    return q.order_by(Colmena.codigo).all()


@router.post("/colmenas/")
def crear_colmena(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = Colmena(**data)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/colmenas/{colmena_id}")
def actualizar_colmena(colmena_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    c = db.query(Colmena).filter(Colmena.id == colmena_id).first()
    if not c:
        raise HTTPException(404)
    for k, v in data.items():
        setattr(c, k, v)
    db.commit()
    return c


# ============================================================
# APICULTURA - Cosechas de Miel
# ============================================================

@router.get("/cosechas-miel/")
def listar_cosechas_miel(
    colmena_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(CosechaMiel)
    if colmena_id:
        q = q.filter(CosechaMiel.colmena_id == colmena_id)
    return q.order_by(CosechaMiel.fecha.desc()).all()


@router.post("/cosechas-miel/")
def crear_cosecha_miel(data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    cm = CosechaMiel(**data)
    db.add(cm)
    db.commit()
    db.refresh(cm)
    return cm


@router.get("/cosechas-miel/stats")
def stats_miel(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    total = db.query(func.sum(CosechaMiel.kg_miel)).scalar() or 0
    ultima = db.query(CosechaMiel).order_by(CosechaMiel.fecha.desc()).first()
    colmenas_activas = db.query(func.count(Colmena.id)).filter(Colmena.estado == "activa").scalar() or 0
    return {
        "miel_total_kg": float(total),
        "ultima_cosecha": str(ultima.fecha) if ultima else None,
        "ultima_cantidad_kg": float(ultima.kg_miel) if ultima and ultima.kg_miel else 0,
        "colmenas_activas": colmenas_activas,
        "promedio_por_colmena": round(float(total) / colmenas_activas, 1) if colmenas_activas > 0 else 0,
    }
