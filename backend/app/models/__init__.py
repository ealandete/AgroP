from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Float, Date, DateTime,
    Boolean, Enum, ForeignKey, JSON, DECIMAL, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Rol(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100))
    telefono = Column(String(30))
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=True)
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    rol = relationship("Rol")
    finca = relationship("Finca")


class Finca(Base):
    __tablename__ = "fincas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    direccion = Column(String(255))
    ciudad = Column(String(100))
    departamento = Column(String(100))
    pais = Column(String(100), default="Colombia")
    latitud = Column(DECIMAL(10, 7))
    longitud = Column(DECIMAL(10, 7))
    area_total = Column(DECIMAL(10, 2))
    telefono = Column(String(30))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Lote(Base):
    __tablename__ = "lotes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    nombre = Column(String(100), nullable=False)
    codigo = Column(String(20))
    area_ha = Column(DECIMAL(10, 4))
    tipo_suelo = Column(String(50))
    uso_actual = Column(String(50))
    latitud = Column(DECIMAL(10, 7))
    longitud = Column(DECIMAL(10, 7))
    altitud_msnm = Column(DECIMAL(6, 2))
    pendiente_pct = Column(DECIMAL(5, 2))
    exposicion = Column(String(20))
    sistema_riego = Column(String(50), default="secano")
    fuente_agua = Column(String(100))
    caudal_lps = Column(DECIMAL(8, 2))
    coordenadas = Column(JSON)
    color = Column(String(7), default="#4CAF50")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    finca = relationship("Finca")


class AnalisisSuelo(Base):
    __tablename__ = "analisis_suelo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    ph = Column(DECIMAL(4, 2))
    nitrogeno = Column(DECIMAL(8, 4))
    fosforo = Column(DECIMAL(8, 4))
    potasio = Column(DECIMAL(8, 4))
    materia_organica = Column(DECIMAL(5, 2))
    humedad = Column(DECIMAL(5, 2))
    textura = Column(String(50))
    profundidad_cm = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    lote = relationship("Lote")


class Raza(Base):
    __tablename__ = "razas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    especie = Column(String(50), nullable=False)
    nombre = Column(String(100), nullable=False)
    proposito = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (UniqueConstraint("especie", "nombre"),)


class Animal(Base):
    __tablename__ = "animales"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    grupo_manejo_id = Column(Integer, ForeignKey("grupos_manejo.id"), nullable=True)
    codigo = Column(String(50), unique=True)
    numero_chapeta = Column(String(30))
    tiene_chapeta = Column(Boolean, default=False)
    nombre = Column(String(100))
    especie = Column(String(50), nullable=False)
    raza_id = Column(Integer, ForeignKey("razas.id"), nullable=True)
    sexo = Column(Enum("M", "H"), nullable=False)
    fecha_nacimiento = Column(Date)
    fecha_ingreso = Column(Date, nullable=False)
    fecha_salida = Column(Date, nullable=True)
    motivo_salida = Column(String(50))
    peso_kg = Column(DECIMAL(8, 2))
    color = Column(String(50))
    marcas_senales = Column(String(255))
    marcas_hierro = Column(String(100))
    microchip_id = Column(String(50))
    foto_perfil = Column(String(500))
    foto_lateral = Column(String(500))
    foto_url = Column(String(500))
    fecha_ultima_identificacion = Column(Date)
    madre_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    padre_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    activo = Column(Boolean, default=True)
    estado_origen = Column(String(20), default="propio")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    finca = relationship("Finca")
    lote = relationship("Lote")
    raza = relationship("Raza")
    grupo_manejo = relationship("GrupoManejo")


class EventoAnimal(Base):
    __tablename__ = "eventos_animales"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id", ondelete="CASCADE"), nullable=False)
    tipo_evento = Column(String(50), nullable=False)
    fecha = Column(Date, nullable=False)
    diagnostico = Column(String(255))
    descripcion = Column(Text)
    medicamento_id = Column(Integer, nullable=True)
    dosis = Column(String(100))
    via_aplicacion = Column(String(50))
    veterinario = Column(String(150))
    costo = Column(DECIMAL(12, 2))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    animal = relationship("Animal")


class VariedadCultivo(Base):
    __tablename__ = "variedades_cultivo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    cultivo = Column(String(50), nullable=False)
    variedad = Column(String(100), nullable=False)
    dias_ciclo = Column(Integer)
    rendimiento_ref = Column(DECIMAL(10, 2))
    tolerancia = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (UniqueConstraint("cultivo", "variedad"),)


