from pydantic import BaseModel, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any
from enum import Enum


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict


class LoginRequest(BaseModel):
    email: str
    password: str


class UsuarioBase(BaseModel):
    email: str
    nombre: str
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    rol_id: int
    finca_id: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioOut(BaseModel):
    id: int
    email: str
    nombre: str
    apellido: Optional[str]
    rol_id: int
    finca_id: Optional[int]
    activo: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UsuarioUpdate(BaseModel):
    email: Optional[str] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    password: Optional[str] = None
    rol_id: Optional[int] = None
    finca_id: Optional[int] = None
    activo: Optional[bool] = None


class RolOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]

    class Config:
        from_attributes = True


class RolCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None


class FincaBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    departamento: Optional[str] = None
    pais: str = "Colombia"
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    area_total: Optional[float] = None
    telefono: Optional[str] = None

class FincaCreate(FincaBase):
    pass

class FincaOut(FincaBase):
    id: int
    activo: bool
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class LoteBase(BaseModel):
    finca_id: int
    nombre: str
    codigo: Optional[str] = None
    area_ha: Optional[float] = None
    tipo_suelo: Optional[str] = None
    uso_actual: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    altitud_msnm: Optional[float] = None
    pendiente_pct: Optional[float] = None
    exposicion: Optional[str] = None
    sistema_riego: Optional[str] = None
    fuente_agua: Optional[str] = None
    caudal_lps: Optional[float] = None
    coordenadas: Optional[Any] = None
    color: str = "#4CAF50"

class LoteCreate(LoteBase):
    pass

class LoteOut(LoteBase):
    id: int
    activo: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class AnimalBase(BaseModel):
    finca_id: int
    lote_id: Optional[int] = None
    grupo_manejo_id: Optional[int] = None
    codigo: Optional[str] = None
    numero_chapeta: Optional[str] = None
    tiene_chapeta: bool = False
    nombre: Optional[str] = None
    especie: str
    raza_id: Optional[int] = None
    sexo: str
    fecha_nacimiento: Optional[date] = None
    fecha_ingreso: date
    fecha_salida: Optional[date] = None
    motivo_salida: Optional[str] = None
    peso_kg: Optional[float] = None
    color: Optional[str] = None
    marcas_senales: Optional[str] = None
    marcas_hierro: Optional[str] = None
    microchip_id: Optional[str] = None
    foto_url: Optional[str] = None
    madre_id: Optional[int] = None
    padre_id: Optional[int] = None
    estado_origen: str = "propio"

class AnimalCreate(AnimalBase):
    pass

class AnimalOut(AnimalBase):
    id: int
    activo: bool
    estado_origen: str = "propio"
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class AnimalStats(BaseModel):
    especie: str
    total: int
    activos: int
    enfermos: int
    muertos: int
    vendidos: int


class EventoAnimalBase(BaseModel):
    animal_id: int
    tipo_evento: str
    fecha: date
    diagnostico: Optional[str] = None
    descripcion: Optional[str] = None
    dosis: Optional[str] = None
    via_aplicacion: Optional[str] = None
    veterinario: Optional[str] = None
    costo: Optional[float] = None
    observaciones: Optional[str] = None

class EventoAnimalCreate(EventoAnimalBase):
    pass

