from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import csv, io
from app.database import get_db
from app.models import Animal, GrupoManejo, Parametro, Finca, Usuario
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Utilidades"])


# ---- GRUPOS DE MANEJO ----
@router.get("/grupos-manejo/")
def listar_grupos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(GrupoManejo).filter(GrupoManejo.activo == True).all()


# ---- PARAMETROS ----
@router.get("/parametros/")
def listar_parametros(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Parametro).all()


@router.put("/parametros/{param_id}")
def actualizar_parametro(param_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    p = db.query(Parametro).filter(Parametro.id == param_id).first()
    if not p: raise HTTPException(404)
    p.valor = data.get("valor", p.valor)
    db.commit()
    return p


# ---- FINCAS (crud) ----
@router.put("/fincas/{finca_id}")
def actualizar_finca(finca_id: int, data: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    finca = db.query(Finca).filter(Finca.id == finca_id).first()
    if not finca: raise HTTPException(404)
    for k, v in data.items():
        if hasattr(finca, k): setattr(finca, k, v)
    db.commit()
    return {"detail": "Finca actualizada"}


# ---- CARGA MASIVA DE ANIMALES (CSV) ----
@router.post("/animales/carga-masiva")
async def carga_masiva_animales(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
    insertados = 0
    errores = []
    for i, row in enumerate(reader):
        try:
            animal = Animal(
                finca_id=int(row.get("finca_id", 4)),
                codigo=row.get("codigo", ""),
                nombre=row.get("nombre"),
                especie=row.get("especie", "bovino"),
                sexo=row.get("sexo", "H"),
                fecha_nacimiento=row.get("fecha_nacimiento") or None,
                fecha_ingreso=row.get("fecha_ingreso") or None,
                peso_kg=float(row.get("peso_kg", 0)) if row.get("peso_kg") else None,
                color=row.get("color"),
                lote_id=int(row["lote_id"]) if row.get("lote_id") else None,
                grupo_manejo_id=int(row["grupo_manejo_id"]) if row.get("grupo_manejo_id") else None,
            )
            db.add(animal)
            insertados += 1
        except Exception as e:
            errores.append({"fila": i + 1, "error": str(e)})
    db.commit()
    return {"insertados": insertados, "errores": errores}
