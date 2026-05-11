from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import Usuario, Rol, Finca, Auditoria, Parametro
from app.schemas import (
    UsuarioCreate, UsuarioOut, UsuarioUpdate,
    RolOut, RolCreate,
)
from app.utils.auth import get_current_user, hash_password
from app.config import settings

router = APIRouter(prefix="/api", tags=["Sistema"])


# ─── USUARIOS ───────────────────────────────────────────────

@router.get("/usuarios/")
def listar_usuarios(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    usuarios = db.query(Usuario).options(
        joinedload(Usuario.rol), joinedload(Usuario.finca)
    ).order_by(Usuario.nombre).all()
    result = []
    for u in usuarios:
        result.append({
            "id": u.id,
            "email": u.email,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "telefono": u.telefono,
            "rol_id": u.rol_id,
            "rol_nombre": u.rol.nombre if u.rol else None,
            "finca_id": u.finca_id,
            "finca_nombre": u.finca.nombre if u.finca else None,
            "activo": u.activo,
            "ultimo_acceso": u.ultimo_acceso,
            "created_at": u.created_at,
        })
    return result


@router.post("/usuarios/", response_model=UsuarioOut, status_code=201)
def crear_usuario(payload: UsuarioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    existing = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    user = Usuario(
        email=payload.email,
        password_hash=hash_password(payload.password),
        nombre=payload.nombre,
        apellido=payload.apellido,
        telefono=payload.telefono,
        rol_id=payload.rol_id,
        finca_id=payload.finca_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/usuarios/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(usuario_id: int, payload: UsuarioUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    update_data = payload.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password")
    for k, v in update_data.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/usuarios/{usuario_id}", status_code=204)
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()


# ─── ROLES ──────────────────────────────────────────────────

@router.get("/roles/", response_model=list[RolOut])
def listar_roles(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Rol).order_by(Rol.nombre).all()


@router.post("/roles/", response_model=RolOut, status_code=201)
def crear_rol(payload: RolCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    existing = db.query(Rol).filter(Rol.nombre == payload.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="El rol ya existe")
    rol = Rol(**payload.model_dump())
    db.add(rol)
    db.commit()
    db.refresh(rol)
    return rol


# ─── AUDITORIA ──────────────────────────────────────────────

@router.get("/auditoria/")
def listar_auditoria(
    tabla: Optional[str] = Query(None),
    accion: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    usuario_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Auditoria)

    if tabla:
        q = q.filter(Auditoria.tabla == tabla)
    if accion:
        q = q.filter(Auditoria.accion == accion)
    if usuario_id:
        q = q.filter(Auditoria.usuario_id == usuario_id)
    if fecha_desde:
        try:
            dt = datetime.fromisoformat(fecha_desde)
            q = q.filter(Auditoria.created_at >= dt)
        except ValueError:
            pass
    if fecha_hasta:
        try:
            dt = datetime.fromisoformat(fecha_hasta)
            q = q.filter(Auditoria.created_at <= dt)
        except ValueError:
            pass

    total = q.count()
    registros = q.order_by(Auditoria.created_at.desc()).offset(
        (page - 1) * per_page
    ).limit(per_page).all()

    usuario_ids = list(set(r.usuario_id for r in registros if r.usuario_id))
    usuarios_map = {}
    if usuario_ids:
        for u in db.query(Usuario).filter(Usuario.id.in_(usuario_ids)).all():
            usuarios_map[u.id] = f"{u.nombre} {u.apellido or ''}".strip()

    result = []
    for r in registros:
        result.append({
            "id": r.id,
            "usuario_id": r.usuario_id,
            "usuario_nombre": usuarios_map.get(r.usuario_id),
            "tabla": r.tabla,
            "registro_id": r.registro_id,
            "accion": r.accion,
            "datos_prev": r.datos_prev,
            "datos_nuevo": r.datos_nuevo,
            "ip": r.ip,
            "created_at": r.created_at,
        })
    return {"total": total, "page": page, "per_page": per_page, "data": result}


@router.post("/auditoria/", status_code=201)
def crear_auditoria(payload: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    entry = Auditoria(
        usuario_id=payload.get("usuario_id") or current_user.id,
        tabla=payload.get("tabla", ""),
        registro_id=payload.get("registro_id"),
        accion=payload.get("accion", "INSERT"),
        datos_prev=payload.get("datos_prev"),
        datos_nuevo=payload.get("datos_nuevo"),
        ip=payload.get("ip"),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ─── DIAGNÓSTICO ────────────────────────────────────────────

@router.get("/diagnostico/")
def diagnostico_sistema(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    db_status = "ERROR"
    total_tablas = 0
    conteos = {}
    ultima_auditoria = None
    usuarios_activos = 0
    usuarios_total = 0

    try:
        db.execute(text("SELECT 1"))
        db_status = "OK"

        result = db.execute(
            text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")
        )
        total_tablas = result.scalar() or 0

        for tbl in ["animales", "fincas", "lotes", "siembras", "usuarios"]:
            try:
                r = db.execute(text(f"SELECT COUNT(*) FROM {tbl}"))
                conteos[tbl] = r.scalar() or 0
            except Exception:
                conteos[tbl] = 0

        ultimo = db.query(Auditoria).order_by(Auditoria.created_at.desc()).first()
        if ultimo:
            ultima_auditoria = ultimo.created_at
        usuarios_total = db.query(Usuario).count()
        usuarios_activos = db.query(Usuario).filter(Usuario.activo == True).count()
    except Exception:
        db_status = "ERROR"

    return {
        "db_status": db_status,
        "total_tablas": total_tablas,
        "conteos": conteos,
        "ultima_auditoria": ultima_auditoria,
        "api_version": settings.APP_VERSION,
        "usuarios_activos": usuarios_activos,
        "usuarios_total": usuarios_total,
    }


# ─── CONFIGURACIÓN IA ───────────────────────────────────────

CLAVES_IA = ["ia_api_key", "ia_modelo", "ia_url_base", "ia_temperatura", "ia_max_tokens"]


@router.get("/config-ia/")
def get_config_ia(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    params = db.query(Parametro).filter(Parametro.clave.in_(CLAVES_IA)).all()
    config = {p.clave: p.valor for p in params}
    return {
        "api_key": config.get("ia_api_key", ""),
        "modelo": config.get("ia_modelo", ""),
        "url_base": config.get("ia_url_base", ""),
        "temperatura": float(config.get("ia_temperatura", "0.7")),
        "max_tokens": int(config.get("ia_max_tokens", "2048")),
    }


@router.put("/config-ia/")
def update_config_ia(payload: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    mapping = {
        "api_key": "ia_api_key",
        "modelo": "ia_modelo",
        "url_base": "ia_url_base",
        "temperatura": "ia_temperatura",
        "max_tokens": "ia_max_tokens",
    }
    for field, clave in mapping.items():
        if field in payload and payload[field] is not None:
            val = str(payload[field])
            existing = db.query(Parametro).filter(Parametro.clave == clave).first()
            if existing:
                existing.valor = val
            else:
                db.add(Parametro(clave=clave, valor=val, tipo="string", descripcion=clave))
    db.commit()
    return get_config_ia(db=db, current_user=current_user)
