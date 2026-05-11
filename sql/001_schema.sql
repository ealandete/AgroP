-- ============================================================
-- AgroP - Sistema de Gestión Agropecuaria
-- Schema: MariaDB 11.x
-- ============================================================

CREATE DATABASE IF NOT EXISTS agrop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agrop;

-- ============================================================
-- 1. CONFIGURACION Y SEGURIDAD
-- ============================================================

CREATE TABLE roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE usuarios (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100),
    telefono      VARCHAR(30),
    rol_id        INT NOT NULL,
    finca_id      INT NULL,
    activo        BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE sesiones (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id    INT NOT NULL,
    token         VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500) NULL,
    ip            VARCHAR(45),
    user_agent    TEXT,
    expira_at     TIMESTAMP NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE auditoria (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NULL,
    tabla       VARCHAR(100) NOT NULL,
    registro_id BIGINT NULL,
    accion      ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT') NOT NULL,
    datos_prev  JSON NULL,
    datos_nuevo JSON NULL,
    ip          VARCHAR(45),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auditoria_tabla (tabla, registro_id),
    INDEX idx_auditoria_usuario (usuario_id),
    INDEX idx_auditoria_fecha (created_at)
) ENGINE=InnoDB;

CREATE TABLE parametros (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    clave       VARCHAR(100) NOT NULL UNIQUE,
    valor       TEXT NOT NULL,
    tipo        VARCHAR(30) DEFAULT 'string',
    descripcion VARCHAR(255),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. FINCAS Y TERRENOS
-- ============================================================

CREATE TABLE fincas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    direccion   VARCHAR(255),
    ciudad      VARCHAR(100),
    departamento VARCHAR(100),
    pais        VARCHAR(100) DEFAULT 'Colombia',
    latitud     DECIMAL(10,7),
    longitud    DECIMAL(10,7),
    area_total  DECIMAL(10,2) COMMENT 'hectareas',
    telefono    VARCHAR(30),
    activo      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE lotes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    nombre          VARCHAR(100) NOT NULL,
    codigo          VARCHAR(20),
    area_ha         DECIMAL(10,4),
    tipo_suelo      VARCHAR(50) COMMENT 'arcilloso, arenoso, franco, limoso',
    uso_actual      VARCHAR(50) COMMENT 'cultivo, pastoreo, bosque, descanso, construccion',
    latitud         DECIMAL(10,7),
    longitud        DECIMAL(10,7),
    coordenadas     JSON COMMENT 'GeoJSON polygon',
    color           VARCHAR(7) DEFAULT '#4CAF50',
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    INDEX idx_lotes_finca (finca_id)
) ENGINE=InnoDB;

CREATE TABLE analisis_suelo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    lote_id         INT NOT NULL,
    fecha           DATE NOT NULL,
    ph              DECIMAL(4,2),
    nitrogeno       DECIMAL(8,4) COMMENT 'ppm',
    fosforo         DECIMAL(8,4) COMMENT 'ppm',
    potasio         DECIMAL(8,4) COMMENT 'ppm',
    materia_organica DECIMAL(5,2) COMMENT '%',
    humedad         DECIMAL(5,2) COMMENT '%',
    textura         VARCHAR(50),
    profundidad_cm  INT,
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    INDEX idx_analisis_lote (lote_id),
    INDEX idx_analisis_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- 3. ANIMALES Y SALUD ANIMAL
-- ============================================================

CREATE TABLE razas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    especie     VARCHAR(50) NOT NULL COMMENT 'bovino, porcino, aviar, ovino, caprino, equino',
    nombre      VARCHAR(100) NOT NULL,
    proposito   VARCHAR(50) COMMENT 'carne, leche, doble, huevos, trabajo',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_raza (especie, nombre)
) ENGINE=InnoDB;

