from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Mensaje, Usuario
from app.schemas import MensajeCreate, MensajeOut, MensajeNoLeidos
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/mensajes", tags=["Mensajeria"])


def _format_mensaje(m, db):
    de = db.query(Usuario).filter(Usuario.id == m.de_id).first()
    para = db.query(Usuario).filter(Usuario.id == m.para_id).first()
    return MensajeOut(
        id=m.id, de_id=m.de_id, para_id=m.para_id,
        asunto=m.asunto, cuerpo=m.cuerpo,
        leido=m.leido, prioridad=m.prioridad,
        created_at=m.created_at,
        de_nombre=f"{de.nombre} {de.apellido or ''}".strip() if de else None,
        para_nombre=f"{para.nombre} {para.apellido or ''}".strip() if para else None,
    )


@router.get("/", response_model=list[MensajeOut])
def listar_mensajes(
    tipo: str = Query("inbox"),
    leido: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if tipo == "inbox":
        q = db.query(Mensaje).filter(Mensaje.para_id == current_user.id)
    else:
        q = db.query(Mensaje).filter(Mensaje.de_id == current_user.id)
    if leido is not None:
        q = q.filter(Mensaje.leido == leido)
    mensajes = q.order_by(Mensaje.created_at.desc()).all()
    return [_format_mensaje(m, db) for m in mensajes]


@router.post("/", response_model=MensajeOut, status_code=201)
def enviar_mensaje(
    payload: MensajeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    destinatario = db.query(Usuario).filter(Usuario.id == payload.para_id).first()
    if not destinatario:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado")
    mensaje = Mensaje(
        de_id=current_user.id,
        para_id=payload.para_id,
        asunto=payload.asunto,
        cuerpo=payload.cuerpo,
        prioridad=payload.prioridad,
    )
    db.add(mensaje)
    db.commit()
    db.refresh(mensaje)
    return _format_mensaje(mensaje, db)


@router.put("/{mensaje_id}/leer", response_model=MensajeOut)
def marcar_leido(
    mensaje_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    mensaje = db.query(Mensaje).filter(Mensaje.id == mensaje_id).first()
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if mensaje.para_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes marcar como leído un mensaje que no es tuyo")
    mensaje.leido = True
    db.commit()
    db.refresh(mensaje)
    return _format_mensaje(mensaje, db)


@router.get("/no-leidos", response_model=MensajeNoLeidos)
def contar_no_leidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    total = db.query(Mensaje).filter(
        Mensaje.para_id == current_user.id,
        Mensaje.leido == False,
    ).count()
    return MensajeNoLeidos(total=total)
