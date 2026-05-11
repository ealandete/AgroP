-- ============================================================
-- AgroP - Especies Menores: Porcinos, Avicolas, Caprinos, Ovinos
-- ============================================================
USE agrop;

-- ============================================================
-- MÓDULO: PRODUCCIÓN AVÍCOLA
-- ============================================================

CREATE TABLE IF NOT EXISTS lotes_aves (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    codigo          VARCHAR(50) NOT NULL,
    galpon          VARCHAR(50),
    fecha_ingreso   DATE NOT NULL,
    cantidad_inicial INT NOT NULL,
    cantidad_actual  INT,
    raza_id         INT,
    tipo_produccion ENUM('huevos','carne','doble_proposito','reproductoras') DEFAULT 'huevos',
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    FOREIGN KEY (raza_id) REFERENCES razas(id),
    UNIQUE KEY uk_lote_ave (finca_id, codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produccion_huevos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    lote_aves_id    INT NOT NULL,
    fecha           DATE NOT NULL,
    huevos_puestos   INT NOT NULL,
    huevos_rotos     INT DEFAULT 0,
    huevos_incubables INT DEFAULT 0,
    mortalidad_dia   INT DEFAULT 0,
    alimento_consumido_kg DECIMAL(6,2),
    peso_promedio_huevo_g DECIMAL(5,1),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_aves_id) REFERENCES lotes_aves(id),
    UNIQUE KEY uk_huevos_fecha (lote_aves_id, fecha)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: PRODUCCIÓN PORCÍCOLA
-- ============================================================

CREATE TABLE IF NOT EXISTS camadas (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    madre_id            INT NOT NULL COMMENT 'cerda - animal_id',
    padre_id            INT,
    reproduccion_id     INT,
    fecha_parto         DATE NOT NULL,
    lechones_nacidos    INT NOT NULL,
    lechones_vivos      INT,
    lechones_muertos    INT DEFAULT 0,
    lechones_momias     INT DEFAULT 0,
    peso_promedio_kg    DECIMAL(5,3),
    peso_total_camada   DECIMAL(6,2),
    fecha_destete       DATE,
    lechones_destetados  INT,
    peso_destete_promedio DECIMAL(5,2),
    mortalidad_lactancia INT DEFAULT 0,
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (madre_id) REFERENCES animales(id),
    FOREIGN KEY (padre_id) REFERENCES animales(id),
    FOREIGN KEY (reproduccion_id) REFERENCES reproduccion(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS engorde_porcino (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    lote_id         INT COMMENT 'lote donde estan los cerdos de engorde',
    codigo_lote     VARCHAR(50),
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE,
    cantidad_inicial INT NOT NULL,
    cantidad_final   INT,
    mortalidad_total INT DEFAULT 0,
    peso_inicial_promedio DECIMAL(6,2),
    peso_final_promedio DECIMAL(6,2),
    ganancia_diaria DECIMAL(6,3),
    conversion_alimenticia DECIMAL(5,3),
    alimento_total_kg DECIMAL(10,2),
    costo_total     DECIMAL(12,2),
    estado          ENUM('activo','finalizado') DEFAULT 'activo',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_id) REFERENCES lotes(id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO: APICULTURA
-- ============================================================

CREATE TABLE IF NOT EXISTS colmenas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    codigo          VARCHAR(50) NOT NULL,
    apiario         VARCHAR(100),
    fecha_instalacion DATE,
    tipo_colmena    ENUM('langstroth','africana','rústica','nucleo') DEFAULT 'langstroth',
    estado          ENUM('activa','debil','muerta','enjambrada') DEFAULT 'activa',
    ultima_revision  DATE,
    origen_reina    ENUM('propia','comprada','enjambre') DEFAULT 'propia',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    UNIQUE KEY uk_colmena (finca_id, codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cosechas_miel (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    colmena_id      INT NOT NULL,
    fecha           DATE NOT NULL,
    marcos_cosechados INT NOT NULL,
    kg_miel          DECIMAL(6,2),
    kg_cera          DECIMAL(5,2),
    kg_polen         DECIMAL(5,2),
    kg_propoleo      DECIMAL(4,2),
    tipo_floracion   VARCHAR(100),
    humedad_miel_pct DECIMAL(4,1),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (colmena_id) REFERENCES colmenas(id)
) ENGINE=InnoDB;

-- ============================================================
-- ACTUALIZAR RAZAS CON ESPECIES MENORES
-- ============================================================

INSERT INTO razas (especie, nombre, proposito) VALUES
-- Porcinos
('porcino', 'Pietrain', 'carne'),
('porcino', 'Large White', 'carne'),
('porcino', 'Hampshire', 'carne'),
('porcino', 'Criollo Zungo', 'doble'),
-- Aviares
('aviar', 'Lohmann Brown', 'huevos'),
('aviar', 'Hy-Line Brown', 'huevos'),
('aviar', 'Ross 308', 'carne'),
('aviar', 'Cobb 500', 'carne'),
('aviar', 'Criolla Colombiana', 'doble'),
-- Caprinos
('caprino', 'Saanen', 'leche'),
('caprino', 'Alpina', 'leche'),
('caprino', 'Boer', 'carne'),
('caprino', 'Criolla Santandereana', 'doble'),
-- Ovinos
('ovino', 'Dorper', 'carne'),
('ovino', 'Katahdin', 'carne'),
('ovino', 'Criollo de Pelo', 'doble'),
-- Equinos
('equino', 'Criollo Colombiano', 'trabajo'),
('equino', 'Paso Fino Colombiano', 'trabajo'),
('equino', 'Caballo de Trote', 'trabajo')
ON DUPLICATE KEY UPDATE proposito = VALUES(proposito);

-- ============================================================
-- ANIMALES DE ESPECIES MENORES (Finca Magdalena, id=4)
-- ============================================================

INSERT INTO animales (finca_id, codigo, nombre, especie, raza_id, sexo, fecha_nacimiento, fecha_ingreso, peso_kg, color) VALUES
-- Porcinos
(4, 'POR-003', 'Luna', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Large White'), 'H', '2025-01-10', '2025-01-10', 180.0, 'Blanco'),
(4, 'POR-004', 'Rosa', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Duroc'), 'H', '2025-03-15', '2025-03-15', 160.0, 'Rojo'),
(4, 'POR-005', 'Max', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Pietrain'), 'M', '2024-11-20', '2024-11-20', 220.0, 'Manchado'),
(4, 'POR-006', 'Pancha', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Criollo Zungo'), 'H', '2025-05-01', '2025-05-01', 140.0, 'Negro'),
-- Caprinos
(4, 'CAP-001', 'Blanca', 'caprino', (SELECT id FROM razas WHERE especie='caprino' AND nombre='Saanen'), 'H', '2024-03-10', '2024-03-10', 45.0, 'Blanco'),
(4, 'CAP-002', 'Canela', 'caprino', (SELECT id FROM razas WHERE especie='caprino' AND nombre='Alpina'), 'H', '2024-06-15', '2024-06-15', 42.0, 'Cafe'),
(4, 'CAP-003', 'Chivo', 'caprino', (SELECT id FROM razas WHERE especie='caprino' AND nombre='Boer'), 'M', '2023-09-01', '2023-09-01', 75.0, 'Cafe-Blanco'),
-- Ovinos
(4, 'OVI-001', NULL, 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Dorper'), 'H', '2025-02-01', '2025-02-01', 55.0, 'Blanco'),
(4, 'OVI-002', NULL, 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Katahdin'), 'H', '2025-02-15', '2025-02-15', 50.0, 'Cafe'),
(4, 'OVI-003', NULL, 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Criollo de Pelo'), 'M', '2024-08-01', '2024-08-01', 70.0, 'Negro'),
-- Equinos
(4, 'EQU-001', 'Relampago', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Criollo Colombiano'), 'M', '2018-05-01', '2018-05-01', 420.0, 'Alazan'),
(4, 'EQU-002', 'Lucera', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Paso Fino Colombiano'), 'H', '2019-03-15', '2019-03-15', 380.0, 'Negra');

-- ============================================================
-- LOTES DE AVES
-- ============================================================

INSERT INTO lotes_aves (finca_id, codigo, galpon, fecha_ingreso, cantidad_inicial, cantidad_actual, raza_id, tipo_produccion) VALUES
(4, 'GAL-01', 'Galpon 1 - Ponedoras', '2025-09-01', 500, 485, (SELECT id FROM razas WHERE especie='aviar' AND nombre='Lohmann Brown'), 'huevos'),
(4, 'GAL-02', 'Galpon 2 - Engorde', '2026-04-01', 300, 298, (SELECT id FROM razas WHERE especie='aviar' AND nombre='Ross 308'), 'carne');

-- PRODUCCION DE HUEVOS (ultimos 7 dias)
INSERT INTO produccion_huevos (lote_aves_id, fecha, huevos_puestos, huevos_rotos, mortalidad_dia, alimento_consumido_kg, peso_promedio_huevo_g) VALUES
(1, '2026-05-03', 460, 8, 0, 58.5, 62.0),
(1, '2026-05-04', 458, 5, 1, 58.3, 61.8),
(1, '2026-05-05', 462, 6, 0, 58.7, 62.2),
(1, '2026-05-06', 455, 10, 2, 58.0, 61.5),
(1, '2026-05-07', 461, 4, 0, 58.6, 62.1),
(1, '2026-05-08', 459, 7, 1, 58.4, 61.9),
(1, '2026-05-09', 463, 3, 0, 58.8, 62.3);

-- ============================================================
-- CAMADAS PORCINAS
-- ============================================================

INSERT INTO reproduccion (animal_id, tipo_servicio, fecha_servicio, resultado, fecha_parto_estimada, fecha_parto_real, numero_crias, usuario_id) VALUES
((SELECT id FROM animales WHERE codigo='POR-003'), 'monta_natural', '2025-09-01', 'preñada', '2025-12-23', '2025-12-24', 12, 1),
((SELECT id FROM animales WHERE codigo='POR-004'), 'inseminacion', '2025-11-10', 'preñada', '2026-03-04', '2026-03-03', 10, 1);

INSERT INTO camadas (madre_id, reproduccion_id, fecha_parto, lechones_nacidos, lechones_vivos, lechones_muertos, peso_promedio_kg, peso_total_camada, fecha_destete, lechones_destetados, peso_destete_promedio) VALUES
((SELECT id FROM animales WHERE codigo='POR-003'), 
 (SELECT id FROM reproduccion WHERE animal_id=(SELECT id FROM animales WHERE codigo='POR-003') AND fecha_parto_real='2025-12-24' LIMIT 1),
 '2025-12-24', 12, 11, 1, 1.45, 15.95, '2026-01-18', 10, 6.80),
((SELECT id FROM animales WHERE codigo='POR-004'),
 (SELECT id FROM reproduccion WHERE animal_id=(SELECT id FROM animales WHERE codigo='POR-004') AND fecha_parto_real='2026-03-03' LIMIT 1),
 '2026-03-03', 10, 10, 0, 1.52, 15.20, '2026-03-28', 9, 7.10);

-- ============================================================
-- COLMENAS (APICULTURA)
-- ============================================================

INSERT INTO colmenas (finca_id, codigo, apiario, fecha_instalacion, tipo_colmena, estado) VALUES
(4, 'API-01', 'Apiario El Mirador', '2024-06-15', 'langstroth', 'activa'),
(4, 'API-02', 'Apiario El Mirador', '2024-06-15', 'langstroth', 'activa'),
(4, 'API-03', 'Apiario El Mirador', '2025-01-20', 'langstroth', 'activa'),
(4, 'API-04', 'Apiario El Bosque', '2025-03-10', 'africana', 'activa'),
(4, 'API-05', 'Apiario El Bosque', '2025-03-10', 'langstroth', 'debil');

-- COSECHAS DE MIEL
INSERT INTO cosechas_miel (colmena_id, fecha, marcos_cosechados, kg_miel, kg_cera, tipo_floracion, humedad_miel_pct) VALUES
(1, '2025-11-15', 12, 28.0, 1.5, 'Campiño - Campanita', 18.5),
(1, '2026-02-10', 14, 32.0, 1.8, 'Guayaba - Arrayan', 18.0),
(2, '2025-11-15', 10, 24.0, 1.2, 'Campiño - Campanita', 18.8),
(2, '2026-02-10', 12, 28.0, 1.5, 'Guayaba - Arrayan', 18.2),
(3, '2026-02-10', 8, 18.0, 0.9, 'Guayaba - Arrayan', 17.8);

-- ============================================================
-- ACTUALIZAR PARAMETROS ESPECIES
-- ============================================================

INSERT INTO parametros (clave, valor, tipo, descripcion) VALUES
('especies_disponibles', 'bovino,porcino,aviar,caprino,ovino,equino', 'string', 'Especies productivas disponibles en el sistema'),
('unidades_produccion', 'kg,L,unidad,docena', 'string', 'Unidades de medida para produccion'),
('dias_gestacion_porcino', '114', 'int', 'Dias de gestacion para cerdos (3-3-3)'),
('dias_lactancia_porcino', '21', 'int', 'Dias de lactancia recomendados para cerdos'),
('peso_destete_porcino_kg', '6.5', 'float', 'Peso minimo recomendado al destete de lechones'),
('ciclo_ponedora_semanas', '72', 'int', 'Semanas del ciclo productivo de ponedoras'),
('huevos_ave_anio', '280', 'int', 'Huevos promedio por ave al ano'),
('mortalidad_maxima_aves_pct', '5', 'float', 'Porcentaje maximo de mortalidad aceptable en aves')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- ============================================================
-- SEEDS: PRODUCCION DE ESPECIES MENORES
-- ============================================================

INSERT INTO productos (nombre, tipo, unidad_medida, precio_ref) VALUES
('Huevos criollos', 'huevos', 'unidad', 800),
('Carne de cerdo en pie', 'carne', 'kg', 9500),
('Carne de cerdo en canal', 'carne', 'kg', 14500),
('Carne de pollo en pie', 'carne', 'kg', 5500),
('Carne de pollo en canal', 'carne', 'kg', 10500),
('Leche de cabra', 'leche', 'L', 3500),
('Queso de cabra', 'queso', 'kg', 22000),
('Carne ovina en pie', 'carne', 'kg', 8500),
('Miel de abejas', 'miel', 'kg', 28000),
('Cera de abejas', 'miel', 'kg', 18000),
('Pollen', 'miel', 'kg', 35000),
('Caballos de trabajo', 'elaborado', 'unidad', 2500000)
ON DUPLICATE KEY UPDATE precio_ref = VALUES(precio_ref);

INSERT INTO produccion (producto_id, finca_id, fecha, cantidad) VALUES
((SELECT id FROM productos WHERE nombre='Huevos criollos'), 4, '2026-04-30', 13800.0),
((SELECT id FROM productos WHERE nombre='Huevos criollos'), 4, '2026-05-01', 460.0),
((SELECT id FROM productos WHERE nombre='Miel de abejas'), 4, '2026-02-15', 60.0),
((SELECT id FROM productos WHERE nombre='Leche de cabra'), 4, '2026-05-01', 8.5),
((SELECT id FROM productos WHERE nombre='Leche de cabra'), 4, '2026-05-03', 9.0);