CREATE TABLE animales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    lote_id         INT NULL,
    codigo          VARCHAR(50) UNIQUE COMMENT 'codigo de identificacion unico',
    nombre          VARCHAR(100),
    especie         VARCHAR(50) NOT NULL,
    raza_id         INT NULL,
    sexo            ENUM('M','H') NOT NULL,
    fecha_nacimiento DATE,
    fecha_ingreso   DATE NOT NULL,
    fecha_salida    DATE NULL,
    motivo_salida   VARCHAR(50) COMMENT 'venta, muerte, traslado',
    peso_kg         DECIMAL(8,2),
    color           VARCHAR(50),
    marcas_senales  VARCHAR(255),
    madre_id        INT NULL,
    padre_id        INT NULL,
    foto_url        VARCHAR(500),
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (raza_id) REFERENCES razas(id),
    FOREIGN KEY (madre_id) REFERENCES animales(id),
    FOREIGN KEY (padre_id) REFERENCES animales(id),
    INDEX idx_animales_finca (finca_id),
    INDEX idx_animales_especie (especie),
    INDEX idx_animales_lote (lote_id)
) ENGINE=InnoDB;

CREATE TABLE eventos_animales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NOT NULL,
    tipo_evento     VARCHAR(50) NOT NULL COMMENT 'vacunacion, desparasitacion, enfermedad, tratamiento, parto, pesaje, traslado, muerte, venta, compra',
    fecha           DATE NOT NULL,
    diagnostico     VARCHAR(255),
    descripcion     TEXT,
    medicamento_id  INT NULL,
    dosis           VARCHAR(100),
    via_aplicacion  VARCHAR(50),
    veterinario     VARCHAR(150),
    costo           DECIMAL(12,2),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    INDEX idx_eventos_animal (animal_id),
    INDEX idx_eventos_tipo (tipo_evento),
    INDEX idx_eventos_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- 4. CULTIVOS
-- ============================================================

CREATE TABLE variedades_cultivo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    cultivo         VARCHAR(50) NOT NULL COMMENT 'maiz, arroz, frijol, cafe, cacao, platano, yuca, papa',
    variedad        VARCHAR(100) NOT NULL,
    dias_ciclo      INT COMMENT 'dias de siembra a cosecha',
    rendimiento_ref DECIMAL(10,2) COMMENT 'kg/ha referencia',
    tolerancia      VARCHAR(255) COMMENT 'sequia, plagas, etc',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_variedad (cultivo, variedad)
) ENGINE=InnoDB;

