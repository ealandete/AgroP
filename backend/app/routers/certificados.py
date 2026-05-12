from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import Session, relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db, Base
from app.models import Animal, Finca, Usuario
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/certificados", tags=["Certificados"])

# ─── Models (inline) ─────────────────────────────────────────

class HierroMarcacion(Base):
    __tablename__ = "hierros_marcacion"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    numero_registro_ica = Column(String(50), nullable=False)
    diseno = Column(String(255), nullable=False)
    fecha_registro = Column(Date, nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class CertificadoTraslado(Base):
    __tablename__ = "certificados_traslado"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    destino = Column(String(255), nullable=False)
    motivo = Column(String(255), nullable=False)
    transportista = Column(String(150), nullable=False)
    placa_vehiculo = Column(String(20), nullable=False)
    fecha_salida = Column(Date, nullable=False)
    numero_guia = Column(String(50), unique=True)
    estado = Column(String(30), default="emitido")
    qr_data = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

# ─── Schemas ─────────────────────────────────────────────────

class TrasladoCreate(BaseModel):
    animal_id: int
    destino: str
    motivo: str
    transportista: str
    placa_vehiculo: str
    fecha_salida: date

class TrasladoOut(BaseModel):
    id: int
    animal_id: int
    destino: str
    motivo: str
    transportista: str
    placa_vehiculo: str
    fecha_salida: date
    numero_guia: Optional[str] = None
    estado: str = "emitido"
    qr_data: Optional[str] = None
    animal_codigo: Optional[str] = None
    animal_nombre: Optional[str] = None

    class Config:
        from_attributes = True

class HierroCreate(BaseModel):
    finca_id: int
    numero_registro_ica: str
    diseno: str
    fecha_registro: date
    activo: bool = True

class HierroUpdate(BaseModel):
    numero_registro_ica: Optional[str] = None
    diseno: Optional[str] = None
    fecha_registro: Optional[date] = None
    activo: Optional[bool] = None

class HierroOut(BaseModel):
    id: int
    finca_id: int
    numero_registro_ica: str
    diseno: str
    fecha_registro: date
    activo: bool = True

    class Config:
        from_attributes = True

class PlantillaICAOut(BaseModel):
    titulo: str = "Certificado de Venta o Traslado de Animales"
    resolucion: str = "Resolución ICA 20148 de 2016"
    requisitos: list[str] = [
        "Identificación del animal (código, especie, raza, sexo, edad)",
        "Identificación del propietario y de la finca de origen",
        "Guía sanitaria de movilización ICA",
        "Certificado de vacunación vigente",
        "Desparasitación vigente",
        "Registro del hierro de marcación (si aplica)",
        "Placa del vehículo de transporte",
        "Nombre y documento del transportador",
        "Fecha y hora de salida",
    ]

# ─── Endpoints ───────────────────────────────────────────────

@router.post("/traslado", response_model=TrasladoOut, status_code=201)
def generar_certificado_traslado(
    payload: TrasladoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    animal = db.query(Animal).filter(Animal.id == payload.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")

    import hashlib, json
    guia = f"GTS-{animal.finca_id}-{payload.animal_id}-{int(date.today().strftime('%Y%m%d'))}"
    qr_data_str = json.dumps({
        "guia": guia,
        "animal": animal.codigo or f"#{animal.id}",
        "destino": payload.destino,
        "motivo": payload.motivo,
        "fecha": str(payload.fecha_salida),
        "transportista": payload.transportista,
        "placa": payload.placa_vehiculo,
    }, ensure_ascii=False)
    qr_hash = hashlib.md5(qr_data_str.encode()).hexdigest()[:16]
    qr_content = f"AGROP-CERT:{guia}:{qr_hash}"

    cert = CertificadoTraslado(
        animal_id=payload.animal_id,
        destino=payload.destino,
        motivo=payload.motivo,
        transportista=payload.transportista,
        placa_vehiculo=payload.placa_vehiculo,
        fecha_salida=payload.fecha_salida,
        numero_guia=guia,
        qr_data=qr_content,
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)

    return TrasladoOut(
        id=cert.id,
        animal_id=cert.animal_id,
        destino=cert.destino,
        motivo=cert.motivo,
        transportista=cert.transportista,
        placa_vehiculo=cert.placa_vehiculo,
        fecha_salida=cert.fecha_salida,
        numero_guia=cert.numero_guia,
        estado=cert.estado,
        qr_data=cert.qr_data,
        animal_codigo=animal.codigo,
        animal_nombre=animal.nombre,
    )

@router.get("/traslados", response_model=list[TrasladoOut])
def listar_traslados(
    finca_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    q = db.query(CertificadoTraslado).options(joinedload(CertificadoTraslado.animal))
    if finca_id:
        q = q.join(Animal).filter(Animal.finca_id == finca_id)
    result = []
    for c in q.order_by(CertificadoTraslado.fecha_salida.desc()).all():
        result.append(TrasladoOut(
            id=c.id,
            animal_id=c.animal_id,
            destino=c.destino,
            motivo=c.motivo,
            transportista=c.transportista,
            placa_vehiculo=c.placa_vehiculo,
            fecha_salida=c.fecha_salida,
            numero_guia=c.numero_guia,
            estado=c.estado,
            qr_data=c.qr_data,
            animal_codigo=c.animal.codigo if c.animal else None,
            animal_nombre=c.animal.nombre if c.animal else None,
        ))
    return result

@router.post("/hierros", response_model=HierroOut, status_code=201)
def registrar_hierro(
    payload: HierroCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hierro = HierroMarcacion(**payload.model_dump())
    db.add(hierro)
    db.commit()
    db.refresh(hierro)
    return hierro

@router.get("/hierros/{finca_id}", response_model=list[HierroOut])
def listar_hierros(
    finca_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return db.query(HierroMarcacion).filter(
        HierroMarcacion.finca_id == finca_id
    ).order_by(HierroMarcacion.fecha_registro.desc()).all()

@router.put("/hierros/{hierro_id}", response_model=HierroOut)
def actualizar_hierro(
    hierro_id: int,
    payload: HierroUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hierro = db.query(HierroMarcacion).filter(HierroMarcacion.id == hierro_id).first()
    if not hierro:
        raise HTTPException(status_code=404, detail="Hierro no encontrado")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(hierro, k, v)
    db.commit()
    db.refresh(hierro)
    return hierro

@router.get("/plantilla-ica", response_model=PlantillaICAOut)
def obtener_plantilla_ica():
    return PlantillaICAOut()