class Siembra(Base):
    __tablename__ = "siembras"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    variedad_id = Column(Integer, ForeignKey("variedades_cultivo.id"), nullable=True)
    cultivo = Column(String(50), nullable=False)
    fecha_siembra = Column(Date, nullable=False)
    fecha_cosecha_estimada = Column(Date)
    fecha_cosecha_real = Column(Date)
    area_ha = Column(DECIMAL(10, 4))
    cantidad_semilla = Column(DECIMAL(10, 2))
    metodo_siembra = Column(String(50))
    estado = Column(String(30), default="activo")
    rendimiento_kg = Column(DECIMAL(12, 2))
    rendimiento_ha = Column(DECIMAL(10, 2))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    lote = relationship("Lote")
    variedad = relationship("VariedadCultivo")


class Cosecha(Base):
    __tablename__ = "cosechas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    siembra_id = Column(Integer, ForeignKey("siembras.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    cantidad_kg = Column(DECIMAL(12, 2), nullable=False)
    calidad = Column(String(30))
    humedad_relativa = Column(DECIMAL(5, 2))
    metodo = Column(String(50))
    mano_obra = Column(Integer)
    horas_trabajo = Column(DECIMAL(6, 1))
    destino = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class PlagaEnfermedad(Base):
    __tablename__ = "plagas_enfermedades"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    tipo = Column(Enum("plaga", "enfermedad", "maleza", "deficiencia"), nullable=False)
    afecta_a = Column(String(50))
    cultivo_especie = Column(String(50))
    sintomas = Column(Text)
    tratamiento_general = Column(Text)
    severidad = Column(String(30))
    created_at = Column(DateTime, server_default=func.now())


class Tratamiento(Base):
    __tablename__ = "tratamientos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plaga_id = Column(Integer, ForeignKey("plagas_enfermedades.id"), nullable=True)
    siembra_id = Column(Integer, ForeignKey("siembras.id"), nullable=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    tipo = Column(String(50), nullable=False)
    producto = Column(String(150), nullable=False)
    principio_activo = Column(String(150))
    dosis = Column(String(100))
    cantidad_aplicada = Column(DECIMAL(10, 3))
    unidad = Column(String(20))
    fecha_aplicacion = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    responsable = Column(String(100))
    costo = Column(DECIMAL(12, 2))
    efectividad = Column(String(30))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class CategoriaInsumo(Base):
    __tablename__ = "categorias_insumo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(String(255))


class Insumo(Base):
    __tablename__ = "insumos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    categoria_id = Column(Integer, ForeignKey("categorias_insumo.id"), nullable=True)
    codigo = Column(String(50), unique=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    unidad_medida = Column(String(30), nullable=False)
    stock_minimo = Column(DECIMAL(10, 3))
    tipo = Column(String(50))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    nit = Column(String(30))
    contacto = Column(String(100))
    telefono = Column(String(30))
    email = Column(String(150))
    direccion = Column(String(255))
    ciudad = Column(String(100))
    categoria = Column(String(50))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Inventario(Base):
    __tablename__ = "inventario"
    id = Column(Integer, primary_key=True, autoincrement=True)
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False)
    lote_almacen = Column(String(100))
    cantidad = Column(DECIMAL(12, 3), nullable=False)
    costo_unitario = Column(DECIMAL(12, 2))
    fecha_ingreso = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    ubicacion = Column(String(100))
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    factura_compra = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Compra(Base):
    __tablename__ = "compras"
    id = Column(Integer, primary_key=True, autoincrement=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    numero_factura = Column(String(100))
    subtotal = Column(DECIMAL(12, 2))
    iva = Column(DECIMAL(12, 2))
    total = Column(DECIMAL(12, 2))
    estado = Column(String(30), default="pendiente")
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class CategoriaFinanciera(Base):
    __tablename__ = "categorias_financieras"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), unique=True, nullable=False)
    tipo = Column(Enum("ingreso", "gasto"), nullable=False)
    descripcion = Column(String(255))


