from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import ColaSincronizacion, Usuario
from app.schemas import SyncPayload
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/sync", tags=["Sincronización Offline"])


@router.post("/push")
def push_sync(payload: SyncPayload, current_user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    """Recibir datos desde dispositivo offline"""
    entrada = ColaSincronizacion(
        dispositivo_id=payload.dispositivo_id,
        usuario_id=current_user.id,
        operacion=payload.operacion,
        tabla=payload.tabla,
        registro_id=payload.registro_id,
        datos=payload.datos,
        estado="pendiente",
    )
    db.add(entrada)
    db.commit()
    return {"detail": "Datos recibidos para sincronización", "id": entrada.id}


@router.get("/pull")
def pull_sync(
    dispositivo_id: str,
    desde: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener datos pendientes de sincronizar para un dispositivo"""
    q = db.query(ColaSincronizacion).filter(
        ColaSincronizacion.dispositivo_id == dispositivo_id,
        ColaSincronizacion.estado == "pendiente"
    )
    if desde:
        q = q.filter(ColaSincronizacion.created_at > desde)
    pendientes = q.order_by(ColaSincronizacion.created_at).all()
    return [
        {"id": p.id, "operacion": p.operacion, "tabla": p.tabla,
         "registro_id": p.registro_id, "datos": p.datos}
        for p in pendientes
    ]


@router.post("/ack/{sync_id}")
def ack_sync(sync_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    entrada = db.query(ColaSincronizacion).filter(ColaSincronizacion.id == sync_id).first()
    if not entrada:
        raise HTTPException(status_code=404)
    entrada.estado = "sincronizado"
    entrada.synced_at = datetime.utcnow()
    db.commit()
    return {"detail": "Confirmado"}
