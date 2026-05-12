-- ============================================================
-- AgroP - Seeds Completas: Comprehensive operational data
-- Finca Magdalena (finca_id=4, 69.95 ha, Barranquilla)
-- Hacienda El Porvenir (finca_id=2, 320 ha, Fundación)
-- ============================================================

USE agrop;

-- ============================================================
-- TABLES NEEDED FOR CERTIFICADOS MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS hierros_marcacion (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    numero_registro_ica VARCHAR(50) NOT NULL,
    diseno          VARCHAR(255) NOT NULL COMMENT 'Descripcion del diseno del hierro',
    fecha_registro  DATE NOT NULL,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    INDEX idx_hierros_finca (finca_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS certificados_traslado (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NOT NULL,
    destino         VARCHAR(255) NOT NULL,
    motivo          VARCHAR(255) NOT NULL,
    transportista   VARCHAR(150) NOT NULL,
    placa_vehiculo  VARCHAR(20) NOT NULL,
    fecha_salida    DATE NOT NULL,
    numero_guia     VARCHAR(50) UNIQUE,
    estado          VARCHAR(30) DEFAULT 'emitido' COMMENT 'emitido, cancelado',
    qr_data         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    INDEX idx_traslados_animal (animal_id),
    INDEX idx_traslados_fecha (fecha_salida)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dietas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    tipo            VARCHAR(50) NOT NULL COMMENT 'engorde, lactancia, levante, mantenimiento',
    especie         VARCHAR(50),
    descripcion     TEXT,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dieta_componentes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    dieta_id        INT NOT NULL,
    insumo_id       INT NOT NULL,
    porcentaje      DECIMAL(5,2),
    cantidad_kg     DECIMAL(10,2),
    costo_unitario  DECIMAL(10,2),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dieta_id) REFERENCES dietas(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id)
) ENGINE=InnoDB;

-- ============================================================
-- FINCA MAGDALENA (finca_id=4)
-- ============================================================

-- ============================================================
-- ANIMALES - Finca Magdalena (25+)
-- ============================================================
INSERT IGNORE INTO animales (finca_id, lote_id, codigo, nombre, especie, raza_id, sexo, fecha_nacimiento, fecha_ingreso, peso_kg, color, estado_origen, activo) VALUES
-- Bovinos en Corrales (lote 9)
(4, 9, 'BOV-020', 'Rosa', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'H', '2019-11-10', '2019-11-10', 460.0, 'Blanco', 'propio', TRUE),
(4, 9, 'BOV-021', 'Margarita', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Gyr'), 'H', '2020-06-25', '2020-06-25', 430.0, 'Gris', 'propio', TRUE),
(4, 9, 'BOV-022', 'Tornado', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'M', '2018-02-14', '2018-02-14', 680.0, 'Rojo', 'propio', TRUE),
(4, 9, 'BOV-023', 'Daisy', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Holstein'), 'H', '2021-09-30', '2021-12-01', 530.0, 'Negro-Blanco', 'propio', TRUE),
(4, 10, 'BOV-024', 'Campanita', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Gyr'), 'H', '2020-03-18', '2020-03-18', 490.0, 'Gris', 'propio', TRUE),
(4, 10, 'BOV-025', 'Rayito', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Angus'), 'M', '2022-07-05', '2022-09-01', 380.0, 'Negro', 'prestamo', TRUE),
(4, 10, 'BOV-026', 'Florecita', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'H', '2023-01-20', '2023-04-01', 280.0, 'Blanco', 'propio', TRUE),
(4, 10, 'BOV-027', 'Ternero-FM-01', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'M', '2025-11-15', '2025-11-15', 95.0, 'Blanco', 'propio', TRUE),

-- Bufalinos en Corrales (lote 9)
(4, 9, 'BUF-010', 'Nube', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2019-08-12', '2019-08-12', 560.0, 'Negro', 'propio', TRUE),
(4, 9, 'BUF-011', 'Tormenta', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Jafarabadi'), 'M', '2020-04-28', '2020-04-28', 780.0, 'Negro', 'propio', TRUE),
(4, 10, 'BUF-012', 'Estrella', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2021-11-02', '2021-11-02', 510.0, 'Negro', 'propio', TRUE),
(4, 10, 'BUF-013', 'Luna', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Mediterráneo'), 'H', '2022-06-15', '2022-06-15', 420.0, 'Gris', 'propio', TRUE),

-- Porcinos en Corrales (lote 9)
(4, 9, 'POR-010', 'Marrana-C01', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Landrace'), 'H', '2022-03-10', '2022-03-10', 250.0, 'Blanco', 'propio', TRUE),
(4, 9, 'POR-011', 'Verraco-C01', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Duroc'), 'M', '2021-08-22', '2021-08-22', 320.0, 'Rojo', 'propio', TRUE),
(4, 9, 'POR-012', 'Marrana-C02', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Large White'), 'H', '2023-05-05', '2023-05-05', 220.0, 'Blanco', 'propio', TRUE),
(4, 9, 'POR-013', 'Cebado-01', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Landrace'), 'M', '2025-09-12', '2025-09-12', 110.0, 'Blanco', 'propio', TRUE),
(4, 9, 'POR-014', 'Cebado-02', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Duroc'), 'M', '2025-10-01', '2025-10-01', 100.0, 'Rojo', 'propio', TRUE),
(4, 9, 'POR-015', 'Lechona-C01', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Landrace'), 'H', '2025-12-20', '2026-01-15', 25.0, 'Blanco', 'propio', TRUE),

-- Equinos en Corrales (lote 9)
(4, 9, 'EQU-001', 'Relampago', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Criollo Colombiano'), 'M', '2017-05-20', '2017-05-20', 420.0, 'Cafe', 'propio', TRUE),
(4, 9, 'EQU-002', 'Estrella', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Paso Fino Colombiano'), 'H', '2019-02-14', '2019-02-14', 380.0, 'Negro', 'propio', TRUE),
(4, 9, 'EQU-003', 'Centella', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Criollo Colombiano'), 'H', '2021-08-10', '2021-08-10', 350.0, 'Cafe', 'propio', TRUE),

-- Ovinos en Corrales (lote 10)
(4, 10, 'OVI-001', 'Copito', 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Pelibuey'), 'H', '2023-04-15', '2023-04-15', 35.0, 'Blanco', 'propio', TRUE),
(4, 10, 'OVI-002', 'Manchitas', 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Pelibuey'), 'H', '2023-06-20', '2023-06-20', 32.0, 'Cafe', 'propio', TRUE),
(4, 10, 'OVI-003', 'Carnero-C01', 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Pelibuey'), 'M', '2022-11-01', '2022-11-01', 48.0, 'Rojo', 'propio', TRUE),
(4, 10, 'OVI-004', 'Borrega-C01', 'ovino', (SELECT id FROM razas WHERE especie='ovino' AND nombre='Katahdin'), 'H', '2024-01-30', '2024-01-30', 28.0, 'Blanco', 'propio', TRUE),

-- Caprinos en Corrales (lote 10)
(4, 10, 'CAP-001', 'Cabra-C01', 'caprino', (SELECT id FROM razas WHERE especie='caprino' AND nombre='Saanen'), 'H', '2022-09-05', '2022-09-05', 55.0, 'Blanco', 'propio', TRUE),
(4, 10, 'CAP-002', 'Cabra-C02', 'caprino', (SELECT id FROM razas WHERE especie='caprino' AND nombre='Alpina'), 'H', '2023-03-12', '2023-03-12', 50.0, 'Cafe', 'propio', TRUE),
(4, 10, 'CAP-003', 'Machito-C01', 'caprino', (SELECT id FROM razas WHERE especie='caprino' AND nombre='Boer'), 'M', '2021-12-08', '2021-12-08', 72.0, 'Rojo', 'propio', TRUE);

-- ============================================================
-- EVENTOS - Finca Magdalena (15+)
-- ============================================================
INSERT IGNORE INTO eventos_animales (animal_id, tipo_evento, fecha, diagnostico, descripcion, veterinario, costo) VALUES
((SELECT id FROM animales WHERE codigo='BOV-020'), 'vacunacion', '2026-04-01', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Carlos Mendez', 15000),
((SELECT id FROM animales WHERE codigo='BOV-021'), 'vacunacion', '2026-04-01', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Carlos Mendez', 15000),
((SELECT id FROM animales WHERE codigo='BOV-022'), 'vacunacion', '2026-04-01', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Carlos Mendez', 15000),
((SELECT id FROM animales WHERE codigo='BUF-010'), 'vacunacion', '2026-04-02', NULL, 'Vacuna aftosa ciclo I-2026 bufalinos', 'Dr. Carlos Mendez', 15000),
((SELECT id FROM animales WHERE codigo='BUF-011'), 'vacunacion', '2026-04-02', NULL, 'Vacuna aftosa ciclo I-2026 bufalinos', 'Dr. Carlos Mendez', 15000),
((SELECT id FROM animales WHERE codigo='BOV-023'), 'desparasitacion', '2026-04-05', NULL, 'Ivermectina 1% control parasitario', 'Dr. Carlos Mendez', 12000),
((SELECT id FROM animales WHERE codigo='BOV-024'), 'desparasitacion', '2026-04-05', NULL, 'Ivermectina 1% control parasitario', 'Dr. Carlos Mendez', 10000),
((SELECT id FROM animales WHERE codigo='BUF-012'), 'desparasitacion', '2026-04-06', NULL, 'Ivermectina 1% bufalinos', 'Dr. Carlos Mendez', 12000),
((SELECT id FROM animales WHERE codigo='POR-010'), 'desparasitacion', '2026-04-08', NULL, 'Desparasitacion porcinos reproduccion', 'Dr. Carlos Mendez', 8000),
((SELECT id FROM animales WHERE codigo='POR-011'), 'desparasitacion', '2026-04-08', NULL, 'Desparasitacion verraco', 'Dr. Carlos Mendez', 8000),
((SELECT id FROM animales WHERE codigo='BOV-020'), 'enfermedad', '2026-04-10', 'Mastitis clinica cuarto posterior izquierdo', 'Tratamiento antibiotico intramamario 5 dias', 'Dr. Carlos Mendez', 55000),
((SELECT id FROM animales WHERE codigo='BUF-010'), 'tratamiento', '2026-04-15', 'Pododermatitis interdigital', 'Pediluvio con sulfato de zinc y antibiotico', 'Dr. Carlos Mendez', 42000),
((SELECT id FROM animales WHERE codigo='EQU-001'), 'vacunacion', '2026-04-20', NULL, 'Vacuna antitetanica y desparasitacion equinos', 'Dr. Carlos Mendez', 35000),
((SELECT id FROM animales WHERE codigo='EQU-002'), 'vacunacion', '2026-04-20', NULL, 'Vacuna antitetanica equinos', 'Dr. Carlos Mendez', 25000),
((SELECT id FROM animales WHERE codigo='OVI-001'), 'desparasitacion', '2026-04-22', NULL, 'Desparasitacion ovinos', 'Dr. Carlos Mendez', 5000),
((SELECT id FROM animales WHERE codigo='CAP-001'), 'desparasitacion', '2026-04-22', NULL, 'Desparasitacion caprinos', 'Dr. Carlos Mendez', 5000),
((SELECT id FROM animales WHERE codigo='POR-012'), 'parto', '2026-04-25', 'Parto normal', '12 lechones vivos, 1 muerto', 'Dr. Carlos Mendez', 0),
((SELECT id FROM animales WHERE codigo='BOV-020'), 'control', '2026-04-28', 'Control post-tratamiento mastitis', 'Revision y evaluacion. Responde positivamente al tratamiento.', 'Dr. Carlos Mendez', 20000);

-- ============================================================
-- PESAJES - Finca Magdalena (20+)
-- ============================================================
INSERT IGNORE INTO pesajes (animal_id, fecha, peso_kg, condicion_corporal, metodo) VALUES
((SELECT id FROM animales WHERE codigo='BOV-020'), '2026-04-01', 465.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-021'), '2026-04-01', 435.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-022'), '2026-04-01', 685.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-023'), '2026-04-01', 535.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-024'), '2026-04-01', 495.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-010'), '2026-04-01', 565.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-011'), '2026-04-01', 790.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-012'), '2026-04-01', 515.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-010'), '2026-04-01', 255.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-011'), '2026-04-01', 325.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='EQU-001'), '2026-04-01', 425.0, 4, 'cinta'),
((SELECT id FROM animales WHERE codigo='EQU-002'), '2026-04-01', 385.0, 3, 'cinta'),
((SELECT id FROM animales WHERE codigo='OVI-001'), '2026-04-01', 36.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='OVI-003'), '2026-04-01', 50.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='CAP-001'), '2026-04-01', 56.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='CAP-003'), '2026-04-01', 74.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-020'), '2026-04-15', 470.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-021'), '2026-04-15', 440.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-010'), '2026-04-15', 570.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-012'), '2026-04-15', 520.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-013'), '2026-04-15', 135.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-014'), '2026-04-15', 125.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='EQU-003'), '2026-04-01', 355.0, 3, 'cinta'),
((SELECT id FROM animales WHERE codigo='OVI-002'), '2026-04-01', 33.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='CAP-002'), '2026-04-01', 52.0, 3, 'bascula');

-- ============================================================
-- SIEMBRAS - Finca Magdalena (8+)
-- ============================================================
INSERT IGNORE INTO siembras (lote_id, variedad_id, cultivo, fecha_siembra, fecha_cosecha_estimada, area_ha, metodo_siembra, estado) VALUES
(11, (SELECT id FROM variedades_cultivo WHERE variedad='ICA V-305'), 'maiz', '2026-04-01', '2026-08-09', 2.5, 'directa', 'activo'),
(12, (SELECT id FROM variedades_cultivo WHERE variedad='ICA Cerinza'), 'frijol', '2026-04-10', '2026-07-09', 2.0, 'directa', 'activo'),
(13, (SELECT id FROM variedades_cultivo WHERE variedad='Dominico Harton'), 'platano', '2026-03-01', '2027-03-01', 1.5, 'directa', 'activo'),
(14, (SELECT id FROM variedades_cultivo WHERE variedad='ICA Costeña'), 'yuca', '2026-02-15', '2027-01-11', 2.0, 'directa', 'activo'),
(15, (SELECT id FROM variedades_cultivo WHERE variedad='Brachiaria decumbens'), 'pasto', '2026-01-15', '2026-03-01', 3.0, 'voleo', 'cosechado'),
(16, (SELECT id FROM variedades_cultivo WHERE variedad='ICA V-305'), 'maiz', '2025-10-01', '2026-02-08', 2.0, 'directa', 'cosechado'),
(11, (SELECT id FROM variedades_cultivo WHERE variedad='ICA Negrita'), 'yuca', '2026-05-01', '2027-02-25', 1.8, 'directa', 'activo'),
(13, (SELECT id FROM variedades_cultivo WHERE variedad='Panicum maximum'), 'pasto', '2026-04-20', '2026-05-25', 2.0, 'voleo', 'activo');

-- ============================================================
-- COSECHAS - Finca Magdalena (10+)
-- ============================================================
INSERT IGNORE INTO cosechas (siembra_id, lote_id, fecha, cantidad_kg, calidad, metodo, destino) VALUES
-- Maiz cosecha lote Poligono 6
((SELECT id FROM siembras WHERE lote_id=16 AND cultivo='maiz' AND estado='cosechado' LIMIT 1), 16, '2026-02-10', 8500, 'A', 'manual', 'almacen'),
((SELECT id FROM siembras WHERE lote_id=16 AND cultivo='maiz' AND estado='cosechado' LIMIT 1), 16, '2026-02-12', 6500, 'B', 'manual', 'venta'),
-- Pasto Brachiaria lote Poligono 5
((SELECT id FROM siembras WHERE lote_id=15 AND cultivo='pasto' LIMIT 1), 15, '2026-03-02', 45000, 'A', 'mecanizada', 'alimentacion'),
((SELECT id FROM siembras WHERE lote_id=15 AND cultivo='pasto' LIMIT 1), 15, '2026-03-15', 38000, 'A', 'mecanizada', 'alimentacion'),
((SELECT id FROM siembras WHERE lote_id=15 AND cultivo='pasto' LIMIT 1), 15, '2026-03-28', 42000, 'B', 'mecanizada', 'alimentacion'),
((SELECT id FROM siembras WHERE lote_id=15 AND cultivo='pasto' LIMIT 1), 15, '2026-04-10', 35000, 'A', 'mecanizada', 'alimentacion'),
-- Platano cosecha
((SELECT id FROM siembras WHERE lote_id=13 AND cultivo='platano' LIMIT 1), 13, '2026-04-05', 1200, 'A', 'manual', 'venta'),
((SELECT id FROM siembras WHERE lote_id=13 AND cultivo='platano' LIMIT 1), 13, '2026-04-12', 950, 'A', 'manual', 'venta'),
((SELECT id FROM siembras WHERE lote_id=13 AND cultivo='platano' LIMIT 1), 13, '2026-04-20', 1100, 'B', 'manual', 'autoconsumo'),
-- Yuca costo de almacen
((SELECT id FROM siembras WHERE lote_id=14 AND cultivo='yuca' LIMIT 1), 14, '2026-04-25', 800, 'A', 'manual', 'venta'),
((SELECT id FROM siembras WHERE lote_id=14 AND cultivo='yuca' LIMIT 1), 14, '2026-05-02', 600, 'B', 'manual', 'procesamiento');

-- ============================================================
-- COSTOS - Finca Magdalena (30+)
-- ============================================================
INSERT IGNORE INTO costos (categoria_id, finca_id, fecha, descripcion, monto, medio_pago) VALUES
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-01-05', 'Concentrado bovinos engorde enero', 1850000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-01-10', 'Alimento porcinos levante 500 kg', 1350000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-01-15', 'Sal mineralizada ovinos/caprinos 50 kg', 125000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-02-05', 'Concentrado bovinos febrero', 1850000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-02-10', 'Alimento cerdos ceba 600 kg', 1620000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-03-05', 'Concentrado bovinos marzo', 1900000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-03-12', 'Alimento aves ponedoras 200 kg', 520000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-04-05', 'Concentrado bovinos abril', 1900000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-04-10', 'Pasto de corte para equinos 2 ton', 240000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 4, '2026-04-01', 'Vacuna aftosa 10 dosis', 150000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 4, '2026-04-05', 'Ivermectina 1% 500 mL', 85000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 4, '2026-04-08', 'Antibioticos y desparasitantes varios', 210000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 4, '2026-01-20', 'Urea 46% maiz Poligono 1', 850000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 4, '2026-02-15', 'Fertilizante 15-15-15 platano y yuca', 1200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 4, '2026-03-10', 'Cal dolomita correccion pH pastos', 620000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 4, '2026-04-01', 'Fertilizante foliar maiz Poligono 1', 340000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 4, '2026-03-25', 'Semilla maiz ICA V-305 50 kg', 650000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 4, '2026-03-25', 'Semilla frijol ICA Cerinza 30 kg', 420000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 4, '2026-04-15', 'Semilla yuca ICA Negrita 2000 esquejes', 380000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-01-31', 'Nomina enero operarios', 3800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-02-28', 'Nomina febrero operarios', 3800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-03-31', 'Nomina marzo operarios', 4200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-04-30', 'Nomina abril operarios', 4200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 4, '2026-01-28', 'ACPM y gasolina enero', 420000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 4, '2026-02-25', 'Gasolina motosierra y guadañadora', 350000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 4, '2026-03-28', 'ACPM tractor marzo', 480000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 4, '2026-04-25', 'Combustible general abril', 390000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 4, '2026-02-10', 'Mantenimiento galpones y porquerizas', 720000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 4, '2026-03-15', 'Mantenimiento cerca electrica corrales', 380000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 4, '2026-04-12', 'Reparacion bebedero corrales', 150000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 4, '2026-02-18', 'Flete transporte huevos y pollos', 180000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 4, '2026-03-20', 'Transporte de insumos y concentrados', 250000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 4, '2026-01-10', 'Factura energia electrica enero', 185000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 4, '2026-02-10', 'Factura energia electrica febrero', 175000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 4, '2026-03-10', 'Factura energia electrica marzo', 195000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 4, '2026-04-20', 'Honorarios veterinario control mensual', 350000, 'efectivo');

-- ============================================================
-- VENTAS - Finca Magdalena (15+)
-- ============================================================
INSERT IGNORE INTO ventas (producto_id, finca_id, fecha, cliente, cantidad, precio_unitario, total, medio_pago, observaciones) VALUES
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 4, '2026-01-15', 'Quesera Artesanal El Molino', 180.0, 2500, 450000, 'transferencia', 'Leche bovina enero'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 4, '2026-02-15', 'Quesera Artesanal El Molino', 195.0, 2500, 487500, 'transferencia', 'Leche bovina febrero'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 4, '2026-03-15', 'Quesera Artesanal El Molino', 210.0, 2500, 525000, 'transferencia', 'Leche bovina marzo'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 4, '2026-04-15', 'Quesera Artesanal El Molino', 200.0, 2500, 500000, 'transferencia', 'Leche bovina abril'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-01-08', 'Tienda La Campesina', 1200, 450, 540000, 'efectivo', 'Huevos de gallina criolla'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-02-05', 'Tienda La Campesina', 1350, 450, 607500, 'efectivo', 'Huevos de gallina criolla'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-03-12', 'Tienda La Campesina', 1500, 460, 690000, 'efectivo', 'Huevos de gallina criolla'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-04-10', 'Tienda La Campesina', 1400, 460, 644000, 'transferencia', 'Huevos de gallina criolla'),
((SELECT id FROM productos WHERE nombre LIKE 'Cerdo%' LIMIT 1), 4, '2026-02-20', 'Frigorífico del Caribe S.A.S.', 250, 7000, 1750000, 'transferencia', 'Cerdo cebado raza Duroc'),
((SELECT id FROM productos WHERE nombre LIKE 'Cerdo%' LIMIT 1), 4, '2026-04-18', 'Frigorífico del Caribe S.A.S.', 280, 7000, 1960000, 'transferencia', 'Dos cerdos cebados'),
((SELECT id FROM productos WHERE nombre LIKE 'Pollo%' LIMIT 1), 4, '2026-02-28', 'Carlos Arturo Mendoza', 150, 9500, 1425000, 'efectivo', 'Pollos finca beneficiados'),
((SELECT id FROM productos WHERE nombre LIKE 'Pollo%' LIMIT 1), 4, '2026-04-22', 'Carlos Arturo Mendoza', 180, 9500, 1710000, 'efectivo', 'Pollos finca abril'),
((SELECT id FROM productos WHERE nombre LIKE 'Plátano%' OR nombre='Platano verde' LIMIT 1), 4, '2026-04-08', 'Central de Abastos Ciénaga', 950, 1500, 1425000, 'efectivo', 'Platano verde cosecha'),
((SELECT id FROM productos WHERE nombre LIKE 'Frijol%' LIMIT 1), 4, '2026-01-25', 'Comercializadora Agrícola del Magdalena', 800, 6000, 4800000, 'transferencia', 'Frijol seco cosecha'),
((SELECT id FROM productos WHERE nombre LIKE 'Maiz%' AND nombre NOT LIKE '%Huevo%' LIMIT 1), 4, '2026-02-20', 'Comercializadora Agrícola del Magdalena', 6500, 2000, 13000000, 'transferencia', 'Maiz grano cosecha Poligono 6');

-- ============================================================
-- INSUMOS STOCK - Finca Magdalena (10+)
-- ============================================================
INSERT IGNORE INTO inventario (insumo_id, cantidad, costo_unitario, fecha_ingreso, ubicacion, proveedor_id) VALUES
(1, 500, 1850, '2026-03-01', 'Bodega principal', 1),
(2, 300, 2100, '2026-03-01', 'Bodega principal', 1),
(4, 20, 45000, '2026-02-15', 'Bodega agroquimicos', 1),
(7, 100, 6500, '2026-03-25', 'Bodega semillas', 3),
(8, 1000, 3700, '2026-04-05', 'Bodega alimentos', 5),
(9, 2, 42000, '2026-03-10', 'Farmacia veterinaria', 2),
(10, 1000, 350, '2026-03-10', 'Farmacia veterinaria', 2),
(3, 400, 2800, '2026-02-20', 'Bodega principal', 1),
(5, 10, 38000, '2026-01-15', 'Bodega agroquimicos', 1),
(11, 800, 2250, '2026-03-15', 'Bodega principal', 4);

-- ============================================================
-- PERSONAL - Finca Magdalena (5+)
-- ============================================================
INSERT IGNORE INTO personal (tipo_documento, numero_documento, nombre, apellido, fecha_nacimiento, telefono, cargo, tipo_contrato, fecha_ingreso, salario_base, eps, arl, fondo_pension, activo) VALUES
('CC', '90123456', 'Julio César', 'Díaz Martínez', '1987-05-12', '3105012345', 'administrador', 'indefinido', '2021-03-01', 2200000, 'Nueva EPS', 'Positiva', 'Porvenir', 1),
('CC', '91234567', 'Pedro', 'Martínez López', '1990-09-25', '3206112233', 'operario_campo', 'fijo', '2022-06-15', 1300000, 'Sanitas', 'ARL Sura', 'Colfondos', 1),
('CC', '92345678', 'Luis', 'Hernández Gómez', '1985-11-08', '3007123344', 'vaquero', 'indefinido', '2020-01-10', 1450000, 'Compensar', 'Positiva', 'Protección', 1),
('CC', '93456789', 'Ana', 'Torres Castillo', '1993-04-18', '3158134455', 'ordenador', 'fijo', '2023-02-01', 1300000, 'Famisanar', 'ARL Sura', 'Porvenir', 1),
('CC', '94567890', 'Carlos', 'Méndez Rivera', '1982-08-22', '3109145566', 'veterinario', 'prestacion_servicios', '2024-01-15', 2000000, 'Sura EPS', 'Seguros Bolívar', 'Colfondos', 1);

-- ============================================================
-- PLAN ACTIVIDADES - Finca Magdalena (15+)
-- ============================================================
INSERT IGNORE INTO plan_actividades (finca_id, lote_id, tipo_actividad, titulo, descripcion, fecha_programada, duracion_estimada, responsable, prioridad, estado) VALUES
(4, 9, 'vacunacion', 'Vacunacion aftosa ciclo II - Corrales', 'Aplicacion vacuna aftosa a todo el hato bovino y bufalino', '2026-08-05', 5, 'Dr. Carlos Méndez', 'alta', 'programado'),
(4, 9, 'desparasitacion', 'Desparasitacion trimestral julio', 'Desparasitacion de todos los animales de la finca', '2026-07-15', 4, 'Dr. Carlos Méndez', 'media', 'programado'),
(4, 9, 'pesaje', 'Pesaje mensual julio', 'Pesaje de todos los animales', '2026-07-03', 6, 'Pedro Martínez', 'media', 'programado'),
(4, 9, 'pesaje', 'Pesaje mensual agosto', 'Pesaje mensual general', '2026-08-04', 6, 'Pedro Martínez', 'media', 'programado'),
(4, 11, 'fertilizacion', 'Fertilizacion maiz Poligono 1 (dia 30)', 'Segunda fertilizacion maiz con urea 46%', '2026-05-01', 4, 'Julio César Díaz', 'media', 'completado'),
(4, 11, 'fertilizacion', 'Fertilizacion maiz Poligono 1 (dia 60)', 'Tercera fertilizacion maiz con KCl', '2026-06-01', 4, 'Julio César Díaz', 'media', 'programado'),
(4, 12, 'fertilizacion', 'Fertilizacion frijol Poligono 2 (dia 25)', 'Aplicacion fertilizante foliar', '2026-05-05', 3, 'Julio César Díaz', 'media', 'programado'),
(4, 11, 'cosecha', 'Cosecha maiz Poligono 1', 'Cosecha manual del maiz sembrado en abril', '2026-08-10', 8, 'Julio César Díaz', 'alta', 'programado'),
(4, 12, 'cosecha', 'Cosecha frijol Poligono 2', 'Cosecha del frijol sembrado en abril', '2026-07-10', 6, 'Julio César Díaz', 'alta', 'programado'),
(4, 14, 'cosecha', 'Cosecha yuca Poligono 4', 'Cosecha de yuca sembrada en febrero', '2027-01-15', 10, 'Julio César Díaz', 'alta', 'programado'),
(4, 13, 'siembra', 'Resiembra platano Poligono 3', 'Resiembra de platano para renovacion', '2026-06-15', 6, 'Julio César Díaz', 'media', 'programado'),
(4, 9, 'inseminacion', 'IA - Rosa (BOV-020) segundo servicio', 'Inseminacion artificial con pajuela Brahman', '2026-06-20', 2, 'Dr. Carlos Méndez', 'alta', 'programado'),
(4, 9, 'mantenimiento', 'Mantenimiento preventivo tractor', 'Cambio de aceite, filtros y revision general', '2026-06-10', 5, 'Mecánico', 'alta', 'programado'),
(4, 9, 'mantenimiento', 'Mantenimiento cercas corrales', 'Reparacion de cercas electricas y postes', '2026-05-20', 4, 'Luis Hernández', 'media', 'completado'),
(4, 14, 'riego', 'Riego de emergencia yuca Poligono 4', 'Riego suplementario por sequia', '2026-07-20', 3, 'Julio César Díaz', 'baja', 'programado'),
(4, 15, 'control_plagas', 'Control malezas pasto Poligono 5', 'Aplicacion herbicida selectivo', '2026-05-25', 3, 'Julio César Díaz', 'media', 'programado'),
(4, 9, 'marcacion', 'Mantenimiento motobomba', 'Revision y reparacion de motobomba de riego', '2026-07-05', 3, 'Mecánico', 'media', 'programado');

-- ============================================================
-- EQUIPOS - Finca Magdalena (5+)
-- ============================================================
INSERT IGNORE INTO equipos (finca_id, categoria_id, codigo, nombre, marca, modelo, estado, fecha_compra, valor_compra, vida_util_anios) VALUES
(4, 1, 'EQ-FM-001', 'Tractor Agrícola', 'John Deere', '5050E', 'bueno', '2021-03-15', 180000000, 15),
(4, 4, 'EQ-FM-002', 'Motosierra', 'Stihl', 'MS-250', 'bueno', '2023-06-01', 2500000, 5),
(4, 4, 'EQ-FM-003', 'Guadañadora', 'Stihl', 'FS-131', 'bueno', '2024-01-10', 1800000, 5),
(4, 2, 'EQ-FM-004', 'Bomba de agua', 'Pedrollo', 'JSWm 2BX', 'bueno', '2022-08-20', 3200000, 10),
(4, 5, 'EQ-FM-005', 'Remolque ganadero', 'Metalcampo', 'RC-3000', 'bueno', '2020-11-05', 8500000, 12);

-- ============================================================
-- FUENTES DE AGUA - Finca Magdalena
-- ============================================================
INSERT IGNORE INTO fuentes_agua (finca_id, nombre, tipo, caudal_lps, activo) VALUES
(4, 'Pozo Profundo Corrales', 'pozo', 15.0, TRUE),
(4, 'Rio Magdalena (concesion)', 'rio', 50.0, TRUE),
(4, 'Jaguey Poligono 5', 'otro', 3.0, TRUE);

-- ============================================================
-- HACIENDA EL PORVENIR (finca_id=2)
-- ============================================================

-- ============================================================
-- ANIMALES - Hacienda El Porvenir (30+)
-- ============================================================
INSERT IGNORE INTO animales (finca_id, lote_id, codigo, nombre, especie, raza_id, sexo, fecha_nacimiento, fecha_ingreso, peso_kg, color, estado_origen, activo) VALUES
-- Bovinos en Potrero La Gloria (lote 27)
(2, 27, 'BOV-030', 'Linda', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'H', '2020-01-20', '2020-01-20', 520.0, 'Blanco', 'propio', TRUE),
(2, 27, 'BOV-031', 'Bonita', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Gyr'), 'H', '2019-09-15', '2019-09-15', 480.0, 'Gris', 'propio', TRUE),
(2, 27, 'BOV-032', 'Reynaldo', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Guzerat'), 'M', '2018-06-10', '2018-06-10', 720.0, 'Rojo', 'propio', TRUE),
(2, 27, 'BOV-033', 'Violeta', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Romosinuano'), 'H', '2021-11-03', '2021-11-03', 410.0, 'Cafe', 'propio', TRUE),
(2, 27, 'BOV-034', 'Nevado', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'M', '2022-04-25', '2022-07-01', 350.0, 'Blanco', 'propio', TRUE),

-- Bovinos en Potrero Las Flores (lote 29)
(2, 29, 'BOV-035', 'Esperanza', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahmans'), 'H', '2020-12-08', '2020-12-08', 460.0, 'Negro', 'propio', TRUE),
(2, 29, 'BOV-036', 'Pinta', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Holstein'), 'H', '2021-05-30', '2021-05-30', 550.0, 'Negro-Blanco', 'propio', TRUE),
(2, 29, 'BOV-037', 'Toro-P01', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'M', '2019-10-12', '2019-10-12', 780.0, 'Rojo', 'propio', TRUE),
(2, 29, 'BOV-038', 'Nube', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Gyr'), 'H', '2023-02-14', '2023-02-14', 290.0, 'Gris', 'propio', TRUE),

-- Bovinos en Lote El Tesoro (lote 28)
(2, 28, 'BOV-039', 'Ternero-HEP-02', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'M', '2025-11-28', '2025-11-28', 110.0, 'Blanco', 'propio', TRUE),
(2, 28, 'BOV-040', 'Ternera-HEP-03', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Romosinuano'), 'H', '2025-12-05', '2025-12-05', 105.0, 'Cafe', 'propio', TRUE),
(2, 28, 'BOV-041', 'Novilla-HEP-01', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Guzerat'), 'H', '2024-06-15', '2024-06-15', 210.0, 'Rojo', 'propio', TRUE),

-- Bufalinos en Potrero La Gloria (lote 27)
(2, 27, 'BUF-020', 'Mora', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2020-03-20', '2020-03-20', 540.0, 'Negro', 'propio', TRUE),
(2, 27, 'BUF-021', 'Azabache', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'M', '2019-07-15', '2019-07-15', 820.0, 'Negro', 'propio', TRUE),
(2, 27, 'BUF-022', 'Perla', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2021-10-01', '2021-10-01', 490.0, 'Negro', 'propio', TRUE),

-- Bufalinos en Potrero Las Flores (lote 29)
(2, 29, 'BUF-023', 'Estrella', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Mediterráneo'), 'H', '2020-06-28', '2020-06-28', 510.0, 'Gris', 'propio', TRUE),
(2, 29, 'BUF-024', 'Tormento', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Jafarabadi'), 'M', '2018-12-10', '2018-12-10', 850.0, 'Negro', 'propio', TRUE),
(2, 29, 'BUF-025', 'Rocio', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2022-08-22', '2022-08-22', 380.0, 'Negro', 'propio', TRUE),
(2, 29, 'BUF-026', 'Luna', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2023-04-05', '2023-04-05', 300.0, 'Negro', 'propio', TRUE),

-- Equinos en Potrero La Gloria (lote 27)
(2, 27, 'EQU-010', 'Furia', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Paso Fino Colombiano'), 'M', '2018-04-12', '2018-04-12', 450.0, 'Cafe', 'propio', TRUE),
(2, 27, 'EQU-011', 'Paloma', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Criollo Colombiano'), 'H', '2020-09-08', '2020-09-08', 390.0, 'Negro', 'propio', TRUE),
(2, 27, 'EQU-012', 'Rayito', 'equino', (SELECT id FROM razas WHERE especie='equino' AND nombre='Criollo Colombiano'), 'M', '2022-02-20', '2022-02-20', 360.0, 'Cafe', 'propio', TRUE),

-- Porcinos en Lote El Tesoro (lote 28) - area de cerdos
(2, 28, 'POR-020', 'Channel-01', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Landrace'), 'H', '2022-07-10', '2022-07-10', 260.0, 'Blanco', 'propio', TRUE),
(2, 28, 'POR-021', 'Verraco-HEP', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Duroc'), 'M', '2021-11-25', '2021-11-25', 340.0, 'Rojo', 'propio', TRUE),
(2, 28, 'POR-022', 'Channel-02', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Large White'), 'H', '2023-06-18', '2023-06-18', 230.0, 'Blanco', 'propio', TRUE),
(2, 28, 'POR-023', 'Ceba-HEP-01', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Landrace'), 'M', '2025-10-05', '2025-10-05', 115.0, 'Blanco', 'propio', TRUE),
(2, 28, 'POR-024', 'Ceba-HEP-02', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Duroc'), 'M', '2025-10-20', '2025-10-20', 105.0, 'Rojo', 'propio', TRUE),
(2, 28, 'POR-025', 'Ceba-HEP-03', 'porcino', (SELECT id FROM razas WHERE especie='porcino' AND nombre='Landrace'), 'M', '2025-11-08', '2025-11-08', 95.0, 'Blanco', 'propio', TRUE);

-- ============================================================
-- EVENTOS - Hacienda El Porvenir (20+)
-- ============================================================
INSERT IGNORE INTO eventos_animales (animal_id, tipo_evento, fecha, diagnostico, descripcion, veterinario, costo) VALUES
((SELECT id FROM animales WHERE codigo='BOV-030'), 'vacunacion', '2026-03-10', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-031'), 'vacunacion', '2026-03-10', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-032'), 'vacunacion', '2026-03-10', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-033'), 'vacunacion', '2026-03-10', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-034'), 'vacunacion', '2026-03-10', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-035'), 'vacunacion', '2026-03-11', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-036'), 'vacunacion', '2026-03-11', NULL, 'Vacuna aftosa ciclo I-2026', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BUF-020'), 'vacunacion', '2026-03-12', NULL, 'Vacuna aftosa ciclo I-2026 bufalinos', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BUF-021'), 'vacunacion', '2026-03-12', NULL, 'Vacuna aftosa ciclo I-2026 bufalinos', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BUF-022'), 'vacunacion', '2026-03-12', NULL, 'Vacuna aftosa ciclo I-2026 bufalinos', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BUF-023'), 'vacunacion', '2026-03-12', NULL, 'Vacuna aftosa ciclo I-2026 bufalinos', 'Dr. Andrés Mejía', 15000),
((SELECT id FROM animales WHERE codigo='BOV-030'), 'desparasitacion', '2026-04-01', NULL, 'Ivermectina 1% control parasitario', 'Dr. Andrés Mejía', 12000),
((SELECT id FROM animales WHERE codigo='BOV-031'), 'desparasitacion', '2026-04-01', NULL, 'Ivermectina 1% control parasitario', 'Dr. Andrés Mejía', 10000),
((SELECT id FROM animales WHERE codigo='BUF-020'), 'desparasitacion', '2026-04-02', NULL, 'Ivermectina 1% bufalinos', 'Dr. Andrés Mejía', 12000),
((SELECT id FROM animales WHERE codigo='BUF-022'), 'desparasitacion', '2026-04-02', NULL, 'Ivermectina 1% bufalinos', 'Dr. Andrés Mejía', 10000),
((SELECT id FROM animales WHERE codigo='BOV-035'), 'enfermedad', '2026-04-05', 'Anaplasmosis clinica', 'Tratamiento con oxitetraciclina LA y vitaminas', 'Dr. Andrés Mejía', 85000),
((SELECT id FROM animales WHERE codigo='BUF-023'), 'tratamiento', '2026-04-08', 'Queratoconjuntivitis', 'Tratamiento topico con antibiotico ocular', 'Dr. Andrés Mejía', 32000),
((SELECT id FROM animales WHERE codigo='EQU-010'), 'vacunacion', '2026-04-12', NULL, 'Vacuna encefalitis equina y antitetanica', 'Dr. Andrés Mejía', 45000),
((SELECT id FROM animales WHERE codigo='EQU-011'), 'vacunacion', '2026-04-12', NULL, 'Vacuna encefalitis equina', 'Dr. Andrés Mejía', 35000),
((SELECT id FROM animales WHERE codigo='POR-020'), 'desparasitacion', '2026-04-15', NULL, 'Desparasitacion porcinos', 'Dr. Andrés Mejía', 8000),
((SELECT id FROM animales WHERE codigo='POR-021'), 'desparasitacion', '2026-04-15', NULL, 'Desparasitacion verraco', 'Dr. Andrés Mejía', 8000),
((SELECT id FROM animales WHERE codigo='BOV-030'), 'parto', '2026-04-18', 'Parto normal', 'Cria hembra Brahman 34 kg', 'Dr. Andrés Mejía', 0),
((SELECT id FROM animales WHERE codigo='BUF-020'), 'parto', '2026-04-22', 'Parto normal', 'Cria macho Murrah 40 kg', 'Dr. Andrés Mejía', 0);

-- ============================================================
-- PESAJES - Hacienda El Porvenir (25+)
-- ============================================================
INSERT IGNORE INTO pesajes (animal_id, fecha, peso_kg, condicion_corporal, metodo) VALUES
((SELECT id FROM animales WHERE codigo='BOV-030'), '2026-03-15', 525.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-031'), '2026-03-15', 485.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-032'), '2026-03-15', 730.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-033'), '2026-03-15', 415.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-034'), '2026-03-15', 355.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-035'), '2026-03-15', 465.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-036'), '2026-03-15', 555.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-037'), '2026-03-15', 790.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-038'), '2026-03-15', 295.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-020'), '2026-03-15', 545.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-021'), '2026-03-15', 830.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-022'), '2026-03-15', 495.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-023'), '2026-03-15', 515.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-024'), '2026-03-15', 860.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-025'), '2026-03-15', 385.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-026'), '2026-03-15', 305.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='EQU-010'), '2026-03-15', 455.0, 4, 'cinta'),
((SELECT id FROM animales WHERE codigo='EQU-011'), '2026-03-15', 395.0, 3, 'cinta'),
((SELECT id FROM animales WHERE codigo='EQU-012'), '2026-03-15', 365.0, 3, 'cinta'),
((SELECT id FROM animales WHERE codigo='POR-020'), '2026-03-15', 265.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-021'), '2026-03-15', 345.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-022'), '2026-03-15', 235.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-023'), '2026-03-15', 120.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-024'), '2026-03-15', 110.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='POR-025'), '2026-03-15', 100.0, 3, 'bascula'),
((SELECT id FROM animales WHERE codigo='BOV-030'), '2026-04-15', 530.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-020'), '2026-04-15', 550.0, 4, 'bascula'),
((SELECT id FROM animales WHERE codigo='BUF-022'), '2026-04-15', 500.0, 3, 'bascula');

-- ============================================================
-- SIEMBRAS - Hacienda El Porvenir (12+)
-- ============================================================
INSERT IGNORE INTO siembras (lote_id, variedad_id, cultivo, fecha_siembra, fecha_cosecha_estimada, area_ha, metodo_siembra, estado) VALUES
(28, (SELECT id FROM variedades_cultivo WHERE variedad='Sintético Caribe'), 'maiz', '2026-02-01', '2026-06-05', 20.0, 'directa', 'activo'),
(28, (SELECT id FROM variedades_cultivo WHERE variedad='ICA Costeña'), 'yuca', '2026-01-15', '2026-12-10', 10.0, 'directa', 'activo'),
(30, (SELECT id FROM variedades_cultivo WHERE variedad='Brachiaria decumbens'), 'pasto', '2026-04-01', '2026-05-06', 15.0, 'voleo', 'activo'),
(30, (SELECT id FROM variedades_cultivo WHERE variedad='Panicum maximum'), 'pasto', '2026-05-01', '2026-06-05', 12.0, 'voleo', 'activo'),
(27, (SELECT id FROM variedades_cultivo WHERE variedad='Brachiaria decumbens'), 'pasto', '2025-08-01', '2025-09-15', 25.0, 'voleo', 'cosechado'),
(28, (SELECT id FROM variedades_cultivo WHERE variedad='Sésamo Regional'), 'ajoni', '2026-05-01', '2026-08-03', 5.0, 'voleo', 'activo'),
(28, (SELECT id FROM variedades_cultivo WHERE variedad='ICA V-305'), 'maiz', '2025-09-01', '2026-01-09', 15.0, 'directa', 'cosechado'),
(28, (SELECT id FROM variedades_cultivo WHERE variedad='FEDEARROZ 2000'), 'arroz', '2026-05-15', '2026-09-02', 8.0, 'trasplante', 'activo'),
(30, (SELECT id FROM variedades_cultivo WHERE variedad='Dominico Harton'), 'platano', '2026-03-01', '2027-03-01', 3.0, 'directa', 'activo'),
(31, (SELECT id FROM variedades_cultivo WHERE variedad='ICA Negrita'), 'yuca', '2026-04-15', '2027-02-08', 5.0, 'directa', 'activo'),
(31, (SELECT id FROM variedades_cultivo WHERE variedad='Pioneer 30F35'), 'maiz', '2026-05-15', '2026-09-12', 8.0, 'directa', 'activo'),
(28, (SELECT id FROM variedades_cultivo WHERE variedad='Panicum maximum'), 'pasto', '2026-02-01', '2026-03-08', 5.0, 'voleo', 'cosechado');

-- ============================================================
-- COSECHAS - Hacienda El Porvenir (15+)
-- ============================================================
INSERT IGNORE INTO cosechas (siembra_id, lote_id, fecha, cantidad_kg, calidad, metodo, destino) VALUES
-- Maiz cosecha lote 28 (siembra de sep 2025)
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='maiz' AND fecha_siembra='2025-09-01' LIMIT 1), 28, '2026-01-12', 55000, 'A', 'mecanizada', 'almacen'),
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='maiz' AND fecha_siembra='2025-09-01' LIMIT 1), 28, '2026-01-14', 28000, 'B', 'mecanizada', 'venta'),
-- Pasto Brachiaria lote 27 (siembra ago 2025)
((SELECT id FROM siembras WHERE lote_id=27 AND cultivo='pasto' LIMIT 1), 27, '2025-09-12', 350000, 'A', 'mecanizada', 'alimentacion'),
((SELECT id FROM siembras WHERE lote_id=27 AND cultivo='pasto' LIMIT 1), 27, '2025-09-18', 275000, 'B', 'mecanizada', 'alimentacion'),
-- Pasto Panicum lote 28 (siembra feb 2026)
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='pasto' AND fecha_siembra='2026-02-01' LIMIT 1), 28, '2026-03-10', 85000, 'A', 'mecanizada', 'alimentacion'),
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='pasto' AND fecha_siembra='2026-02-01' LIMIT 1), 28, '2026-03-18', 72000, 'A', 'mecanizada', 'alimentacion'),
-- Pasto Brachiaria lote 30 (siembra abr 2026)
((SELECT id FROM siembras WHERE lote_id=30 AND cultivo='pasto' AND fecha_siembra='2026-04-01' LIMIT 1), 30, '2026-05-08', 220000, 'A', 'mecanizada', 'alimentacion'),
-- Yuca - cosecha anticipada para muestra
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='yuca' LIMIT 1), 28, '2026-04-20', 1500, 'A', 'manual', 'venta'),
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='yuca' LIMIT 1), 28, '2026-05-05', 1200, 'B', 'manual', 'procesamiento'),
-- Maiz cosecha lote 30
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='maiz' AND fecha_siembra='2026-02-01' LIMIT 1), 28, '2026-06-08', 60000, 'A', 'mecanizada', 'almacen'),
-- Pasto Panicum lote 30 (mayo 2026)
((SELECT id FROM siembras WHERE lote_id=30 AND cultivo='pasto' AND fecha_siembra='2026-05-01' LIMIT 1), 30, '2026-06-07', 180000, 'A', 'mecanizada', 'alimentacion'),
-- Arroz (estimado futuro)
((SELECT id FROM siembras WHERE lote_id=28 AND cultivo='arroz' LIMIT 1), 28, '2026-09-05', 32000, 'A', 'mecanizada', 'venta');

-- ============================================================
-- COSTOS - Hacienda El Porvenir (40+)
-- ============================================================
INSERT IGNORE INTO costos (categoria_id, finca_id, fecha, descripcion, monto, medio_pago) VALUES
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-01-05', 'Concentrado bovinos engorde enero 500 kg', 1850000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-01-10', 'Concentrado bufalinos lactancia 300 kg', 1080000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-01-15', 'Sal mineralizada bovinos 100 kg', 220000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-02-05', 'Concentrado ceba porcinos 400 kg', 1120000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-02-12', 'Concentrado bovinos febrero 500 kg', 1850000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-02-18', 'Sal mineralizada bufalinos 50 kg', 125000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-03-05', 'Concentrado bovinos marzo 600 kg', 2220000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-03-12', 'Concentrado bufalinos lactancia 350 kg', 1260000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-03-20', 'Alimento porcinos 500 kg', 1400000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-04-05', 'Concentrado bovinos abril 600 kg', 2220000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-04-10', 'Sal mineralizada y suplementos varios', 340000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-04-18', 'Concentrado porcinos 400 kg', 1120000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-03-01', 'Vacuna aftosa 25 dosis', 375000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-03-15', 'Ivermectina 1% y desparasitantes', 180000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-04-01', 'Antibioticos y vitaminas', 320000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-04-12', 'Vacuna encefalitis equina 2 dosis', 80000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-01-10', 'Urea 46% maiz lote El Tesoro', 1850000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-01-25', 'Fertilizante 15-15-15 maiz y pastos', 3200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-02-15', 'Cal dolomita correccion pH', 890000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-03-10', 'Fertilizante foliar maiz', 520000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-04-05', 'Urea y KCl maiz y pastos', 2100000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-01-20', 'Semilla maiz Sintético Caribe 400 kg', 2800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-04-10', 'Semilla pasto Brachiaria 200 kg', 600000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-04-15', 'Semilla arroz Fedearroz 2000 150 kg', 1200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-05-01', 'Semilla ajonjoli Sesamo Regional 10 kg', 250000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-01-31', 'Nomina enero 5 operarios', 5200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-02-28', 'Nomina febrero 5 operarios', 5200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-03-31', 'Nomina marzo 6 operarios', 6500000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-04-30', 'Nomina abril 6 operarios', 6500000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-01-25', 'ACPM tractor enero', 720000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-02-22', 'ACPM tractor febrero', 680000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-03-25', 'ACPM tractor y motobombas marzo', 810000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-04-20', 'ACPM y gasolina abril', 750000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-01-20', 'Mantenimiento preventivo tractor', 980000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-02-18', 'Reparacion sistema riego lote La Esperanza', 1250000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-03-15', 'Mantenimiento cercas potreros', 560000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-04-12', 'Mantenimiento motobomba y compuertas', 420000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 2, '2026-01-18', 'Flete transporte concentrados', 450000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 2, '2026-03-20', 'Transporte leche a planta enfriamiento', 520000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 2, '2026-04-15', 'Flete insumos y fertilizantes', 380000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 2, '2026-01-12', 'Energia electrica bombeo enero', 350000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 2, '2026-02-12', 'Energia electrica bombeo febrero', 380000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 2, '2026-03-12', 'Energia electrica bombeo marzo', 365000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 2, '2026-04-12', 'Energia electrica bombeo abril', 390000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 2, '2026-01-22', 'Honorarios veterinario enero', 350000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 2, '2026-02-19', 'Honorarios veterinario febrero', 350000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 2, '2026-03-22', 'Honorarios veterinario marzo', 350000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 2, '2026-04-20', 'Honorarios veterinario abril', 350000, 'efectivo');

-- ============================================================
-- VENTAS - Hacienda El Porvenir (20+)
-- ============================================================
INSERT IGNORE INTO ventas (producto_id, finca_id, fecha, cliente, cantidad, precio_unitario, total, medio_pago, observaciones) VALUES
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 2, '2026-01-15', 'Cooperativa Lechera del Magdalena', 250, 2300, 575000, 'transferencia', 'Leche de bufala enero'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 2, '2026-02-12', 'Cooperativa Lechera del Magdalena', 240, 2300, 552000, 'transferencia', 'Leche de bufala febrero'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 2, '2026-03-12', 'Cooperativa Lechera del Magdalena', 260, 2400, 624000, 'transferencia', 'Leche de bufala marzo'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 2, '2026-04-10', 'Cooperativa Lechera del Magdalena', 245, 2400, 588000, 'transferencia', 'Leche de bufala abril'),
((SELECT id FROM productos WHERE tipo='leche' LIMIT 1), 2, '2026-05-08', 'Cooperativa Lechera del Magdalena', 255, 2500, 637500, 'transferencia', 'Leche de bufala mayo'),
((SELECT id FROM productos WHERE nombre='Maiz grano' AND tipo='grano' LIMIT 1), 2, '2026-01-25', 'Comercializadora Agrícola del Magdalena', 45000, 1950, 87750000, 'transferencia', 'Maiz cosecha lote El Tesoro'),
((SELECT id FROM productos WHERE nombre='Maiz grano' AND tipo='grano' LIMIT 1), 2, '2026-06-15', 'Comercializadora Agrícola del Magdalena', 55000, 2000, 110000000, 'transferencia', 'Maiz cosecha principal'),
((SELECT id FROM productos WHERE nombre LIKE 'Carne%' LIMIT 1), 2, '2026-02-28', 'Frigorífico del Caribe S.A.S.', 350, 14000, 4900000, 'transferencia', 'Novillo gordo Brahman'),
((SELECT id FROM productos WHERE nombre LIKE 'Carne%' LIMIT 1), 2, '2026-04-15', 'Frigorífico del Caribe S.A.S.', 420, 13500, 5670000, 'transferencia', 'Dos novillos gordos'),
((SELECT id FROM productos WHERE nombre LIKE 'Queso%campesino%' OR nombre='Queso campesino' LIMIT 1), 2, '2026-01-20', 'Central Abastos Ciénaga', 30, 18000, 540000, 'efectivo', 'Queso campesino de bufala'),
((SELECT id FROM productos WHERE nombre LIKE 'Queso%campesino%' OR nombre='Queso campesino' LIMIT 1), 2, '2026-03-15', 'Central Abastos Ciénaga', 35, 18000, 630000, 'transferencia', 'Queso campesino'),
((SELECT id FROM productos WHERE nombre='Cerdo en Pie' LIMIT 1), 2, '2026-03-20', 'Frigorífico del Caribe S.A.S.', 320, 7000, 2240000, 'transferencia', 'Cerdos cebados'),
((SELECT id FROM productos WHERE nombre='Cerdo en Pie' LIMIT 1), 2, '2026-04-25', 'Frigorífico del Caribe S.A.S.', 350, 7000, 2450000, 'transferencia', 'Cerdos cebados'),
((SELECT id FROM productos WHERE nombre LIKE 'Huevo%Mesa%' OR nombre='Huevo de Mesa' LIMIT 1), 2, '2026-02-10', 'Tienda La Campesina', 800, 450, 360000, 'efectivo', 'Huevos de granja'),
((SELECT id FROM productos WHERE nombre LIKE 'Huevo%Mesa%' OR nombre='Huevo de Mesa' LIMIT 1), 2, '2026-04-08', 'Tienda La Campesina', 900, 460, 414000, 'efectivo', 'Huevos de granja'),
((SELECT id FROM productos WHERE nombre LIKE 'Miel%' LIMIT 1), 2, '2026-03-25', 'Maria Fernanda Perez', 25, 25000, 625000, 'efectivo', 'Miel de abeja cosecha'),
((SELECT id FROM productos WHERE nombre LIKE 'Miel%' LIMIT 1), 2, '2026-05-10', 'Tienda Naturista El Campo', 30, 25000, 750000, 'transferencia', 'Miel de abeja pura'),
((SELECT id FROM productos WHERE nombre LIKE 'Yuca%' LIMIT 1), 2, '2026-04-28', 'Central Abastos Ciénaga', 1500, 1200, 1800000, 'efectivo', 'Yuca industrial'),
((SELECT id FROM productos WHERE nombre LIKE 'Plátano%' OR nombre='Platano verde' LIMIT 1), 2, '2026-04-20', 'Central Abastos Ciénaga', 800, 1500, 1200000, 'efectivo', 'Platano hartón'),
((SELECT id FROM productos WHERE nombre LIKE 'Abono%' LIMIT 1), 2, '2026-03-10', 'Vivero La Esperanza', 2000, 800, 1600000, 'efectivo', 'Abono organico compostado');

-- ============================================================
-- INSUMOS STOCK - Hacienda El Porvenir (15+)
-- ============================================================
INSERT IGNORE INTO inventario (insumo_id, cantidad, costo_unitario, fecha_ingreso, ubicacion, proveedor_id) VALUES
(1, 1000, 1850, '2026-01-15', 'Bodega principal HEP', 1),
(2, 600, 2100, '2026-01-15', 'Bodega principal HEP', 1),
(3, 500, 2800, '2026-02-20', 'Bodega principal HEP', 4),
(4, 30, 45000, '2026-02-15', 'Bodega agroquimicos HEP', 1),
(5, 15, 38000, '2026-01-15', 'Bodega agroquimicos HEP', 1),
(6, 40, 22000, '2026-03-01', 'Bodega agroquimicos HEP', 1),
(7, 200, 6500, '2026-01-20', 'Bodega semillas HEP', 3),
(8, 2000, 3700, '2026-01-10', 'Bodega alimentos HEP', 5),
(9, 3, 42000, '2026-03-10', 'Farmacia veterinaria HEP', 2),
(10, 2000, 350, '2026-03-10', 'Farmacia veterinaria HEP', 2),
(11, 1200, 2250, '2026-03-15', 'Bodega principal HEP', 4),
(12, 2000, 350, '2026-02-10', 'Bodega principal HEP', 4),
(16, 300, 7000, '2026-01-20', 'Bodega semillas HEP', 3),
(17, 150, 3000, '2026-04-10', 'Bodega semillas HEP', 3),
(18, 200, 2200, '2026-02-10', 'Bodega alimentos HEP', 5),
(19, 50, 15000, '2026-03-01', 'Farmacia veterinaria HEP', 2);

-- ============================================================
-- PERSONAL - Hacienda El Porvenir (8+)
-- ============================================================
INSERT IGNORE INTO personal (tipo_documento, numero_documento, nombre, apellido, fecha_nacimiento, telefono, cargo, tipo_contrato, fecha_ingreso, salario_base, eps, arl, fondo_pension, activo) VALUES
('CC', '11111111', 'Andrés', 'López García', '1984-07-15', '3105001111', 'administrador', 'indefinido', '2020-03-01', 2800000, 'Nueva EPS', 'Positiva', 'Porvenir', 1),
('CC', '22222222', 'María', 'Fernández Rojas', '1991-02-28', '3205112222', 'ordenador', 'fijo', '2022-06-01', 1500000, 'Sanitas', 'ARL Sura', 'Colfondos', 1),
('CC', '33333333', 'José', 'Ramírez Torres', '1986-09-12', '3005223333', 'vaquero', 'indefinido', '2019-08-15', 1500000, 'Compensar', 'Positiva', 'Protección', 1),
('CC', '44444444', 'Pedro', 'Martínez Díaz', '1988-11-20', '3105334444', 'operario_campo', 'fijo', '2021-04-01', 1300000, 'Sura EPS', 'ARL Sura', 'Porvenir', 1),
('CC', '55555555', 'Luis', 'Gómez Silva', '1992-05-18', '3155445555', 'conductor', 'fijo', '2022-01-15', 1500000, 'Famisanar', 'Seguros Bolívar', 'Colfondos', 1),
('CC', '66666666', 'Carlos', 'Mendoza Rivera', '1983-03-22', '3005556666', 'operario_campo', 'fijo', '2021-07-01', 1300000, 'Nueva EPS', 'Positiva', 'Protección', 1),
('CC', '77777777', 'Andrés', 'Mejía Castillo', '1980-12-05', '3155667777', 'veterinario', 'prestacion_servicios', '2023-01-15', 2500000, 'Sura EPS', 'Seguros Bolívar', 'Porvenir', 1),
('CC', '88888888', 'Rosa', 'Ortiz Mendoza', '1994-08-14', '3115778888', 'tecnico', 'fijo', '2023-09-01', 1400000, 'Sanitas', 'ARL Sura', 'Colfondos', 1);

-- ============================================================
-- PLAN ACTIVIDADES - Hacienda El Porvenir (20+)
-- ============================================================
INSERT IGNORE INTO plan_actividades (finca_id, lote_id, tipo_actividad, titulo, descripcion, fecha_programada, duracion_estimada, responsable, prioridad, estado) VALUES
(2, 27, 'vacunacion', 'Vacunacion carbon sintomatico - La Gloria', 'Vacuna contra mancha a todo el hato bovino', '2026-06-20', 4, 'Dr. Andrés Mejía', 'alta', 'programado'),
(2, 27, 'vacunacion', 'Vacunacion IBR - La Gloria', 'Vacuna rinotraqueitis infecciosa bovina', '2026-07-15', 3, 'Dr. Andrés Mejía', 'alta', 'programado'),
(2, 29, 'vacunacion', 'Vacunacion aftosa ciclo II - Las Flores', 'Vacunacion semestral aftosa potrero Las Flores', '2026-08-06', 4, 'Dr. Andrés Mejía', 'alta', 'programado'),
(2, 27, 'desparasitacion', 'Desparasitacion trimestral - La Gloria', 'Desparasitacion de todo el hato', '2026-06-16', 3, 'Dr. Andrés Mejía', 'media', 'programado'),
(2, 29, 'desparasitacion', 'Desparasitacion trimestral - Las Flores', 'Desparasitacion hato Las Flores', '2026-07-14', 3, 'Dr. Andrés Mejía', 'media', 'programado'),
(2, 28, 'desparasitacion', 'Desparasitacion trimestral - El Tesoro', 'Desparasitacion animales lote El Tesoro', '2026-08-25', 3, 'Dr. Andrés Mejía', 'media', 'programado'),
(2, 27, 'pesaje', 'Pesaje mensual junio - La Gloria', 'Pesaje de control mensual', '2026-06-02', 5, 'Andrés López', 'media', 'programado'),
(2, 27, 'pesaje', 'Pesaje mensual julio - La Gloria', 'Pesaje mensual', '2026-07-01', 5, 'Andrés López', 'media', 'programado'),
(2, 27, 'pesaje', 'Pesaje mensual agosto - La Gloria', 'Pesaje mensual', '2026-08-03', 5, 'Andrés López', 'media', 'programado'),
(2, 29, 'rotacion', 'Rotacion Las Flores a La Esperanza', 'Rotacion de pastoreo programada', '2026-06-05', 3, 'Andrés López', 'baja', 'programado'),
(2, 30, 'rotacion', 'Rotacion La Esperanza a La Gloria', 'Rotacion de bovinos a potrero principal', '2026-07-10', 3, 'Andrés López', 'baja', 'programado'),
(2, 31, 'rotacion', 'Rotacion El Bosque a Las Flores', 'Rotacion de invierno', '2026-08-12', 3, 'Andrés López', 'baja', 'programado'),
(2, 28, 'fertilizacion', 'Fertilizacion maiz El Tesoro (dia 30)', 'Aplicacion urea 46% maiz', '2026-03-02', 5, 'Andrés López', 'alta', 'completado'),
(2, 28, 'fertilizacion', 'Fertilizacion maiz El Tesoro (dia 60)', 'Aplicacion KCl y fertilizante foliar', '2026-04-02', 5, 'Andrés López', 'alta', 'completado'),
(2, 28, 'fertilizacion', 'Fertilizacion maiz El Tesoro (dia 90)', 'Ultima fertilizacion maiz', '2026-05-02', 4, 'Andrés López', 'media', 'programado'),
(2, 28, 'cosecha', 'Cosecha maiz El Tesoro', 'Cosecha mecanizada maiz Sintetico Caribe', '2026-06-06', 10, 'Andrés López', 'alta', 'programado'),
(2, 28, 'cosecha', 'Cosecha ajonjoli El Tesoro', 'Cosecha manual ajonjoli', '2026-08-05', 6, 'Andrés López', 'media', 'programado'),
(2, 30, 'fertilizacion', 'Fertilizacion pasto La Esperanza', 'Aplicacion NPK renovacion pastura', '2026-05-25', 5, 'Andrés López', 'media', 'programado'),
(2, 27, 'inseminacion', 'IA - Linda (BOV-030) post-parto', 'Inseminacion artificial', '2026-06-15', 2, 'Dr. Andrés Mejía', 'alta', 'programado'),
(2, 29, 'inseminacion', 'IA - Esperanza (BOV-035) segundo servicio', 'Inseminacion artificial', '2026-07-20', 2, 'Dr. Andrés Mejía', 'alta', 'programado'),
(2, 27, 'mantenimiento', 'Mantenimiento tractor agricola', 'Cambio aceite, filtros y revision sistema hidraulico', '2026-06-10', 6, 'Mecánico', 'alta', 'programado'),
(2, 29, 'mantenimiento', 'Mantenimiento cerca electrica Las Flores', 'Revision y reparacion cerca perimetral', '2026-07-05', 4, 'José Ramírez', 'media', 'programado'),
(2, 27, 'control_plagas', 'Control mosca en potrero La Gloria', 'Aplicacion insecticida para control de mosca', '2026-07-25', 3, 'Andrés López', 'baja', 'programado');

-- ============================================================
-- EQUIPOS - Hacienda El Porvenir (8+)
-- ============================================================
INSERT IGNORE INTO equipos (finca_id, categoria_id, codigo, nombre, marca, modelo, estado, fecha_compra, valor_compra, vida_util_anios) VALUES
(2, 1, 'EQ-HEP-001', 'Tractor Agricola', 'John Deere', '5075E', 'bueno', '2020-05-15', 220000000, 15),
(2, 4, 'EQ-HEP-002', 'Rastra de discos', 'Rome', 'RH-24', 'bueno', '2020-05-15', 18000000, 10),
(2, 4, 'EQ-HEP-003', 'Motosierra', 'Stihl', 'MS-290', 'bueno', '2022-08-01', 3200000, 5),
(2, 4, 'EQ-HEP-004', 'Guadañadora', 'Stihl', 'FS-250', 'bueno', '2023-03-10', 2200000, 5),
(2, 2, 'EQ-HEP-005', 'Bomba de agua', 'Pedrollo', 'NGAm 3-4', 'bueno', '2021-06-20', 4500000, 10),
(2, 5, 'EQ-HEP-006', 'Remolque ganadero', 'Metalcampo', 'RC-5000', 'bueno', '2019-12-01', 12000000, 12),
(2, 5, 'EQ-HEP-007', 'Camioneta', 'Toyota', 'Hilux 4x4', 'bueno', '2021-03-01', 145000000, 10),
(2, 3, 'EQ-HEP-008', 'Sistema de riego por aspersion', 'Aceituno', 'AS-200', 'bueno', '2022-02-15', 28000000, 8);

-- ============================================================
-- FUENTES DE AGUA - Hacienda El Porvenir (3+)
-- ============================================================
INSERT IGNORE INTO fuentes_agua (finca_id, nombre, tipo, caudal_lps, activo) VALUES
(2, 'Arroyo La Florida', 'rio', 80.0, TRUE),
(2, 'Pozo Profundo - Lote El Tesoro', 'pozo', 20.0, TRUE),
(2, 'Nacimiento Natural - Lote El Bosque', 'nacimiento', 5.0, TRUE),
(2, 'Jaguey - Potrero Las Flores', 'otro', 4.0, TRUE);

-- ============================================================
-- CALIDAD DE AGUA - Hacienda El Porvenir
-- ============================================================
INSERT IGNORE INTO calidad_agua (fuente_id, fecha, ph, turbiedad_ntu, coliformes, conductividad, observaciones) VALUES
((SELECT id FROM fuentes_agua WHERE nombre='Arroyo La Florida' AND finca_id=2), '2026-03-15', 7.2, 3.5, 50, 120.5, 'Agua apta para consumo animal y riego'),
((SELECT id FROM fuentes_agua WHERE nombre='Pozo Profundo - Lote El Tesoro' AND finca_id=2), '2026-03-15', 6.8, 0.8, 10, 280.0, 'Agua de buena calidad, ligeramente mineralizada'),
((SELECT id FROM fuentes_agua WHERE nombre='Nacimiento Natural - Lote El Bosque' AND finca_id=2), '2026-03-16', 7.0, 1.2, 25, 95.3, 'Agua pura de nacimiento natural');

-- ============================================================
-- DIETAS - Hacienda El Porvenir (4+)
-- ============================================================
INSERT IGNORE INTO dietas (finca_id, nombre, tipo, especie, descripcion) VALUES
(2, 'Engorde bovinos - Concentrado + Pasto', 'engorde', 'bovino', 'Dieta de engorde para novillos Brahman/Guzerat con concentrado 4 kg/dia y pastoreo Brachiaria'),
(2, 'Lactancia bufalinos - Alta producción', 'lactancia', 'bufalino', 'Dieta para bufalinas en lactancia con concentrado 6 kg/dia, silo y sal mineralizada'),
(2, 'Levante porcinos - Preceba', 'levante', 'porcino', 'Alimento balanceado para cerdos en etapa de levante (30-60 kg)'),
(2, 'Mantenimiento equinos - Trabajo', 'mantenimiento', 'equino', 'Dieta de mantenimiento para caballos de trabajo con avena, pasto y suplemento mineral');

-- ============================================================
-- HIERROS DE MARCACIÓN
-- ============================================================
INSERT IGNORE INTO hierros_marcacion (finca_id, numero_registro_ica, diseno, fecha_registro, activo) VALUES
(2, 'ICA-HEP-001', 'HEP - Letras mayusculas HEP en circulo de 8cm', '2020-01-15', TRUE),
(4, 'ICA-FM-001', 'FM - Letras FM en triangulo invertido 6cm', '2021-03-20', TRUE),
(2, 'ICA-HEP-002', 'HEP2 - Numeros 01-99 en rectangulo 5x3cm', '2023-06-10', TRUE);

-- ============================================================
-- CERTIFICADOS DE TRASLADO (sample)
-- ============================================================
INSERT IGNORE INTO certificados_traslado (animal_id, destino, motivo, transportista, placa_vehiculo, fecha_salida, numero_guia, estado) VALUES
((SELECT id FROM animales WHERE codigo='BOV-017'), 'Frigorífico del Caribe - Ciénaga', 'Venta para sacrificio', 'Carlos Transportes', 'XYZ-123', '2026-03-22', 'GUI-HEP-001', 'emitido'),
((SELECT id FROM animales WHERE codigo='POR-013'), 'Finca La Rivera - Fundación', 'Venta animal vivo', 'Transportes Fundación', 'ABC-789', '2026-04-15', 'GUI-FM-001', 'emitido');