class Costo(Base):
    __tablename__ = "costos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    categoria_id = Column(Integer, ForeignKey("categorias_financieras.id"), nullable=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    descripcion = Column(String(255), nullable=False)
    monto = Column(DECIMAL(12, 2), nullable=False)
    lote_id = Column(Integer, nullable=True)
    siembra_id = Column(Integer, nullable=True)
    animal_id = Column(Integer, nullable=True)
    compra_id = Column(Integer, nullable=True)
    medio_pago = Column(String(50))
    comprobante = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())


class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    tipo = Column(String(50), nullable=False)
    unidad_medida = Column(String(30), nullable=False)
    precio_ref = Column(DECIMAL(12, 2))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Produccion(Base):
    __tablename__ = "produccion"
    id = Column(Integer, primary_key=True, autoincrement=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    cantidad = Column(DECIMAL(12, 3), nullable=False)
    animal_id = Column(Integer, nullable=True)
    lote_id = Column(Integer, nullable=True)
    siembra_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Venta(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    cliente = Column(String(150))
    cantidad = Column(DECIMAL(12, 3), nullable=False)
    precio_unitario = Column(DECIMAL(12, 2), nullable=False)
    total = Column(DECIMAL(12, 2))
    medio_pago = Column(String(50))
    comprobante = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Documento(Base):
    __tablename__ = "documentos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entidad_tipo = Column(String(50), nullable=False)
    entidad_id = Column(Integer, nullable=False)
    nombre = Column(String(255), nullable=False)
    tipo_archivo = Column(String(50))
    ruta = Column(String(500), nullable=False)
    tamaño_bytes = Column(BigInteger)
    descripcion = Column(Text)
    uploaded_by = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Auditoria(Base):
    __tablename__ = "auditoria"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, nullable=True)
    tabla = Column(String(100), nullable=False)
    registro_id = Column(BigInteger, nullable=True)
    accion = Column(Enum("INSERT", "UPDATE", "DELETE", "LOGIN", "LOGOUT"), nullable=False)
    datos_prev = Column(JSON)
    datos_nuevo = Column(JSON)
    ip = Column(String(45))
    created_at = Column(DateTime, server_default=func.now())


class Parametro(Base):
    __tablename__ = "parametros"
    id = Column(Integer, primary_key=True, autoincrement=True)
    clave = Column(String(100), unique=True, nullable=False)
    valor = Column(Text, nullable=False)
    tipo = Column(String(30), default="string")
    descripcion = Column(String(255))
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ColaSincronizacion(Base):
    __tablename__ = "cola_sincronizacion"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    dispositivo_id = Column(String(100), nullable=False)
    usuario_id = Column(Integer, nullable=False)
    operacion = Column(Enum("CREATE", "UPDATE", "DELETE"), nullable=False)
    tabla = Column(String(100), nullable=False)
    registro_id = Column(BigInteger, nullable=True)
    datos = Column(JSON, nullable=False)
    estado = Column(Enum("pendiente", "sincronizado", "conflicto", "error"), default="pendiente")
    error_mensaje = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    synced_at = Column(DateTime, nullable=True)


# ============================================================
# MODELOS OPERATIVOS (agregados desde migracion v3)
# ============================================================

class Reproduccion(Base):
    __tablename__ = "reproduccion"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    tipo_servicio = Column(Enum("monta_natural", "inseminacion", "transferencia"), nullable=False)
    toro_pajuela = Column(String(255))
    fecha_servicio = Column(Date)
    fecha_celo = Column(Date)
    diagnostico_id = Column(Integer)
    resultado = Column(Enum("preñada", "vacia", "dudosa"))
    fecha_parto_estimada = Column(Date)
    fecha_parto_real = Column(Date)
    numero_crias = Column(Integer)
    peso_promedio_cria = Column(DECIMAL(8, 2))
    created_at = Column(DateTime, server_default=func.now())
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Lactancia(Base):
    __tablename__ = "lactancias"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    parto_id = Column(Integer, ForeignKey("partos.id"))
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)
    dias_en_lactancia = Column(Integer)
    produccion_total_l = Column(DECIMAL(10, 2))
    produccion_promedio_diaria = Column(DECIMAL(6, 2))
    pico_produccion_l = Column(DECIMAL(6, 2))
    dia_pico_produccion = Column(Integer)
    estado = Column(Enum("activa", "finalizada", "seca"), default="activa")
    created_at = Column(DateTime, server_default=func.now())


