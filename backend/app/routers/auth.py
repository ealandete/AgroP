from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, Token, UsuarioCreate, UsuarioOut
from app.utils.auth import verify_password, hash_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": {
            "id": user.id,
            "email": user.email,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "rol_id": user.rol_id,
            "finca_id": user.finca_id,
        },
    }


@router.get("/me", response_model=UsuarioOut)
def me(current_user: Usuario = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=UsuarioOut)
def register(payload: UsuarioCreate, db: Session = Depends(get_db)):
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


@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Usuario).all()