CREATE TABLE siembras (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    lote_id         INT NOT NULL,
    variedad_id     INT NULL,
    cultivo         VARCHAR(50) NOT NULL,
    fecha_siembra   DATE NOT NULL,
    fecha_cosecha_estimada DATE,
    fecha_cosecha_real DATE,
    area_ha         DECIMAL(10,4),
    cantidad_semilla DECIMAL(10,2) COMMENT 'kg',
    metodo_siembra  VARCHAR(50) COMMENT 'directa, trasplante, voleo',
    estado          VARCHAR(30) DEFAULT 'activo' COMMENT 'activo, cosechado, perdido',
    rendimiento_kg  DECIMAL(12,2),
    rendimiento_ha  DECIMAL(10,2),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (variedad_id) REFERENCES variedades_cultivo(id),
    INDEX idx_siembras_lote (lote_id),
    INDEX idx_siembras_cultivo (cultivo),
    INDEX idx_siembras_fecha (fecha_siembra),
    INDEX idx_siembras_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE cosechas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    siembra_id      INT NOT NULL,
    lote_id         INT NOT NULL,
    fecha           DATE NOT NULL,
    cantidad_kg     DECIMAL(12,2) NOT NULL,
    calidad         VARCHAR(30) COMMENT 'A, B, C, descarte',
    humedad_pct     DECIMAL(5,2),
    metodo          VARCHAR(50) COMMENT 'manual, mecanizada',
    mano_obra       INT COMMENT 'numero de trabajadores',
    horas_trabajo   DECIMAL(6,1),
    destino         VARCHAR(50) COMMENT 'venta, almacen, procesamiento, autoconsumo',
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siembra_id) REFERENCES siembras(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    INDEX idx_cosechas_siembra (siembra_id),
    INDEX idx_cosechas_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- 5. PLAGAS, ENFERMEDADES Y TRATAMIENTOS
-- ============================================================

CREATE TABLE plagas_enfermedades (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    tipo            ENUM('plaga','enfermedad','maleza','deficiencia') NOT NULL,
    afecta_a        VARCHAR(50) COMMENT 'cultivo, animal, ambos',
    cultivo_especie VARCHAR(50),
    sintomas        TEXT,
    tratamiento_general TEXT,
    severidad       VARCHAR(30) COMMENT 'leve, moderada, severa, critica',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE tratamientos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    plaga_id            INT NULL,
    siembra_id          INT NULL,
    lote_id             INT NULL,
    animal_id           INT NULL,
    tipo                VARCHAR(50) NOT NULL COMMENT 'preventivo, curativo, fertilizacion, herbicida, insecticida, fungicida',
    producto            VARCHAR(150) NOT NULL,
    principio_activo    VARCHAR(150),
    dosis               VARCHAR(100),
    cantidad_aplicada   DECIMAL(10,3),
    unidad              VARCHAR(20) COMMENT 'kg, L, g, mL',
    fecha_aplicacion    DATE NOT NULL,
    fecha_vencimiento   DATE,
    responsable         VARCHAR(100),
    costo               DECIMAL(12,2),
    efectividad         VARCHAR(30) COMMENT 'excelente, buena, regular, mala',
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plaga_id) REFERENCES plagas_enfermedades(id),
    FOREIGN KEY (siembra_id) REFERENCES siembras(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    INDEX idx_tratamientos_fecha (fecha_aplicacion),
    INDEX idx_tratamientos_tipo (tipo)
) ENGINE=InnoDB;

-- ============================================================
-- 6. PROVEEDORES
-- ============================================================

CREATE TABLE proveedores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    nit             VARCHAR(30),
    contacto        VARCHAR(100),
    telefono        VARCHAR(30),
    email           VARCHAR(150),
    direccion       VARCHAR(255),
    ciudad          VARCHAR(100),
    categoria       VARCHAR(50) COMMENT 'insumos, maquinaria, semillas, medicamentos, servicios',
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 7. INVENTARIO E INSUMOS
-- ============================================================

CREATE TABLE categorias_insumo (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE insumos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id    INT,
    codigo          VARCHAR(50) UNIQUE,
    nombre          VARCHAR(150) NOT NULL,
    descripcion     TEXT,
    unidad_medida   VARCHAR(30) NOT NULL COMMENT 'kg, L, g, mL, unidad, bulto, tonelada',
    stock_minimo    DECIMAL(10,3),
    tipo            VARCHAR(50) COMMENT 'fertilizante, pesticida, herbicida, semilla, alimento, medicamento, herramienta, maquinaria, otro',
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_insumo(id)
) ENGINE=InnoDB;

CREATE TABLE inventario (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    insumo_id       INT NOT NULL,
    lote_almacen    VARCHAR(100) COMMENT 'lote/fecha de fabricacion',
    cantidad        DECIMAL(12,3) NOT NULL,
    costo_unitario  DECIMAL(12,2),
    fecha_ingreso   DATE NOT NULL,
    fecha_vencimiento DATE,
    ubicacion       VARCHAR(100) COMMENT 'bodega, galpon, silo',
    proveedor_id    INT NULL,
    factura_compra  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    INDEX idx_inventario_insumo (insumo_id),
    INDEX idx_inventario_vencimiento (fecha_vencimiento)
) ENGINE=InnoDB;

-- ============================================================
-- 8. COMPRAS
-- ============================================================

CREATE TABLE compras (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    proveedor_id    INT NOT NULL,
    fecha           DATE NOT NULL,
    numero_factura  VARCHAR(100),
    subtotal        DECIMAL(12,2),
    iva             DECIMAL(12,2),
    total           DECIMAL(12,2),
    estado          VARCHAR(30) DEFAULT 'pendiente' COMMENT 'pendiente, pagada, anulada',
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    INDEX idx_compras_fecha (fecha)
) ENGINE=InnoDB;

CREATE TABLE detalle_compra (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    compra_id       INT NOT NULL,
    insumo_id       INT NULL,
    descripcion     VARCHAR(255),
    cantidad        DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal        DECIMAL(12,2),
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. FINANZAS, PRODUCTOS Y VENTAS
-- ============================================================

CREATE TABLE categorias_financieras (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    tipo        ENUM('ingreso','gasto') NOT NULL,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE costos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id    INT,
    finca_id        INT NOT NULL,
    fecha           DATE NOT NULL,
    descripcion     VARCHAR(255) NOT NULL,
    monto           DECIMAL(12,2) NOT NULL,
    lote_id         INT NULL,
    siembra_id      INT NULL,
    animal_id       INT NULL,
    compra_id       INT NULL,
    medio_pago      VARCHAR(50) COMMENT 'efectivo, transferencia, credito',
    comprobante     VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_financieras(id),
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    INDEX idx_costos_fecha (fecha),
    INDEX idx_costos_categoria (categoria_id)
) ENGINE=InnoDB;

CREATE TABLE productos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    tipo            VARCHAR(50) NOT NULL COMMENT 'leche, carne, queso, huevos, miel, grano, fruta, verdura, elaborado',
    unidad_medida   VARCHAR(30) NOT NULL COMMENT 'kg, L, unidad, docena, arroba',
    precio_ref      DECIMAL(12,2),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE produccion (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    producto_id     INT NOT NULL,
    finca_id        INT NOT NULL,
    fecha           DATE NOT NULL,
    cantidad        DECIMAL(12,3) NOT NULL,
    animal_id       INT NULL,
    lote_id         INT NULL,
    siembra_id      INT NULL,
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (finca_id) REFERENCES fincas(id)
) ENGINE=InnoDB;

CREATE TABLE ventas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    producto_id     INT NOT NULL,
    finca_id        INT NOT NULL,
    fecha           DATE NOT NULL,
    cliente         VARCHAR(150),
    cantidad        DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    total           DECIMAL(12,2),
    medio_pago      VARCHAR(50),
    comprobante     VARCHAR(100),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    INDEX idx_ventas_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- 10. DOCUMENTOS
-- ============================================================

CREATE TABLE documentos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo    VARCHAR(50) NOT NULL COMMENT 'animal, lote, siembra, cosecha, compra, venta, finca',
    entidad_id      INT NOT NULL,
    nombre          VARCHAR(255) NOT NULL,
    tipo_archivo    VARCHAR(50) COMMENT 'pdf, jpg, png, doc, xlsx',
    ruta            VARCHAR(500) NOT NULL,
    tamaño_bytes    BIGINT,
    descripcion     TEXT,
    uploaded_by     INT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES usuarios(id),
    INDEX idx_documentos_entidad (entidad_tipo, entidad_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. SINCRONIZACION OFFLINE
-- ============================================================

CREATE TABLE cola_sincronizacion (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id  VARCHAR(100) NOT NULL,
    usuario_id      INT NOT NULL,
    operacion       ENUM('CREATE','UPDATE','DELETE') NOT NULL,
    tabla           VARCHAR(100) NOT NULL,
    registro_id     BIGINT NULL,
    datos           JSON NOT NULL,
    estado          ENUM('pendiente','sincronizado','conflicto','error') DEFAULT 'pendiente',
    error_mensaje   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at       TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_sync_dispositivo (dispositivo_id),
    INDEX idx_sync_estado (estado)
) ENGINE=InnoDB;
