-- ============================================================
-- AgroP - Migración v2: Módulos avanzados desde schema previo
-- Agrega: Alimentación, Reproducción, Alertas, Equipos, Pesajes
-- ============================================================
USE agrop;

-- ============================================================
-- MÓDULO: ALIMENTACIÓN ANIMAL
-- ============================================================

CREATE TABLE categorias_alimentos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE,
    descripcion     TEXT,
    tipo            ENUM('concentrado','forraje','suplemento','mineral','vitamina','aditivo') NOT NULL,
    activa          BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE alimentos (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id            INT NOT NULL,
    codigo                  VARCHAR(50) NOT NULL UNIQUE,
    nombre                  VARCHAR(200) NOT NULL,
    descripcion             TEXT,
    proteina_pct            DECIMAL(5,2),
    grasa_pct               DECIMAL(5,2),
    fibra_pct               DECIMAL(5,2),
    humedad_pct             DECIMAL(5,2),
    energia_mcal_kg         DECIMAL(6,3),
    calcio_pct              DECIMAL(5,3),
    fosforo_pct             DECIMAL(5,3),
    precio_kg               DECIMAL(8,2),
    presentacion            VARCHAR(100),
    marca                   VARCHAR(100),
    dosis_recomendada_kg_dia DECIMAL(6,2),
    stock_minimo_kg         DECIMAL(8,2) DEFAULT 0,
    stock_actual_kg         DECIMAL(8,2) DEFAULT 0,
    ubicacion_almacen       VARCHAR(100),
    activo                  BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_alimentos(id)
) ENGINE=InnoDB;

CREATE TABLE dietas (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    finca_id                INT NOT NULL,
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,
    tipo                    ENUM('lactancia','gestacion','crecimiento','mantenimiento','engorde','especial') NOT NULL,
    especie_objetivo        VARCHAR(50),
    peso_vivo_min_kg        DECIMAL(6,2),
    peso_vivo_max_kg        DECIMAL(6,2),
    produccion_leche_min_l  DECIMAL(5,2),
    produccion_leche_max_l  DECIMAL(5,2),
    proteina_total_pct      DECIMAL(5,2),
    energia_total_mcal_kg   DECIMAL(6,3),
    fibra_total_pct         DECIMAL(5,2),
    costo_total_dia         DECIMAL(8,2),
    cantidad_total_kg_dia   DECIMAL(6,2),
    activa                  BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id)
) ENGINE=InnoDB;

CREATE TABLE dieta_componentes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    dieta_id        INT NOT NULL,
    alimento_id     INT NOT NULL,
    cantidad_kg_dia DECIMAL(6,2) NOT NULL,
    porcentaje      DECIMAL(5,2),
    orden_mezcla    INT DEFAULT 1,
    FOREIGN KEY (dieta_id) REFERENCES dietas(id) ON DELETE CASCADE,
    FOREIGN KEY (alimento_id) REFERENCES alimentos(id),
    UNIQUE KEY uk_dieta_alimento (dieta_id, alimento_id)
) ENGINE=InnoDB;