class EventoAnimalOut(EventoAnimalBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class SiembraBase(BaseModel):
    lote_id: int
    variedad_id: Optional[int] = None
    cultivo: str
    fecha_siembra: date
    fecha_cosecha_estimada: Optional[date] = None
    fecha_cosecha_real: Optional[date] = None
    area_ha: Optional[float] = None
    cantidad_semilla: Optional[float] = None
    metodo_siembra: Optional[str] = None
    estado: str = "activo"
    rendimiento_kg: Optional[float] = None
    rendimiento_ha: Optional[float] = None
    observaciones: Optional[str] = None

class SiembraCreate(SiembraBase):
    pass

class SiembraOut(SiembraBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class CosechaBase(BaseModel):
    siembra_id: int
    lote_id: int
    fecha: date
    cantidad_kg: float
    calidad: Optional[str] = None
    humedad_pct: Optional[float] = None
    metodo: Optional[str] = None
    mano_obra: Optional[int] = None
    horas_trabajo: Optional[float] = None
    destino: Optional[str] = None
    observaciones: Optional[str] = None

class CosechaCreate(CosechaBase):
    pass

class CosechaOut(CosechaBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class AnalisisSueloBase(BaseModel):
    lote_id: int
    fecha: date
    ph: Optional[float] = None
    nitrogeno: Optional[float] = None
    fosforo: Optional[float] = None
    potasio: Optional[float] = None
    materia_organica: Optional[float] = None
    humedad: Optional[float] = None
    textura: Optional[str] = None
    profundidad_cm: Optional[int] = None
    observaciones: Optional[str] = None

class AnalisisSueloCreate(AnalisisSueloBase):
    pass

class AnalisisSueloOut(AnalisisSueloBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProductoBase(BaseModel):
    nombre: str
    tipo: str
    unidad_medida: str
    precio_ref: Optional[float] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoOut(ProductoBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class VentaBase(BaseModel):
    producto_id: int
    finca_id: int
    fecha: date
    cliente: Optional[str] = None
    cantidad: float
    precio_unitario: float
    total: Optional[float] = None
    medio_pago: Optional[str] = None
    comprobante: Optional[str] = None
    observaciones: Optional[str] = None

class VentaCreate(VentaBase):
    pass

class VentaOut(VentaBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class CostoBase(BaseModel):
    categoria_id: Optional[int] = None
    finca_id: int
    fecha: date
    descripcion: str
    monto: float
    lote_id: Optional[int] = None
    siembra_id: Optional[int] = None
    animal_id: Optional[int] = None
    compra_id: Optional[int] = None
    medio_pago: Optional[str] = None
    comprobante: Optional[str] = None

class CostoCreate(CostoBase):
    pass

class CostoOut(CostoBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class InsumoBase(BaseModel):
    categoria_id: Optional[int] = None
    codigo: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    unidad_medida: str
    stock_minimo: Optional[float] = None
    tipo: Optional[str] = None

class InsumoCreate(InsumoBase):
    pass

class InsumoOut(InsumoBase):
    id: int
    activo: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class InventarioBase(BaseModel):
    insumo_id: int
    lote_almacen: Optional[str] = None
    cantidad: float
    costo_unitario: Optional[float] = None
    fecha_ingreso: date
    fecha_vencimiento: Optional[date] = None
    ubicacion: Optional[str] = None
    proveedor_id: Optional[int] = None
    factura_compra: Optional[str] = None

class InventarioCreate(InventarioBase):
    pass

class InventarioOut(InventarioBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# Estadísticas
class DashboardStats(BaseModel):
    total_animales: int
    total_bovinos: int
    total_porcinos: int
    total_aves: int = 0
    total_caprinos: int = 0
    total_ovinos: int = 0
    total_equinos: int = 0
    huevos_hoy: int = 0
    colmenas_activas: int = 0
    total_siembras_activas: int
    area_cultivada_ha: float
    litros_leche_mes: float
    ingresos_mes: float
    gastos_mes: float
    balance_mes: float


class RazaOut(BaseModel):
    id: int
    especie: str
    nombre: str
    proposito: Optional[str]

    class Config:
        from_attributes = True


class VariedadCultivoOut(BaseModel):
    id: int
    cultivo: str
    variedad: str
    dias_ciclo: Optional[int]
    rendimiento_ref: Optional[float]
    tolerancia: Optional[str]

    class Config:
        from_attributes = True


class PlagaOut(BaseModel):
    id: int
    nombre: str
    tipo: str
    afecta_a: Optional[str]
    cultivo_especie: Optional[str]
    sintomas: Optional[str]
    tratamiento_general: Optional[str]
    severidad: Optional[str]

    class Config:
        from_attributes = True


class TratamientoBase(BaseModel):
    plaga_id: Optional[int] = None
    siembra_id: Optional[int] = None
    lote_id: Optional[int] = None
    animal_id: Optional[int] = None
    tipo: str
    producto: str
    principio_activo: Optional[str] = None
    dosis: Optional[str] = None
    cantidad_aplicada: Optional[float] = None
    unidad: Optional[str] = None
    fecha_aplicacion: date
    fecha_vencimiento: Optional[date] = None
    responsable: Optional[str] = None
    costo: Optional[float] = None
    efectividad: Optional[str] = None
    observaciones: Optional[str] = None

class TratamientoCreate(TratamientoBase):
    pass

class TratamientoOut(TratamientoBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProveedorOut(BaseModel):
    id: int
    nombre: str
    nit: Optional[str]
    contacto: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    categoria: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


class ProduccionOut(BaseModel):
    id: int
    producto_id: int
    finca_id: int
    fecha: date
    cantidad: float
    observaciones: Optional[str]

    class Config:
        from_attributes = True


class SyncPayload(BaseModel):
    dispositivo_id: str
    operacion: str
    tabla: str
    registro_id: Optional[int] = None
    datos: dict


class ParametroOut(BaseModel):
    id: int
    clave: str
    valor: str
    tipo: str
    descripcion: Optional[str]

    class Config:
        from_attributes = True


# --- Planeación: Plan de Actividades ---
class PlanActividadBase(BaseModel):
    finca_id: int
    tipo_actividad: str
    descripcion: Optional[str] = None
    fecha_programada: date
    fecha_completada: Optional[date] = None
    estado: str = "pendiente"
    responsable: Optional[str] = None
    observaciones: Optional[str] = None

class PlanActividadCreate(PlanActividadBase):
    pass

class PlanActividadOut(PlanActividadBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class IndicadoresActividades(BaseModel):
    total_programadas: int
    completadas: int
    vencidas: int
    cumplimiento_pct: float


# --- Planeación: Presupuestos ---
class PresupuestoBase(BaseModel):
    finca_id: int
    nombre: str
    periodo: Optional[str] = None
    monto_total: Optional[float] = 0
    estado: str = "activo"

class PresupuestoCreate(PresupuestoBase):
    pass

class PresupuestoOut(PresupuestoBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    partidas: list = []

    class Config:
        from_attributes = True


class PresupuestoPartidaBase(BaseModel):
    nombre: str
    monto_estimado: Optional[float] = 0
    monto_real: Optional[float] = 0

class PresupuestoPartidaCreate(PresupuestoPartidaBase):
    pass

class PresupuestoPartidaOut(PresupuestoPartidaBase):
    id: int
    presupuesto_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Consumo de Insumos ---
class SaludCultivoOut(BaseModel):
    total_plantas: int
    plantas_afectadas: int
    salud_pct: float
    casos: list[dict]


class MarcarPlantaIn(BaseModel):
    ubicacion: str
    tipo_afectacion: str
    severidad: str = "leve"
    observaciones: Optional[str] = None


class ValidarUsoOut(BaseModel):
    lote_id: int
    area_ha: float
    area_cultivada: float
    area_disponible: float
    warnings: list[str]


class ConsumoInsumoBase(BaseModel):
    insumo_id: int
    finca_id: int
    cantidad: float
    fecha: date
    tipo_consumo: Optional[str] = None
    animal_id: Optional[int] = None
    siembra_id: Optional[int] = None
    lote_id: Optional[int] = None
    observaciones: Optional[str] = None

class ConsumoInsumoCreate(ConsumoInsumoBase):
    pass

class ConsumoInsumoOut(ConsumoInsumoBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Morbilidad ---
class MorbilidadBase(BaseModel):
    finca_id: int
    fecha: date
    especie: str
    diagnostico: Optional[str] = None
    estado_actual: Optional[str] = None
    animal_id: Optional[int] = None
    cantidad_afectados: int = 1
    observaciones: Optional[str] = None

class MorbilidadCreate(MorbilidadBase):
    pass

class MorbilidadOut(MorbilidadBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Transferencia Insumos / Compras Conjuntas ---
class TransferenciaInsumoCreate(BaseModel):
    insumo_id: int
    cantidad: float
    finca_origen_id: Optional[int] = None
    finca_destino_id: int
    fecha: date
    costo_unitario: Optional[float] = None
    tipo: str = "transferencia"
    observaciones: Optional[str] = None

class TransferenciaInsumoOut(BaseModel):
    id: int
    insumo_id: int
    cantidad: float
    finca_origen_id: Optional[int] = None
    finca_destino_id: int
    fecha: date
    costo_unitario: Optional[float] = None
    tipo: str
    observaciones: Optional[str]
    created_at: Optional[datetime]
    insumo_nombre: Optional[str] = None
    finca_origen_nombre: Optional[str] = None
    finca_destino_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class TransferirAnimalRequest(BaseModel):
    animal_id: int
    finca_origen_id: int
    finca_destino_id: int
    fecha: date
    motivo: Optional[str] = None


class ConsolidadoFinca(BaseModel):
    finca_id: int
    finca_nombre: str
    total_ingresos: float = 0
    total_gastos: float = 0
    balance: float = 0


class ConsolidadoContable(BaseModel):
    total_ingresos: float
    total_gastos: float
    balance: float
    margen: float
    ingreso_por_finca: list[ConsolidadoFinca] = []
    gasto_por_finca: list[ConsolidadoFinca] = []
    total_animales: int
    area_total: float


# --- Registros Climáticos ---
class RegistroClimaticoBase(BaseModel):
    finca_id: int
    fecha: date
    temperatura_min: Optional[float] = None
    temperatura_max: Optional[float] = None
    precipitacion_mm: Optional[float] = None
    humedad_pct: Optional[float] = None
    viento_kmh: Optional[float] = None
    observaciones: Optional[str] = None

class RegistroClimaticoCreate(RegistroClimaticoBase):
    pass

class RegistroClimaticoOut(RegistroClimaticoBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Finanzas extras ---
class InsumoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    unidad_medida: Optional[str] = None
    stock_minimo: Optional[float] = None
    tipo: Optional[str] = None
    categoria_id: Optional[int] = None

class ProduccionUpdate(BaseModel):
    cantidad: Optional[float] = None
    observaciones: Optional[str] = None
