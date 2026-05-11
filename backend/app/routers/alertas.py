from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models import (
    Alert, WebhookConfig, Usuario, Animal, Sanidad, Pesaje,
    Insumo, Inventario, Siembra, Lote, AnalisisSuelo, Parametro,
)
from app.schemas import (
    AlertOut, WebhookConfigOut, WebhookConfigCreate, WebhookConfigUpdate,
    TelegramConfig, DispararWebhookRequest,
)
from app.utils.auth import get_current_user
import httpx

router = APIRouter(prefix="/api/alertas", tags=["Alertas"])


def _generar_alertas(db: Session, finca_id: Optional[int] = None):
    old = db.query(Alert).filter(Alert.tipo != "personalizado")
    if finca_id:
        old = old.filter(Alert.finca_id == finca_id)
    old.delete(synchronize_session=False)
    db.flush()

    hoy = date.today()
    dentro_30 = hoy + timedelta(days=30)
    count = 0

    def _filtro_finca(q, model_cls):
        if finca_id:
            return q.filter(model_cls.finca_id == finca_id)
        return q

    q = db.query(Sanidad).join(Animal)
    q = _filtro_finca(q, Animal)
    vacunas = q.filter(
        Sanidad.tipo == "vacunacion",
        Sanidad.fecha_proximo_control.isnot(None),
        Sanidad.fecha_proximo_control.between(hoy, dentro_30),
        Animal.activo == True,
    ).all()
    for v in vacunas:
        db.add(Alert(
            finca_id=finca_id, tipo="vacuna",
            titulo="Vacuna próxima a vencer",
            descripcion=f"{v.producto_aplicado or 'Vacuna'} vence el {v.fecha_proximo_control} para animal #{v.animal_id}",
            severidad="alta",
            referencia_tabla="sanidad", referencia_id=v.id,
        ))
        count += 1

    subq = db.query(
        Pesaje.animal_id, func.max(Pesaje.fecha).label("ultimo_pesaje")
    ).group_by(Pesaje.animal_id).subquery()

    q = db.query(Animal).outerjoin(subq, Animal.id == subq.c.animal_id)
    q = _filtro_finca(q, Animal)
    sin_pesaje = q.filter(
        Animal.activo == True,
        (subq.c.ultimo_pesaje == None) | (subq.c.ultimo_pesaje < hoy - timedelta(days=60)),
    ).all()
    for a in sin_pesaje:
        db.add(Alert(
            finca_id=finca_id, tipo="pesaje",
            titulo=f"Animal sin pesaje: {a.codigo or a.nombre or '#' + str(a.id)}",
            descripcion="No tiene registro de pesaje en los últimos 60 días",
            severidad="media",
            referencia_tabla="animales", referencia_id=a.id,
        ))
        count += 1

    insumos = db.query(Insumo).filter(
        Insumo.stock_minimo.isnot(None), Insumo.stock_minimo > 0,
    ).all()
    for ins in insumos:
        stock_actual = db.query(func.coalesce(func.sum(Inventario.cantidad), 0)).filter(
            Inventario.insumo_id == ins.id
        ).scalar() or 0
        if stock_actual < ins.stock_minimo:
            db.add(Alert(
                finca_id=finca_id, tipo="inventario",
                titulo=f"Stock bajo: {ins.nombre}",
                descripcion=f"Actual: {float(stock_actual):.2f} {ins.unidad_medida}, Mínimo: {float(ins.stock_minimo):.2f}",
                severidad="alta",
                referencia_tabla="insumos", referencia_id=ins.id,
            ))
            count += 1

    q = db.query(Siembra).join(Lote)
    q = _filtro_finca(q, Lote)
    vencidas = q.filter(
        Siembra.fecha_cosecha_estimada.isnot(None),
        Siembra.fecha_cosecha_estimada < hoy,
        Siembra.estado == "activo",
        Siembra.fecha_cosecha_real.is_(None),
    ).all()
    for s in vencidas:
        db.add(Alert(
            finca_id=finca_id, tipo="cosecha",
            titulo=f"Cosecha vencida: {s.cultivo}",
            descripcion=f"Fecha estimada ({s.fecha_cosecha_estimada}) ya pasó en lote #{s.lote_id}",
            severidad="critica",
            referencia_tabla="siembras", referencia_id=s.id,
        ))
        count += 1

    q = db.query(Animal)
    q = _filtro_finca(q, Animal)
    prestamo = q.filter(
        Animal.estado_origen.in_(["prestamo", "adopcion"]),
        Animal.activo == True,
        Animal.updated_at < hoy - timedelta(days=90),
    ).all()
    for a in prestamo:
        db.add(Alert(
            finca_id=finca_id, tipo="prestamo",
            titulo=f"Animal en {a.estado_origen}: {a.codigo or a.nombre or '#' + str(a.id)}",
            descripcion=f"Sin actualizar desde {a.updated_at.date() if a.updated_at else 'N/A'}",
            severidad="media",
            referencia_tabla="animales", referencia_id=a.id,
        ))
        count += 1

    subq2 = db.query(
        AnalisisSuelo.lote_id, func.max(AnalisisSuelo.fecha).label("ultimo")
    ).group_by(AnalisisSuelo.lote_id).subquery()

    q = db.query(Lote).outerjoin(subq2, Lote.id == subq2.c.lote_id)
    q = _filtro_finca(q, Lote)
    lotes = q.filter(
        Lote.activo == True,
        (subq2.c.ultimo == None) | (subq2.c.ultimo < hoy - timedelta(days=180)),
    ).all()
    for l in lotes:
        db.add(Alert(
            finca_id=finca_id, tipo="analisis",
            titulo=f"Lote sin análisis: {l.nombre}",
            descripcion="No tiene análisis de suelo en los últimos 6 meses",
            severidad="media",
            referencia_tabla="lotes", referencia_id=l.id,
        ))
        count += 1

    db.commit()
    return count