class Ordeno(Base):
    __tablename__ = "ordenos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    lactancia_id = Column(Integer, ForeignKey("lactancias.id"))
    fecha = Column(Date, nullable=False)
    ordeno_am = Column(DECIMAL(5, 2))
    ordeno_pm = Column(DECIMAL(5, 2))
    total_dia = Column(DECIMAL(6, 2))
    calidad = Column(Enum("A", "B", "C", "descarte"), default="A")
    celulas_somaticas = Column(Integer)
    proteina_pct = Column(DECIMAL(4, 2))
    grasa_pct = Column(DECIMAL(4, 2))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Pesaje(Base):
    __tablename__ = "pesajes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    peso_kg = Column(DECIMAL(8, 2), nullable=False)
    condicion_corporal = Column(Integer)
    ganancia_diaria = Column(DECIMAL(6, 3))
    metodo = Column(String(30), default="bascula")
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Sanidad(Base):
    __tablename__ = "sanidad"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    tipo = Column(Enum("vacunacion", "desparasitacion", "enfermedad", "tratamiento", "cirugia", "control", "otro"), nullable=False)
    diagnostico = Column(String(500))
    producto_aplicado = Column(String(255))
    dosis = Column(String(100))
    via_aplicacion = Column(String(100))
    veterinario = Column(String(150))
    costo = Column(DECIMAL(12, 2))
    fecha_proximo_control = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class AlimentacionDiaria(Base):
    __tablename__ = "alimentacion_diaria"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"))
    lote_id = Column(Integer, ForeignKey("lotes.id"))
    dieta_id = Column(Integer, ForeignKey("dietas.id"))
    fecha = Column(Date, nullable=False)
    alimento_id = Column(Integer, ForeignKey("alimentos.id"), nullable=False)
    cantidad_kg = Column(DECIMAL(8, 2), nullable=False)
    costo = Column(DECIMAL(10, 2))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class MovimientoAnimal(Base):
    __tablename__ = "movimientos_animales"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    tipo = Column(Enum("entrada", "salida", "traslado_interno"), nullable=False)
    origen = Column(String(255))
    destino = Column(String(255))
    lote_origen_id = Column(Integer, ForeignKey("lotes.id"))
    lote_destino_id = Column(Integer, ForeignKey("lotes.id"))
    motivo = Column(String(255))
    guia_ica = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())


class PlanificacionPastoreo(Base):
    __tablename__ = "planificacion_pastoreo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)
    numero_animales = Column(Integer)
    carga_animal = Column(DECIMAL(6, 2))
    estado = Column(Enum("planificado", "activo", "completado"), default="planificado")
    created_at = Column(DateTime, server_default=func.now())


class LaborCampo(Base):
    __tablename__ = "labores_campo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    siembra_id = Column(Integer, ForeignKey("siembras.id"))
    fecha = Column(Date, nullable=False)
    tipo = Column(Enum("preparacion", "siembra", "fertilizacion", "riego", "control_plagas", "cosecha", "otro"), nullable=False)
    descripcion = Column(String(500))
    horas_trabajo = Column(DECIMAL(6, 1))
    numero_trabajadores = Column(Integer)
    costo_mano_obra = Column(DECIMAL(10, 2))
    insumos_utilizados = Column(Text)
    maquinaria_id = Column(Integer, ForeignKey("equipos.id"))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Parto(Base):
    __tablename__ = "partos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    diagnostico_id = Column(Integer, ForeignKey("diagnosticos_gestacion.id"))
    fecha_parto = Column(Date, nullable=False)
    tipo_parto = Column(Enum("normal", "distocico", "cesarea", "asistido"), default="normal")
    numero_crias = Column(Integer, default=1)
    crias_vivas = Column(Integer, default=1)
    crias_muertas = Column(Integer, default=0)
    peso_promedio_cria_kg = Column(DECIMAL(5, 2))
    sexo_crias = Column(String(30))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Departamento(Base):
    __tablename__ = "departamentos"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    codigo_dane = Column(String(5))


class Municipio(Base):
    __tablename__ = "municipios"
    id = Column(Integer, primary_key=True)
    departamento_id = Column(Integer, ForeignKey("departamentos.id"))
    nombre = Column(String(150), nullable=False)
    codigo_dane = Column(String(8))
    latitud = Column(DECIMAL(10, 7))
    longitud = Column(DECIMAL(10, 7))


class ParametroICA(Base):
    __tablename__ = "parametros_ica_razas"
    __abstract__ = True