CREATE TABLE alimentacion (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT,
    lote_id         INT,
    dieta_id        INT,
    alimento_id     INT NOT NULL,
    fecha           DATE NOT NULL,
    hora            TIME,
    cantidad_kg     DECIMAL(8,2) NOT NULL,
    costo_unitario  DECIMAL(10,2),
    costo_total     DECIMAL(10,2),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (dieta_id) REFERENCES dietas(id),
    FOREIGN KEY (alimento_id) REFERENCES alimentos(id),
    INDEX idx_alimentacion_fecha (fecha),
    INDEX idx_alimentacion_animal (animal_id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: REPRODUCCIÓN
-- ============================================================

CREATE TABLE celos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    fecha_deteccion     DATE NOT NULL,
    hora_deteccion      TIME,
    tipo                ENUM('natural','sincronizado','inducido') DEFAULT 'natural',
    intensidad          ENUM('bajo','medio','alto') DEFAULT 'medio',
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    INDEX idx_celos_animal (animal_id),
    INDEX idx_celos_fecha (fecha_deteccion)
) ENGINE=InnoDB;

CREATE TABLE servicios (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    celo_id             INT,
    fecha_servicio      DATE NOT NULL,
    tipo_servicio       ENUM('monta_natural','inseminacion_artificial','transferencia_embrion') NOT NULL,
    toro_id             INT COMMENT 'ID del macho utilizado',
    pajuela_id          VARCHAR(50),
    dosis_semen         INT DEFAULT 1,
    veterinario         VARCHAR(150),
    costo               DECIMAL(12,2),
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (celo_id) REFERENCES celos(id),
    FOREIGN KEY (toro_id) REFERENCES animales(id),
    INDEX idx_servicios_animal (animal_id),
    INDEX idx_servicios_fecha (fecha_servicio)
) ENGINE=InnoDB;

CREATE TABLE diagnosticos_gestacion (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    servicio_id         INT,
    fecha_diagnostico   DATE NOT NULL,
    metodo              ENUM('palpacion_rectal','ecografia','hormonal','observacion') NOT NULL,
    resultado           ENUM('positivo','negativo','dudoso','reabsorcion') NOT NULL,
    dias_gestacion      INT,
    fecha_parto_estimada DATE,
    veterinario         VARCHAR(150),
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    INDEX idx_diag_animal (animal_id),
    INDEX idx_diag_fecha (fecha_diagnostico)
) ENGINE=InnoDB;

CREATE TABLE partos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    diagnostico_id      INT,
    fecha_parto         DATE NOT NULL,
    tipo_parto          ENUM('normal','distocico','cesarea','asistido') DEFAULT 'normal',
    numero_crias        INT DEFAULT 1,
    crias_vivas          INT DEFAULT 1,
    crias_muertas        INT DEFAULT 0,
    peso_promedio_cria_kg DECIMAL(5,2),
    sexo_crias          VARCHAR(30),
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (diagnostico_id) REFERENCES diagnosticos_gestacion(id),
    INDEX idx_partos_animal (animal_id),
    INDEX idx_partos_fecha (fecha_parto)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: LACTANCIAS Y PRODUCCIÓN DE LECHE
-- ============================================================

CREATE TABLE lactancias (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    parto_id            INT,
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE,
    dias_en_lactancia   INT,
    produccion_total_l  DECIMAL(10,2),
    produccion_promedio_diaria DECIMAL(6,2),
    pico_produccion_l   DECIMAL(6,2),
    dia_pico_produccion INT,
    estado              ENUM('activa','finalizada','seca') DEFAULT 'activa',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (parto_id) REFERENCES partos(id),
    INDEX idx_lactancias_animal (animal_id),
    INDEX idx_lactancias_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE produccion_leche (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NOT NULL,
    lactancia_id    INT,
    fecha           DATE NOT NULL,
    ordeno_am_l     DECIMAL(5,2),
    ordeno_pm_l     DECIMAL(5,2),
    total_dia_l     DECIMAL(6,2),
    calidad         ENUM('A','B','C','descarte') DEFAULT 'A',
    celulas_somaticas INT,
    proteina_pct    DECIMAL(4,2),
    grasa_pct       DECIMAL(4,2),
    temperatura_c   DECIMAL(4,1),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (lactancia_id) REFERENCES lactancias(id),
    INDEX idx_leche_fecha (fecha),
    INDEX idx_leche_animal (animal_id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: PESAJES
-- ============================================================

CREATE TABLE pesajes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NOT NULL,
    fecha           DATE NOT NULL,
    peso_kg         DECIMAL(8,2) NOT NULL,
    condicion_corporal ENUM('1','2','3','4','5') COMMENT '1=muy flaco, 5=obeso',
    ganancia_diaria DECIMAL(6,3) COMMENT 'kg/dia desde ultimo pesaje',
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    INDEX idx_pesajes_animal (animal_id),
    INDEX idx_pesajes_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: ALERTAS
-- ============================================================

CREATE TABLE alertas (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    tipo                ENUM('reproductiva','sanitaria','alimentacion','peso','general') NOT NULL,
    subtipo             VARCHAR(50),
    titulo              VARCHAR(200) NOT NULL,
    mensaje             TEXT NOT NULL,
    prioridad           ENUM('baja','media','alta','critica') DEFAULT 'media',
    animal_id           INT,
    lote_id             INT,
    finca_id            INT,
    fecha_evento        DATE,
    fecha_vencimiento   DATE,
    estado              ENUM('pendiente','vista','resuelta','cancelada') DEFAULT 'pendiente',
    usuario_asignado    INT,
    fecha_resolucion    TIMESTAMP NULL,
    observaciones_resolucion TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE,
    FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_asignado) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_alerta_estado (estado),
    INDEX idx_alerta_prioridad (prioridad),
    INDEX idx_alerta_fecha (fecha_evento)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: EQUIPOS Y MAQUINARIA
-- ============================================================

CREATE TABLE categorias_equipos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo        ENUM('maquinaria','herramienta','equipo_ordeño','equipo_refrigeracion','vehiculo','implemento','infraestructura') NOT NULL,
    activa      BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE equipos (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    finca_id                    INT NOT NULL,
    categoria_id                INT NOT NULL,
    codigo                      VARCHAR(50) NOT NULL,
    nombre                      VARCHAR(200) NOT NULL,
    descripcion                 TEXT,
    marca                       VARCHAR(100),
    modelo                      VARCHAR(100),
    numero_serie                VARCHAR(100),
    anio_fabricacion            INT,
    capacidad                   VARCHAR(100),
    potencia                    VARCHAR(50),
    combustible                 ENUM('gasolina','diesel','electrico','manual','hidraulico'),
    valor_compra                DECIMAL(12,2),
    fecha_compra                DATE,
    garantia_meses              INT,
    vida_util_anios             INT DEFAULT 10,
    estado                      ENUM('excelente','bueno','regular','malo','fuera_servicio') DEFAULT 'bueno',
    ubicacion                   VARCHAR(200),
    horas_uso_total             DECIMAL(10,2) DEFAULT 0,
    kilometraje_total           DECIMAL(10,2) DEFAULT 0,
    fecha_ultimo_mantenimiento  DATE,
    intervalo_mantenimiento_horas INT DEFAULT 100,
    proxima_fecha_mantenimiento DATE,
    valor_actual                DECIMAL(12,2),
    depreciacion_anual          DECIMAL(12,2),
    activo                      BOOLEAN DEFAULT TRUE,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_equipo_finca_codigo (finca_id, codigo),
    FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias_equipos(id)
) ENGINE=InnoDB;

CREATE TABLE mantenimientos (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipo_id               INT NOT NULL,
    fecha                   DATE NOT NULL,
    tipo                    ENUM('preventivo','correctivo','predictivo','emergencia') NOT NULL,
    descripcion             TEXT NOT NULL,
    horas_uso_momento       DECIMAL(10,2),
    responsable             VARCHAR(100),
    taller_externo          VARCHAR(200),
    costo_repuestos         DECIMAL(10,2) DEFAULT 0,
    costo_mano_obra         DECIMAL(10,2) DEFAULT 0,
    costo_total             DECIMAL(10,2) DEFAULT 0,
    estado_anterior         ENUM('excelente','bueno','regular','malo','fuera_servicio'),
    estado_posterior        ENUM('excelente','bueno','regular','malo','fuera_servicio'),
    tiempo_parada_horas     DECIMAL(6,2) DEFAULT 0,
    proxima_fecha_sugerida  DATE,
    observaciones           TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
    INDEX idx_mantenimiento_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- SEEDS: Datos de ejemplo para nuevos módulos
-- ============================================================

INSERT INTO categorias_alimentos (nombre, tipo) VALUES
('Concentrados', 'concentrado'),
('Forrajes', 'forraje'),
('Suplementos', 'suplemento'),
('Sales Minerales', 'mineral'),
('Melazas', 'suplemento');

INSERT INTO alimentos (categoria_id, codigo, nombre, proteina_pct, precio_kg, dosis_recomendada_kg_dia) VALUES
(1, 'CON001', 'Concentrado Lactancia 18%', 18.00, 1800.00, 4.00),
(1, 'CON002', 'Concentrado Levante 16%', 16.00, 1650.00, 3.00),
(2, 'FOR001', 'Heno de Alfalfa', 15.00, 800.00, 5.00),
(2, 'FOR002', 'Ensilaje de Maíz', 8.50, 400.00, 15.00),
(4, 'MIN001', 'Sal Mineralizada Premium', 0.00, 2200.00, 0.15);

INSERT INTO categorias_equipos (nombre, tipo) VALUES
('Tractores', 'maquinaria'),
('Ordeño', 'equipo_ordeño'),
('Refrigeración', 'equipo_refrigeracion'),
('Herramientas', 'herramienta'),
('Vehículos', 'vehiculo');

INSERT INTO equipos (finca_id, categoria_id, codigo, nombre, marca, modelo, estado) VALUES
(1, 1, 'TRC-001', 'Tractor John Deere 5075E', 'John Deere', '5075E', 'bueno'),
(1, 2, 'ORD-001', 'Sistema de Ordeño Mecánico', 'DeLaval', 'MM27', 'bueno'),
(1, 3, 'TAN-001', 'Tanque de Frío 2000L', 'Mueller', 'OH-2000', 'bueno');
