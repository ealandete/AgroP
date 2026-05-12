from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
from typing import Optional

from app.database import get_db
from app.models import AnalisisSuelo, Lote
from app.schemas import (
    AnalisisSueloCreate, AnalisisSueloUpdate, AnalisisSueloOut, RecomendacionSuelo
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/suelos", tags=["Suelos / Analisis"])


@router.get("/analisis/", response_model=dict)
def listar_analisis(
    lote_id: Optional[int] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    textura: Optional[str] = Query(None),
    ph_min: Optional[float] = Query(None),
    ph_max: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(AnalisisSuelo).join(Lote)
    if lote_id:
        q = q.filter(AnalisisSuelo.lote_id == lote_id)
    if fecha_desde:
        q = q.filter(AnalisisSuelo.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(AnalisisSuelo.fecha <= fecha_hasta)
    if textura:
        q = q.filter(AnalisisSuelo.textura == textura)
    if ph_min is not None:
        q = q.filter(AnalisisSuelo.ph >= ph_min)
    if ph_max is not None:
        q = q.filter(AnalisisSuelo.ph <= ph_max)
    total = q.count()
    items = q.order_by(desc(AnalisisSuelo.fecha)).offset((page - 1) * per_page).limit(per_page).all()
    result = []
    for a in items:
        d = {c.name: getattr(a, c.name) for c in AnalisisSuelo.__table__.columns}
        d["lote_nombre"] = a.lote.nombre if a.lote else None
        result.append(d)
    return {"items": result, "total": total, "page": page, "per_page": per_page}


@router.post("/analisis/", response_model=AnalisisSueloOut, status_code=201)
def crear_analisis(payload: AnalisisSueloCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    lote = db.query(Lote).filter(Lote.id == payload.lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    analisis = AnalisisSuelo(**payload.model_dump())
    db.add(analisis)
    db.commit()
    db.refresh(analisis)
    analisis.lote_nombre = lote.nombre
    return analisis


@router.put("/analisis/{analisis_id}", response_model=AnalisisSueloOut)
def actualizar_analisis(analisis_id: int, payload: AnalisisSueloUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    analisis = db.query(AnalisisSuelo).filter(AnalisisSuelo.id == analisis_id).first()
    if not analisis:
        raise HTTPException(status_code=404, detail="Analisis no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(analisis, k, v)
    db.commit()
    db.refresh(analisis)
    lote = db.query(Lote).filter(Lote.id == analisis.lote_id).first()
    analisis.lote_nombre = lote.nombre if lote else None
    return analisis


@router.get("/analisis/{analisis_id}/recomendaciones", response_model=RecomendacionSuelo)
def recomendar_cultivos(analisis_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    analisis = db.query(AnalisisSuelo).filter(AnalisisSuelo.id == analisis_id).first()
    if not analisis:
        raise HTTPException(status_code=404, detail="Analisis no encontrado")

    ph = float(analisis.ph) if analisis.ph else 7.0
    n = float(analisis.nitrogeno_ppm) if analisis.nitrogeno_ppm else 0
    p = float(analisis.fosforo_ppm) if analisis.fosforo_ppm else 0
    k = float(analisis.potasio_ppm) if analisis.potasio_ppm else 0
    mo = float(analisis.materia_organica_pct) if analisis.materia_organica_pct else 0

    cultivos = []
    fertilizacion = []
    obs = []

    if 5.5 <= ph <= 6.5:
        cultivos.extend(["Café", "Cacao", "Frijol", "Maíz", "Arroz", "Plátano", "Yuca"])
    elif 6.0 <= ph <= 7.5:
        cultivos.extend(["Maíz", "Sorgo", "Pasto", "Caña de azúcar", "Algodón", "Hortalizas"])
    elif 5.0 <= ph < 5.5:
        cultivos.extend(["Yuca", "Piña", "Arroz", "Papa"])
        obs.append("pH bajo: recomendar encalado para cultivos exigentes")
    elif ph > 7.5:
        cultivos.extend(["Espárrago", "Remolacha", "Alfalfa"])
        obs.append("pH alto: posible exceso de sales, evaluar enmiendas")
    else:
        cultivos.append("Cultivos tolerantes a acidez")

    if n < 20:
        fertilizacion.append({"nutriente": "Nitrógeno (N)", "recomendacion": "Aplicar 80-120 kg/ha de urea o gallinaza", "nivel": "bajo"})
    elif n < 50:
        fertilizacion.append({"nutriente": "Nitrógeno (N)", "recomendacion": "Aplicar 40-60 kg/ha de urea", "nivel": "moderado"})
    else:
        fertilizacion.append({"nutriente": "Nitrógeno (N)", "recomendacion": "Nivel adecuado, mantener fertilización de mantenimiento", "nivel": "adecuado"})

    if p < 15:
        fertilizacion.append({"nutriente": "Fósforo (P)", "recomendacion": "Aplicar 60-80 kg/ha de DAP o roca fosfórica", "nivel": "bajo"})
    elif p < 30:
        fertilizacion.append({"nutriente": "Fósforo (P)", "recomendacion": "Aplicar 30-50 kg/ha de DAP", "nivel": "moderado"})
    else:
        fertilizacion.append({"nutriente": "Fósforo (P)", "recomendacion": "Nivel adecuado", "nivel": "adecuado"})

    if k < 0.2:
        fertilizacion.append({"nutriente": "Potasio (K)", "recomendacion": "Aplicar 60-100 kg/ha de KCl", "nivel": "bajo"})
    elif k < 0.5:
        fertilizacion.append({"nutriente": "Potasio (K)", "recomendacion": "Aplicar 30-60 kg/ha de KCl", "nivel": "moderado"})
    else:
        fertilizacion.append({"nutriente": "Potasio (K)", "recomendacion": "Nivel adecuado", "nivel": "adecuado"})

    if mo < 3:
        obs.append("Materia orgánica baja: incorporar compost o abono verde")
    elif mo > 10:
        obs.append("Alto contenido de materia orgánica, evitar excesos")

    if analisis.textura:
        t = analisis.textura.lower()
        if t in ("arenoso", "arenosa"):
            obs.append("Suelo arenoso: mejorar retención de agua con materia orgánica")
        elif t in ("arcilloso", "arcillosa"):
            obs.append("Suelo arcilloso: mejorar drenaje, evitar encharcamiento")

    return RecomendacionSuelo(cultivos_recomendados=cultivos, fertilizacion=fertilizacion, observaciones=obs)


@router.get("/historico/{lote_id}", response_model=list[AnalisisSueloOut])
def historico_suelo(lote_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    items = db.query(AnalisisSuelo).filter(AnalisisSuelo.lote_id == lote_id).order_by(AnalisisSuelo.fecha).all()
    result = []
    for a in items:
        d = {c.name: getattr(a, c.name) for c in AnalisisSuelo.__table__.columns}
        d["lote_nombre"] = lote.nombre
        result.append(d)
    return result


@router.get("/resumen")
def resumen_suelos(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total = db.query(AnalisisSuelo).count()
    lotes_analizados = db.query(AnalisisSuelo.lote_id).distinct().count()
    con_deficiencias = db.query(AnalisisSuelo).filter(
        (AnalisisSuelo.nitrogeno_ppm < 20) | (AnalisisSuelo.fosforo_ppm < 15) | (AnalisisSuelo.potasio_ppm < 0.2)
    ).count()
    ultimo = db.query(AnalisisSuelo).order_by(desc(AnalisisSuelo.fecha)).first()
    return {
        "total_analisis": total,
        "lotes_analizados": lotes_analizados,
        "con_deficiencias": con_deficiencias,
        "ultimo_analisis": ultimo.fecha.isoformat() if ultimo else None,
        "ultimo_lote": ultimo.lote.nombre if ultimo and ultimo.lote else None,
    }
