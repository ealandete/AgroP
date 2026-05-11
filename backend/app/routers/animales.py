import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Animal, EventoAnimal, Raza, Usuario, Lote
from app.schemas import AnimalCreate, AnimalOut, EventoAnimalCreate, EventoAnimalOut, AnimalStats, RazaOut
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/animales", tags=["Animales"])


@router.get("/", response_model=list[AnimalOut])
def listar_animales(
    especie: Optional[str] = None,
    lote_id: Optional[int] = None,
    activo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    q = db.query(Animal)
    if especie:
        q = q.filter(Animal.especie == especie)
    if lote_id:
        q = q.filter(Animal.lote_id == lote_id)
    if activo is not None:
        q = q.filter(Animal.activo == activo)
    return q.order_by(Animal.codigo).all()


@router.get("/{animal_id}", response_model=AnimalOut)
def obtener_animal(animal_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    return animal


@router.post("/", response_model=AnimalOut, status_code=201)
def crear_animal(payload: AnimalCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    animal = Animal(**payload.model_dump())
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


@router.put("/{animal_id}", response_model=AnimalOut)
def actualizar_animal(animal_id: int, payload: AnimalCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    for k, v in payload.model_dump().items():
        setattr(animal, k, v)
    db.commit()
    db.refresh(animal)
    return animal


@router.delete("/{animal_id}")
def eliminar_animal(animal_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    animal.activo = False
    db.commit()
    return {"detail": "Animal desactivado"}


@router.get("/{animal_id}/eventos", response_model=list[EventoAnimalOut])
def listar_eventos(animal_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(EventoAnimal).filter(EventoAnimal.animal_id == animal_id).order_by(EventoAnimal.fecha.desc()).all()


@router.post("/{animal_id}/eventos", response_model=EventoAnimalOut, status_code=201)
def crear_evento(animal_id: int, payload: EventoAnimalCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    payload.animal_id = animal_id
    evento = EventoAnimal(**payload.model_dump())
    db.add(evento)
    db.commit()
    db.refresh(evento)
    return evento


@router.get("/stats/resumen", response_model=list[AnimalStats])
def estadisticas_animales(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    from sqlalchemy import func, case
    resultados = (
        db.query(
            Animal.especie,
            func.count(Animal.id).label("total"),
            func.sum(case((Animal.activo == True, 1), else_=0)).label("activos"),
            func.sum(case((Animal.motivo_salida == "muerte", 1), else_=0)).label("muertos"),
            func.sum(case((Animal.motivo_salida == "venta", 1), else_=0)).label("vendidos"),
        )
        .group_by(Animal.especie)
        .all()
    )
    stats = []
    for r in resultados:
        stats.append(AnimalStats(
            especie=r[0],
            total=r[1] or 0,
            activos=r[2] or 0,
            enfermos=0,
            muertos=r[3] or 0,
            vendidos=r[4] or 0,
        ))
    return stats


@router.post("/carga-masiva", status_code=201)
def carga_masiva_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos CSV")

    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    required = {"codigo", "especie", "sexo"}
    if not required.issubset(reader.fieldnames or []):
        raise HTTPException(status_code=400, detail=f"Columnas requeridas: {', '.join(required)}")

    creados = 0
    errores = []

    for i, row in enumerate(reader, start=2):
        try:
            codigo = row.get("codigo", "").strip()
            especie = row.get("especie", "").strip()
            sexo = row.get("sexo", "").strip()

            if not codigo or not especie or not sexo:
                errores.append(f"Fila {i}: codigo, especie y sexo son obligatorios")
                continue

            if sexo not in ("M", "H"):
                errores.append(f"Fila {i}: sexo debe ser M o H")
                continue

            fecha_nacimiento = None
            fn = row.get("fecha_nacimiento", "").strip()
            if fn:
                try:
                    fecha_nacimiento = date.fromisoformat(fn)
                except ValueError:
                    errores.append(f"Fila {i}: fecha_nacimiento inválida '{fn}'")
                    continue

            peso = None
            ps = row.get("peso_kg", "").strip()
            if ps:
                try:
                    peso = float(ps)
                except ValueError:
                    errores.append(f"Fila {i}: peso_kg inválido '{ps}'")
                    continue

            lote_id = None
            li = row.get("lote_id", "").strip()
            if li:
                try:
                    lote_id = int(li)
                except ValueError:
                    errores.append(f"Fila {i}: lote_id inválido '{li}'")
                    continue

            animal = Animal(
                codigo=codigo,
                especie=especie,
                sexo=sexo,
                nombre=row.get("nombre", "").strip() or None,
                raza_id=None,
                fecha_nacimiento=fecha_nacimiento,
                fecha_ingreso=date.today(),
                peso_kg=peso,
                color=row.get("color", "").strip() or None,
                lote_id=lote_id,
                finca_id=current_user.finca_id,
                activo=True,
            )
            db.add(animal)
            db.flush()
            creados += 1
        except Exception as e:
            errores.append(f"Fila {i}: {str(e)}")

    db.commit()
    return {"creados": creados, "errores": errores}


@router.get("/razas/", response_model=list[RazaOut])
def listar_razas(especie: Optional[str] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    q = db.query(Raza)
    if especie:
        q = q.filter(Raza.especie == especie)
    return q.order_by(Raza.especie, Raza.nombre).all()
