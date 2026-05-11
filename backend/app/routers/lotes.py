from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Lote, AnalisisSuelo, Finca, Usuario
from app.schemas import (
    LoteCreate, LoteOut, AnalisisSueloCreate, AnalisisSueloOut, FincaCreate, FincaOut
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/lotes", tags=["Lotes y Terrenos"])


@router.get("/", response_model=list[LoteOut])
def listar_lotes(finca_id: int = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Lote)
    if finca_id:
        q = q.filter(Lote.finca_id == finca_id)
    return q.order_by(Lote.nombre).all()


@router.get("/{lote_id}", response_model=LoteOut)
def obtener_lote(lote_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote


@router.post("/", response_model=LoteOut, status_code=201)
def crear_lote(payload: LoteCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    lote = Lote(**payload.model_dump())
    db.add(lote)
    db.commit()
    db.refresh(lote)
    return lote


@router.put("/{lote_id}", response_model=LoteOut)
def actualizar_lote(lote_id: int, payload: LoteCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    for k, v in payload.model_dump().items():
        setattr(lote, k, v)
    db.commit()
    db.refresh(lote)
    return lote


# --- ANALISIS DE SUELO ---
@router.get("/{lote_id}/analisis", response_model=list[AnalisisSueloOut])
def listar_analisis(lote_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(AnalisisSuelo).filter(AnalisisSuelo.lote_id == lote_id).order_by(AnalisisSuelo.fecha.desc()).all()


@router.post("/{lote_id}/analisis", response_model=AnalisisSueloOut, status_code=201)
def crear_analisis(lote_id: int, payload: AnalisisSueloCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    payload.lote_id = lote_id
    analisis = AnalisisSuelo(**payload.model_dump())
    db.add(analisis)
    db.commit()
    db.refresh(analisis)
    return analisis


# --- FINCAS ---
@router.get("/fincas/", tags=["Fincas"])
def listar_fincas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Finca).order_by(Finca.nombre).all()


@router.post("/fincas/", response_model=FincaOut, status_code=201, tags=["Fincas"])
def crear_finca(payload: FincaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    finca = Finca(**payload.model_dump())
    db.add(finca)
    db.commit()
    db.refresh(finca)
    return finca