class LoteAves(Base):
    __tablename__ = "lotes_aves"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    codigo = Column(String(50), nullable=False)
    galpon = Column(String(50))
    fecha_ingreso = Column(Date, nullable=False)
    cantidad_inicial = Column(Integer, nullable=False)
    cantidad_actual = Column(Integer)
    raza_id = Column(Integer, ForeignKey("razas.id"))
    tipo_produccion = Column(Enum("huevos", "carne", "doble_proposito", "reproductoras"), default="huevos")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class ProduccionHuevos(Base):
    __tablename__ = "produccion_huevos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_aves_id = Column(Integer, ForeignKey("lotes_aves.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    huevos_puestos = Column(Integer, nullable=False)
    huevos_rotos = Column(Integer, default=0)
    huevos_incubables = Column(Integer, default=0)
    mortalidad_dia = Column(Integer, default=0)
    alimento_consumido_kg = Column(DECIMAL(6, 2))
    peso_promedio_huevo_g = Column(DECIMAL(5, 1))
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Camada(Base):
    __tablename__ = "camadas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    madre_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    padre_id = Column(Integer, ForeignKey("animales.id"))
    reproduccion_id = Column(Integer, ForeignKey("reproduccion.id"))
    fecha_parto = Column(Date, nullable=False)
    lechones_nacidos = Column(Integer, nullable=False)
    lechones_vivos = Column(Integer)
    lechones_muertos = Column(Integer, default=0)
    lechones_momias = Column(Integer, default=0)
    peso_promedio_kg = Column(DECIMAL(5, 3))
    peso_total_camada = Column(DECIMAL(6, 2))
    fecha_destete = Column(Date)
    lechones_destetados = Column(Integer)
    peso_destete_promedio = Column(DECIMAL(5, 2))
    mortalidad_lactancia = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class EngordePorcino(Base):
    __tablename__ = "engorde_porcino"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"))
    codigo_lote = Column(String(50))
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date)
    cantidad_inicial = Column(Integer, nullable=False)
    cantidad_final = Column(Integer)
    mortalidad_total = Column(Integer, default=0)
    peso_inicial_promedio = Column(DECIMAL(6, 2))
    peso_final_promedio = Column(DECIMAL(6, 2))
    ganancia_diaria = Column(DECIMAL(6, 3))
    conversion_alimenticia = Column(DECIMAL(5, 3))
    alimento_total_kg = Column(DECIMAL(10, 2))
    costo_total = Column(DECIMAL(12, 2))
    estado = Column(Enum("activo", "finalizado"), default="activo")
    created_at = Column(DateTime, server_default=func.now())


class Colmena(Base):
    __tablename__ = "colmenas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    codigo = Column(String(50), nullable=False)
    apiario = Column(String(100))
    fecha_instalacion = Column(Date)
    tipo_colmena = Column(Enum("langstroth", "africana", "rustica", "nucleo"), default="langstroth")
    estado = Column(Enum("activa", "debil", "muerta", "enjambrada"), default="activa")
    ultima_revision = Column(Date)
    origen_reina = Column(Enum("propia", "comprada", "enjambre"), default="propia")
    created_at = Column(DateTime, server_default=func.now())