@router.get("/", response_model=list[AlertOut])
def listar_alertas(
    tipo: Optional[str] = Query(None),
    leida: Optional[bool] = Query(None),
    severidad: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    resuelta: Optional[bool] = Query(None),
    finca_id: Optional[int] = Query(None),
    generar: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    fid = finca_id or current_user.finca_id
    q = db.query(Alert)
    if fid:
        q = q.filter(Alert.finca_id == fid)
    if tipo:
        q = q.filter(Alert.tipo == tipo)
    if leida is not None:
        q = q.filter(Alert.leida == leida)
    if severidad:
        q = q.filter(Alert.severidad == severidad)
    if resuelta is not None:
        q = q.filter(Alert.resuelta == resuelta)
    if fecha_desde:
        try:
            dt = datetime.fromisoformat(fecha_desde)
            q = q.filter(Alert.created_at >= dt)
        except ValueError:
            pass
    if generar or q.count() == 0:
        _generar_alertas(db, fid)
        q = db.query(Alert)
        if fid:
            q = q.filter(Alert.finca_id == fid)
        if tipo:
            q = q.filter(Alert.tipo == tipo)
        if leida is not None:
            q = q.filter(Alert.leida == leida)
        if severidad:
            q = q.filter(Alert.severidad == severidad)
        if resuelta is not None:
            q = q.filter(Alert.resuelta == resuelta)
        if fecha_desde:
            try:
                dt = datetime.fromisoformat(fecha_desde)
                q = q.filter(Alert.created_at >= dt)
            except ValueError:
                pass
    return q.order_by(Alert.created_at.desc()).all()


@router.post("/generar")
def generar_alertas(
    finca_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    fid = finca_id or current_user.finca_id
    count = _generar_alertas(db, fid)
    return {"mensaje": f"Alertas generadas: {count}", "total": count}


@router.put("/{alerta_id}/leer", response_model=AlertOut)
def marcar_leida(
    alerta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alerta_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.leida = True
    db.commit()
    return alert


@router.put("/{alerta_id}/resolver", response_model=AlertOut)
def marcar_resuelta(
    alerta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    alert = db.query(Alert).filter(Alert.id == alerta_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.resuelta = True
    alert.leida = True
    alert.resuelta_en = datetime.now()
    db.commit()
    return alert


@router.post("/notificar-telegram")
def notificar_telegram(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    bot = db.query(Parametro).filter(Parametro.clave == "telegram_bot_token").first()
    chat = db.query(Parametro).filter(Parametro.clave == "telegram_chat_id").first()
    if not bot or not bot.valor:
        raise HTTPException(status_code=400, detail="Bot token de Telegram no configurado")
    if not chat or not chat.valor:
        raise HTTPException(status_code=400, detail="Chat ID de Telegram no configurado")

    alerts = db.query(Alert).filter(Alert.resuelta == False).order_by(Alert.created_at.desc()).limit(20).all()
    if not alerts:
        return {"mensaje": "No hay alertas pendientes"}

    icons = {"critica": "🚨", "alta": "⚠️", "media": "🟡", "baja": "🔵"}
    lines = ["🔔 *Alertas AgroP - Pendientes*\n"]
    for a in alerts:
        icon = icons.get(a.severidad, "📌")
        lines.append(f"{icon} *{a.titulo}*")
        if a.descripcion:
            lines.append(f"   {a.descripcion[:200]}")
        lines.append("")
    lines.append(f"---\nTotal: {len(alerts)} pendiente(s)")

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                f"https://api.telegram.org/bot{bot.valor}/sendMessage",
                json={"chat_id": chat.valor, "text": "\n".join(lines), "parse_mode": "Markdown", "disable_web_page_preview": True},
            )
            data = resp.json()
            if not data.get("ok"):
                raise HTTPException(status_code=502, detail=f"Telegram error: {data.get('description', 'unknown')}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Error connecting to Telegram: {str(e)}")

    return {"mensaje": "Notificación enviada a Telegram", "total": len(alerts)}


@router.get("/config-telegram", response_model=TelegramConfig)
def get_config_telegram(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    bot = db.query(Parametro).filter(Parametro.clave == "telegram_bot_token").first()
    chat = db.query(Parametro).filter(Parametro.clave == "telegram_chat_id").first()
    return TelegramConfig(bot_token=bot.valor if bot else "", chat_id=chat.valor if chat else "")


@router.put("/config-telegram", response_model=TelegramConfig)
def update_config_telegram(
    payload: TelegramConfig,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    for clave, valor in [("telegram_bot_token", payload.bot_token), ("telegram_chat_id", payload.chat_id)]:
        existing = db.query(Parametro).filter(Parametro.clave == clave).first()
        if existing:
            existing.valor = valor
        else:
            db.add(Parametro(clave=clave, valor=valor, tipo="string", descripcion=f"Telegram {clave}"))
    db.commit()
    return payload


@router.post("/webhooks/", response_model=WebhookConfigOut, status_code=201)
def crear_webhook(
    payload: WebhookConfigCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    wh = WebhookConfig(url=payload.url, eventos=payload.eventos)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/webhooks/", response_model=list[WebhookConfigOut])
def listar_webhooks(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return db.query(WebhookConfig).order_by(WebhookConfig.created_at.desc()).all()


@router.put("/webhooks/{webhook_id}", response_model=WebhookConfigOut)
def actualizar_webhook(
    webhook_id: int,
    payload: WebhookConfigUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    wh = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(wh, k, v)
    db.commit()
    db.refresh(wh)
    return wh


@router.delete("/webhooks/{webhook_id}", status_code=204)
def eliminar_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    wh = db.query(WebhookConfig).filter(WebhookConfig.id == webhook_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook no encontrado")
    db.delete(wh)
    db.commit()


@router.post("/webhooks/disparar")
def disparar_webhooks(
    payload: DispararWebhookRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    webhooks = db.query(WebhookConfig).filter(
        WebhookConfig.activo == True,
        WebhookConfig.eventos.like(f"%{payload.evento}%"),
    ).all()
    sent = 0
    for wh in webhooks:
        try:
            with httpx.Client(timeout=10) as client:
                client.post(wh.url, json={"evento": payload.evento, "datos": payload.datos or {}, "timestamp": datetime.now().isoformat()})
            sent += 1
        except httpx.RequestError:
            pass
    return {"mensaje": f"Webhooks disparados: {sent}/{len(webhooks)}"}