class CosechaMiel(Base):
    __tablename__ = "cosechas_miel"
    id = Column(Integer, primary_key=True, autoincrement=True)
    colmena_id = Column(Integer, ForeignKey("colmenas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    marcos_cosechados = Column(Integer, nullable=False)
    kg_miel = Column(DECIMAL(6, 2))
    kg_cera = Column(DECIMAL(5, 2))
    kg_polen = Column(DECIMAL(5, 2))
    kg_propoleo = Column(DECIMAL(4, 2))
    tipo_floracion = Column(String(100))
    humedad_miel_pct = Column(DECIMAL(4, 1))
    created_at = Column(DateTime, server_default=func.now())


# ============================================================
# MODELOS ERP - Clientes, Contabilidad, Personal, Documentos
# ============================================================

class GrupoManejo(Base):
    __tablename__ = "grupos_manejo"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    nombre = Column(String(100), nullable=False)
    tipo = Column(Enum("ordeno", "ceba", "levante", "cria", "reproduccion", "cuarentena", "general"), default="general")
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_documento = Column(Enum("CC", "NIT", "CE", "PP", "TI"), default="CC")
    numero_documento = Column(String(20), nullable=False)
    dv = Column(String(1))
    nombre = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    direccion = Column(String(255))
    ciudad_id = Column(Integer)
    departamento_id = Column(Integer)
    telefono = Column(String(30))
    email = Column(String(150))
    regimen = Column(Enum("comun", "simplificado", "gran_contribuyente"), default="comun")
    responsabilidad_fiscal = Column(Enum("IVA", "INC", "IVA_INC", "no_responsable"), default="IVA")
    actividad_economica = Column(String(20))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PlanCuenta(Base):
    __tablename__ = "plan_cuentas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(20), nullable=False, unique=True)
    nombre = Column(String(200), nullable=False)
    nivel = Column(Integer, default=1)
    parent_id = Column(Integer, ForeignKey("plan_cuentas.id"))
    tipo = Column(Enum("activo", "pasivo", "patrimonio", "ingreso", "gasto", "costo", "orden"), nullable=False)
    naturaleza = Column(Enum("debito", "credito"), nullable=False)
    activo = Column(Boolean, default=True)


class Personal(Base):
    __tablename__ = "personal"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo_documento = Column(Enum("CC", "CE", "PP"), default="CC")
    numero_documento = Column(String(20), nullable=False, unique=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    fecha_nacimiento = Column(Date)
    telefono = Column(String(30))
    email = Column(String(150))
    direccion = Column(String(255))
    cargo = Column(Enum("administrador", "veterinario", "agronomo", "operario_campo", "ordenador", "vaquero", "jardinero", "vigilante", "conductor", "tecnico", "otro"), default="operario_campo")
    tipo_contrato = Column(Enum("indefinido", "fijo", "obra_labor", "prestacion_servicios", "ocasional"), default="fijo")
    fecha_ingreso = Column(Date, nullable=False)
    fecha_retiro = Column(Date)
    salario_base = Column(DECIMAL(12, 2))
    tipo_salario = Column(Enum("mensual", "quincenal", "jornal", "hora"), default="mensual")
    eps = Column(String(100))
    arl = Column(String(100))
    fondo_pension = Column(String(100))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Nomina(Base):
    __tablename__ = "nominas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    personal_id = Column(Integer, ForeignKey("personal.id"), nullable=False)
    periodo = Column(Date, nullable=False)
    dias_trabajados = Column(Integer, default=30)
    horas_extras = Column(DECIMAL(5, 1), default=0)
    salario_base = Column(DECIMAL(12, 2))
    auxilio_transporte = Column(DECIMAL(10, 2), default=0)
    bonificaciones = Column(DECIMAL(10, 2), default=0)
    deducciones = Column(DECIMAL(10, 2), default=0)
    total_devengado = Column(DECIMAL(12, 2))
    total_deducciones = Column(DECIMAL(12, 2))
    neto_pagado = Column(DECIMAL(12, 2))
    estado = Column(Enum("pendiente", "pagada", "anulada"), default="pendiente")
    created_at = Column(DateTime, server_default=func.now())


class DocumentoSistema(Base):
    __tablename__ = "documentos_sistema"
    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(Enum("calidad", "sst", "ambiental", "certificacion", "legal", "tecnico", "otro"), nullable=False)
    codigo = Column(String(50))
    titulo = Column(String(300), nullable=False)
    descripcion = Column(Text)
    version = Column(String(10), default="1.0")
    fecha_emision = Column(Date)
    fecha_revision = Column(Date)
    fecha_vencimiento = Column(Date)
    responsable = Column(String(150))
    ruta_archivo = Column(String(500))
    estado = Column(Enum("vigente", "obsoleto", "borrador", "revision"), default="vigente")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class VigilanciaEpidemiologica(Base):
    __tablename__ = "vigilancia_epidemiologica"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(Date, nullable=False)
    especie = Column(String(50), nullable=False)
    enfermedad = Column(String(200), nullable=False)
    tipo_evento = Column(Enum("sospecha", "confirmado", "descartado", "control", "brotes"), default="sospecha")
    animales_afectados = Column(Integer, default=0)
    animales_muertos = Column(Integer, default=0)
    animales_expuestos = Column(Integer, default=0)
    lote_id = Column(Integer, ForeignKey("lotes.id"))
    tasa_ataque = Column(DECIMAL(5, 2))
    tasa_letalidad = Column(DECIMAL(5, 2))
    accion_tomada = Column(Text)
    notificado_ica = Column(Boolean, default=False)
    fecha_notificacion = Column(Date)
    numero_notificacion = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())


class KpiConfig(Base):
    __tablename__ = "kpis_config"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    categoria = Column(Enum("productivo", "reproductivo", "sanitario", "financiero", "operativo", "ambiental", "social"), nullable=False)
    formula = Column(Text)
    unidad = Column(String(50))
    meta = Column(DECIMAL(12, 4))
    frecuencia = Column(Enum("diario", "semanal", "mensual", "trimestral", "anual"), default="mensual")
    tipo_visualizacion = Column(Enum("numero", "porcentaje", "grafico_barras", "grafico_linea", "medidor"), default="numero")
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class FacturaCabecera(Base):
    __tablename__ = "factura_cabecera"
    id = Column(Integer, primary_key=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    prefijo = Column(String(10), default="FAG")
    numero_factura = Column(Integer, nullable=False)
    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    forma_pago = Column(Enum("contado", "credito_30", "credito_60", "credito_90"), default="contado")
    subtotal = Column(DECIMAL(14, 2), default=0)
    iva_porcentaje = Column(DECIMAL(5, 2), default=19.00)
    iva_total = Column(DECIMAL(14, 2), default=0)
    retencion_fuente_porcentaje = Column(DECIMAL(5, 2), default=0)
    retencion_fuente_total = Column(DECIMAL(14, 2), default=0)
    retencion_ica_porcentaje = Column(DECIMAL(5, 2), default=0)
    retencion_ica_total = Column(DECIMAL(14, 2), default=0)
    total_bruto = Column(DECIMAL(14, 2), default=0)
    total_impuestos = Column(DECIMAL(14, 2), default=0)
    total_neto = Column(DECIMAL(14, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())
    estado = Column(Enum("emitida", "pagada", "anulada", "pendiente"), default="emitida")
    cufe = Column(String(200))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class FacturaItem(Base):
    __tablename__ = "factura_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    factura_id = Column(Integer, ForeignKey("factura_cabecera.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"))
    descripcion = Column(String(300), nullable=False)
    cantidad = Column(DECIMAL(12, 3), nullable=False)
    unidad_medida = Column(String(30), default="unidad")
    precio_unitario = Column(DECIMAL(14, 2), nullable=False)
    iva_porcentaje = Column(DECIMAL(5, 2), default=19.00)
    iva_unitario = Column(DECIMAL(14, 2), default=0)
    subtotal = Column(DECIMAL(14, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())


class AplicacionMicronutriente(Base):
    __tablename__ = "aplicacion_micronutrientes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    producto = Column(String(200), nullable=False)
    elementos = Column(JSON)
    dosis_kg_ha = Column(DECIMAL(8, 3))
    metodo_aplicacion = Column(Enum("foliar", "edafica", "fertirriego", "incorporacion"), default="foliar")
    costo = Column(DECIMAL(12, 2))
    efectividad = Column(Enum("excelente", "buena", "regular", "mala", "pendiente"), default="pendiente")
    fecha_evaluacion = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    recomendacion_ia = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class EstadoPastura(Base):
    __tablename__ = "estado_pasturas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    fecha_evaluacion = Column(Date, nullable=False)
    cobertura_porcentaje = Column(DECIMAL(5, 1))
    altura_promedio_cm = Column(DECIMAL(5, 1))
    especie_predominante = Column(String(100))
    presencia_malezas = Column(Enum("baja", "media", "alta"), default="baja")
    presencia_plagas = Column(Enum("baja", "media", "alta"), default="baja")
    dias_descanso_desde_ultimo_pastoreo = Column(Integer)
    dias_descanso_recomendados = Column(Integer)
    carga_animal_recomendada = Column(DECIMAL(5, 2))
    estado = Column(Enum("excelente", "bueno", "regular", "degradado", "en_recuperacion"), default="bueno")
    recomendacion_ia = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class Nacimiento(Base):
    __tablename__ = "nacimientos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    madre_id = Column(Integer, ForeignKey("animales.id"), nullable=False)
    padre_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    fecha_nacimiento = Column(Date, nullable=False)
    codigo_cria = Column(String(50))
    nombre_cria = Column(String(100))
    sexo = Column(Enum("M", "H"))
    peso_nacimiento_kg = Column(DECIMAL(6, 2))
    tipo_parto = Column(String(30))
    numero_crias = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    abuelo_materno_id = Column(Integer, ForeignKey("animales.id"))
    abuela_materna_id = Column(Integer, ForeignKey("animales.id"))
    abuelo_paterno_id = Column(Integer, ForeignKey("animales.id"))
    abuela_paterna_id = Column(Integer, ForeignKey("animales.id"))
    created_at = Column(DateTime, server_default=func.now())


# ============================================================
# MODELOS PLANEACION - Plan de Actividades, Presupuestos
# ============================================================

class PlanActividad(Base):
    __tablename__ = "plan_actividades"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    animal_id = Column(Integer, nullable=True)
    siembra_id = Column(Integer, nullable=True)
    tipo_actividad = Column(String(50), nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    fecha_programada = Column(Date, nullable=False)
    fecha_ejecucion = Column(Date, nullable=True)
    duracion_estimada = Column(Integer)
    responsable = Column(String(100))
    prioridad = Column(String(20), default="media")
    estado = Column(String(30), default="programado")
    resultado = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Presupuesto(Base):
    __tablename__ = "presupuestos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    nombre = Column(String(150), nullable=False)
    periodo_inicio = Column(Date, nullable=False)
    periodo_fin = Column(Date, nullable=False)
    tipo = Column(String(20), default="anual")
    estado = Column(String(20), default="borrador")
    created_at = Column(DateTime, server_default=func.now())
    monto_total = Column(DECIMAL(14, 2), default=0)
    estado = Column(String(30), default="activo")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PresupuestoPartida(Base):
    __tablename__ = "presupuesto_partidas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(200), nullable=False)
    monto_estimado = Column(DECIMAL(14, 2), default=0)
    monto_real = Column(DECIMAL(14, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())

    presupuesto = relationship("Presupuesto")


# ============================================================
# MODELOS CONSUMO - Consumo Insumos, Morbilidad, Clima
# ============================================================

class ConsumoInsumo(Base):
    __tablename__ = "consumo_insumos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    cantidad = Column(DECIMAL(12, 3), nullable=False)
    fecha = Column(Date, nullable=False)
    tipo_consumo = Column(String(50))
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    siembra_id = Column(Integer, ForeignKey("siembras.id"), nullable=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())


class Morbilidad(Base):
    __tablename__ = "morbilidad"
    id = Column(Integer, primary_key=True, autoincrement=True)
    animal_id = Column(Integer, ForeignKey("animales.id"), nullable=True)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    siembra_id = Column(Integer, ForeignKey("siembras.id"), nullable=True)
    especie = Column(String(50))
    fecha_deteccion = Column(Date, nullable=False)
    tipo_afectacion = Column(String(50), nullable=False)
    diagnostico = Column(String(255))
    severidad = Column(String(20), default="leve")
    ubicacion = Column(String(255))
    observaciones = Column(Text)
    estado_actual = Column(String(20), default="activo")
    tratamiento_id = Column(Integer, nullable=True)
    dias_incapacidad = Column(Integer, default=0)
    perdida_economica = Column(DECIMAL(12, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())

    siembra = relationship("Siembra")


class TransferenciaInsumo(Base):
    __tablename__ = "transferencias_insumos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False)
    cantidad = Column(DECIMAL(12, 3), nullable=False)
    finca_origen_id = Column(Integer, ForeignKey("fincas.id"), nullable=True)
    finca_destino_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    costo_unitario = Column(DECIMAL(12, 2))
    tipo = Column(Enum("compra_conjunta", "transferencia", "devolucion"), nullable=False)
    observaciones = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    insumo = relationship("Insumo")
    finca_origen = relationship("Finca", foreign_keys=[finca_origen_id])
    finca_destino = relationship("Finca", foreign_keys=[finca_destino_id])


class RegistroClimatico(Base):
    __tablename__ = "registros_climaticos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    temperatura_max = Column(DECIMAL(5, 2))
    temperatura_min = Column(DECIMAL(5, 2))
    precipitacion_mm = Column(DECIMAL(8, 2))
    humedad_relativa = Column(DECIMAL(5, 2))
    viento_kmh = Column(DECIMAL(6, 2))
    horas_sol = Column(DECIMAL(4, 1))
    estacion = Column(String(30))
    created_at = Column(DateTime, server_default=func.now())
