-- ============================================================
-- AgroP - Migración 011: Módulos Operacionales
-- Agrega: Reproducción, Lactancias, Ordeños, Pesajes,
--         Alimentación Diaria, Sanidad, Movimientos,
--         Planificación Pastoreo, Labores de Campo
-- ============================================================
USE agrop;

-- ============================================================
-- 1. REPRODUCCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS reproduccion (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    tipo_servicio       ENUM('monta_natural','inseminacion','transferencia') NOT NULL,
    toro_pajuela        VARCHAR(255),
    fecha_servicio      DATE,
    fecha_celo          DATE,
    diagnostico_id      INT NULL,
    resultado           ENUM('preñada','vacia','dudosa'),
    fecha_parto_estimada DATE,
    fecha_parto_real    DATE,
    numero_crias        INT,
    peso_promedio_cria  DECIMAL(8,2),
    observaciones       TEXT,
    usuario_id          INT NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (diagnostico_id) REFERENCES reproduccion(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_reproduccion_animal (animal_id),
    INDEX idx_reproduccion_fecha (fecha_servicio),
    INDEX idx_reproduccion_resultado (resultado)
) ENGINE=InnoDB;

-- ============================================================
-- 2. LACTANCIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS lactancias (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    reproduccion_id     INT NULL,
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE,
    dias_en_lactancia   INT,
    produccion_total_lts DECIMAL(10,2),
    promedio_diario     DECIMAL(6,2),
    pico_produccion     DECIMAL(6,2),
    dia_pico            INT,
    estado              ENUM('activa','finalizada','seca') DEFAULT 'activa',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (reproduccion_id) REFERENCES reproduccion(id),
    INDEX idx_lactancias_animal (animal_id),
    INDEX idx_lactancias_estado (estado)
) ENGINE=InnoDB;

-- ============================================================
-- 3. ORDEÑOS (Registros Diarios de Ordeño)
-- ============================================================

CREATE TABLE IF NOT EXISTS ordenos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NOT NULL,
    lactancia_id    INT NULL,
    fecha           DATE NOT NULL,
    ordeno_am       DECIMAL(5,2) COMMENT 'Litros ordeño mañana',
    ordeno_pm       DECIMAL(5,2) COMMENT 'Litros ordeño tarde',
    total_dia       DECIMAL(6,2),
    calidad         ENUM('A','B','C','descarte') DEFAULT 'A',
    celulas_somaticas INT,
    proteina_pct    DECIMAL(4,2),
    grasa_pct       DECIMAL(4,2),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (lactancia_id) REFERENCES lactancias(id),
    INDEX idx_ordenos_fecha (fecha),
    INDEX idx_ordenos_animal (animal_id)
) ENGINE=InnoDB;

-- ============================================================
-- 4. PESAJES (Seguimiento de Peso)
-- ============================================================

CREATE TABLE IF NOT EXISTS pesajes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT NOT NULL,
    fecha               DATE NOT NULL,
    peso_kg             DECIMAL(8,2) NOT NULL,
    condicion_corporal  TINYINT COMMENT 'Escala 1-5 (1=muy flaco, 5=obeso)',
    ganancia_diaria     DECIMAL(8,3) COMMENT 'kg/dia desde pesaje anterior',
    metodo              ENUM('bascula','cinta','estimado') DEFAULT 'bascula',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    INDEX idx_pesajes_animal (animal_id),
    INDEX idx_pesajes_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- 5. ALIMENTACIÓN DIARIA
-- ============================================================

CREATE TABLE IF NOT EXISTS alimentacion_diaria (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NULL,
    lote_id         INT NULL,
    dieta_id        INT NULL,
    fecha           DATE NOT NULL,
    alimento_id     INT NOT NULL,
    cantidad_kg     DECIMAL(10,2) NOT NULL,
    costo           DECIMAL(12,2),
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (dieta_id) REFERENCES dietas(id),
    FOREIGN KEY (alimento_id) REFERENCES alimentos(id),
    INDEX idx_alimentacion_diaria_fecha (fecha),
    INDEX idx_alimentacion_diaria_animal (animal_id),
    INDEX idx_alimentacion_diaria_lote (lote_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. SANIDAD (Eventos Veterinarios)
-- ============================================================

CREATE TABLE IF NOT EXISTS sanidad (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    animal_id               INT NOT NULL,
    fecha                   DATE NOT NULL,
    tipo                    ENUM('vacunacion','desparasitacion','enfermedad','tratamiento','cirugia','control','otro') NOT NULL,
    diagnostico             VARCHAR(255),
    producto_aplicado       VARCHAR(255),
    dosis                   VARCHAR(100),
    via_aplicacion          VARCHAR(50),
    veterinario             VARCHAR(150),
    costo                   DECIMAL(12,2),
    fecha_proximo_control   DATE,
    observaciones           TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    INDEX idx_sanidad_animal (animal_id),
    INDEX idx_sanidad_fecha (fecha),
    INDEX idx_sanidad_tipo (tipo)
) ENGINE=InnoDB;

-- ============================================================
-- 7. MOVIMIENTOS DE ANIMALES
-- ============================================================

CREATE TABLE IF NOT EXISTS movimientos_animales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    animal_id       INT NOT NULL,
    fecha           DATE NOT NULL,
    tipo            ENUM('entrada','salida','traslado_interno') NOT NULL,
    origen          VARCHAR(255),
    destino         VARCHAR(255),
    lote_origen_id  INT NULL,
    lote_destino_id INT NULL,
    motivo          VARCHAR(255),
    guia_ica        VARCHAR(50) COMMENT 'Número de guía ICA de movilización',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id),
    FOREIGN KEY (lote_origen_id) REFERENCES lotes(id),
    FOREIGN KEY (lote_destino_id) REFERENCES lotes(id),
    INDEX idx_movimientos_animal (animal_id),
    INDEX idx_movimientos_fecha (fecha),
    INDEX idx_movimientos_tipo (tipo)
) ENGINE=InnoDB;

-- ============================================================
-- 8. PLANIFICACIÓN DE PASTOREO
-- ============================================================

CREATE TABLE IF NOT EXISTS planificacion_pastoreo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    finca_id        INT NOT NULL,
    lote_id         INT NOT NULL,
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    numero_animales INT NOT NULL,
    carga_animal    DECIMAL(8,2) COMMENT 'Unidades de Gran Ganado por hectárea',
    estado          ENUM('planificado','activo','completado') DEFAULT 'planificado',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    INDEX idx_pastoreo_lote (lote_id),
    INDEX idx_pastoreo_estado (estado),
    INDEX idx_pastoreo_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB;

-- ============================================================
-- 9. LABORES DE CAMPO
-- ============================================================

CREATE TABLE IF NOT EXISTS labores_campo (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    lote_id             INT NOT NULL,
    siembra_id          INT NULL,
    fecha               DATE NOT NULL,
    tipo                ENUM('preparacion','siembra','fertilizacion','riego','control_plagas','cosecha','otro') NOT NULL,
    descripcion         VARCHAR(255),
    horas_trabajo       DECIMAL(6,1),
    numero_trabajadores INT,
    costo_mano_obra     DECIMAL(12,2),
    insumos_utilizados  TEXT COMMENT 'JSON o listado de insumos aplicados',
    maquinaria_id       INT NULL,
    observaciones       TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (siembra_id) REFERENCES siembras(id),
    FOREIGN KEY (maquinaria_id) REFERENCES equipos(id),
    INDEX idx_labores_lote (lote_id),
    INDEX idx_labores_fecha (fecha),
    INDEX idx_labores_tipo (tipo)
) ENGINE=InnoDB;

-- ============================================================
-- DATOS SEMILLA - Mayo 2026
-- Finca: Finca El Porvenir (id=1)
-- Animales: id 1 al 9 (bovinos, porcinos y aviar)
-- ============================================================

-- ---- Reproducción ----
INSERT INTO reproduccion (animal_id, tipo_servicio, toro_pajuela, fecha_servicio, fecha_celo, resultado, fecha_parto_estimada, numero_crias, peso_promedio_cria, observaciones, usuario_id) VALUES
-- Lucero (BOV-001): IA en febrero, diagnosticada preñada
(1, 'inseminacion', 'Pajuela Brahman Rojo #BR-456', '2026-02-10', '2026-02-09', 'preñada', '2026-11-17', NULL, NULL, 'IA con semen certificado. Celo detectado por monta.', 1),
-- Estrella (BOV-002): monta natural con Tormenta en marzo
(2, 'monta_natural', 'Tormenta (BOV-003)', '2026-03-20', '2026-03-19', 'preñada', '2026-12-25', NULL, NULL, 'Monta natural observada. Toro permaneció 48h con el lote.', 1),
-- Paloma (BOV-004): parto reciente, abril 2026
(4, 'monta_natural', 'Toro Brahman vecino', '2025-07-01', '2025-06-30', 'preñada', '2026-04-05', 1, 35.00, 'Parto normal, cría macho', 1),
-- Brisa (BOV-005): IA en enero, diagnosticada preñada
(5, 'inseminacion', 'Pajuela Angus #ANG-201', '2026-01-15', '2026-01-14', 'preñada', '2026-10-22', NULL, NULL, 'Primer servicio de esta novilla. IA por Dr. Rodríguez.', 1);

-- Actualizar la fecha de parto real de Paloma (id=3)
UPDATE reproduccion SET fecha_parto_real = '2026-04-01' WHERE id = 3;

-- Establecer autodiagnóstico para el registro de Paloma
UPDATE reproduccion SET diagnostico_id = 3 WHERE id = 3;

-- ---- Lactancias ----
INSERT INTO lactancias (animal_id, reproduccion_id, fecha_inicio, produccion_total_lts, promedio_diario, pico_produccion, dia_pico, estado) VALUES
-- Paloma (BOV-004): lactancia activa desde el parto del 1-abril
(4, 3, '2026-04-01', 580.00, 15.20, 19.00, 28, 'activa'),
-- Lucero (BOV-001): lactancia previa finalizada (quedó preñada y se secó)
(1, 1, '2025-03-01', 2850.00, 8.50, 12.00, 45, 'finalizada');

UPDATE lactancias SET fecha_fin = '2026-01-31', dias_en_lactancia = 336 WHERE id = 2;

-- ---- Ordeños (Mayo 1-8, 2026 para Paloma BOV-004) ----
INSERT INTO ordenos (animal_id, lactancia_id, fecha, ordeno_am, ordeno_pm, total_dia, calidad, celulas_somaticas, proteina_pct, grasa_pct, observaciones) VALUES
(4, 1, '2026-05-01', 7.50, 6.80, 14.30, 'A', 180, 3.25, 3.80, 'Ordeño normal'),
(4, 1, '2026-05-02', 8.00, 7.20, 15.20, 'A', 165, 3.30, 3.75, NULL),
(4, 1, '2026-05-03', 7.80, 7.00, 14.80, 'A', 190, 3.20, 3.85, NULL),
(4, 1, '2026-05-04', 8.20, 7.50, 15.70, 'B', 210, 3.15, 3.70, 'Ligero aumento de células somáticas, en observación'),
(4, 1, '2026-05-05', 7.60, 6.90, 14.50, 'A', 175, 3.28, 3.78, NULL),
(4, 1, '2026-05-06', 7.90, 7.10, 15.00, 'A', 168, 3.22, 3.82, NULL),
(4, 1, '2026-05-07', 8.10, 7.30, 15.40, 'A', 172, 3.26, 3.79, NULL),
(4, 1, '2026-05-08', 7.70, 7.00, 14.70, 'A', 185, 3.24, 3.80, NULL);

-- ---- Pesajes (Mayo 2026) ----
INSERT INTO pesajes (animal_id, fecha, peso_kg, condicion_corporal, ganancia_diaria, metodo) VALUES
-- Lucero (BOV-001): gestante, ganando peso
(1, '2026-05-03', 445.00, 4, 0.420, 'bascula'),
-- Estrella (BOV-002): gestante
(2, '2026-05-03', 398.00, 3, 0.310, 'bascula'),
-- Tormenta (BOV-003): toro reproductor
(3, '2026-05-03', 570.00, 4, 0.550, 'bascula'),
-- Paloma (BOV-004): en lactancia
(4, '2026-05-03', 435.00, 3, -0.180, 'bascula'),
-- Brisa (BOV-005): novilla gestante
(5, '2026-05-03', 335.00, 3, 0.380, 'bascula'),
-- Manchas (POR-001): cerda en crecimiento
(7, '2026-05-03', 190.00, 3, 0.450, 'bascula'),
-- Pinto (POR-002): cerdo en crecimiento
(8, '2026-05-03', 215.00, 3, 0.520, 'bascula'),
-- Segundo pesaje quincenal
(3, '2026-05-17', 577.00, 4, 0.500, 'bascula'),
(4, '2026-05-17', 432.00, 3, -0.210, 'bascula'),
(1, '2026-05-17', 451.00, 4, 0.430, 'bascula');

-- ---- Alimentación Diaria (Mayo 2026) ----
INSERT INTO alimentacion_diaria (lote_id, fecha, alimento_id, cantidad_kg, costo, observaciones) VALUES
-- Lote 3 (Potrero Norte): bovinos, ensilaje + sal mineralizada
(3, '2026-05-01', 4, 80.00, 32000.00, 'Ensilaje de maíz para bovinos Potrero Norte'),
(3, '2026-05-01', 5, 3.00, 6600.00, 'Sal mineralizada para 4 bovinos'),
(3, '2026-05-02', 4, 80.00, 32000.00, 'Ensilaje diario'),
(3, '2026-05-03', 4, 80.00, 32000.00, 'Ensilaje diario'),
(3, '2026-05-04', 4, 80.00, 32000.00, 'Ensilaje diario'),
(3, '2026-05-05', 4, 80.00, 32000.00, 'Ensilaje diario'),
(3, '2026-05-06', 4, 80.00, 32000.00, 'Ensilaje diario'),
(3, '2026-05-07', 4, 75.00, 30000.00, 'Ensilaje, ajuste por consumo'),
(3, '2026-05-08', 4, 80.00, 32000.00, 'Ensilaje diario'),
(3, '2026-05-08', 5, 3.00, 6600.00, 'Sal mineralizada semanal');

-- Alimentación individual para Paloma (lactancia, suplemento concentrado)
INSERT INTO alimentacion_diaria (animal_id, fecha, alimento_id, cantidad_kg, costo, observaciones) VALUES
(4, '2026-05-01', 1, 4.00, 7200.00, 'Concentrado lactancia, ordeño AM'),
(4, '2026-05-02', 1, 4.00, 7200.00, 'Concentrado lactancia'),
(4, '2026-05-03', 1, 4.00, 7200.00, 'Concentrado lactancia'),
(4, '2026-05-05', 1, 4.00, 7200.00, 'Concentrado lactancia'),
(4, '2026-05-06', 1, 4.00, 7200.00, 'Concentrado lactancia'),
(4, '2026-05-07', 1, 4.00, 7200.00, 'Concentrado lactancia'),
(4, '2026-05-08', 1, 4.50, 8100.00, 'Aumento de ración por producción');

-- Alimentación para cerdos (POR-001 y POR-002)
INSERT INTO alimentacion_diaria (animal_id, fecha, alimento_id, cantidad_kg, costo, observaciones) VALUES
(7, '2026-05-01', 2, 2.50, 4125.00, 'Concentrado levante, cerda Manchas'),
(8, '2026-05-01', 2, 2.80, 4620.00, 'Concentrado levante, cerdo Pinto'),
(7, '2026-05-04', 2, 2.50, 4125.00, 'Concentrado levante'),
(8, '2026-05-04', 2, 2.80, 4620.00, 'Concentrado levante'),
(7, '2026-05-07', 2, 2.50, 4125.00, 'Concentrado levante'),
(8, '2026-05-07', 2, 2.80, 4620.00, 'Concentrado levante');

-- ---- Sanidad (Mayo 2026) ----
INSERT INTO sanidad (animal_id, fecha, tipo, diagnostico, producto_aplicado, dosis, via_aplicacion, veterinario, costo, fecha_proximo_control, observaciones) VALUES
-- Vacunación aftosa semestral a todo el hato bovino
(1, '2026-05-02', 'vacunacion', 'Prevención fiebre aftosa', 'Aftobov Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Ramírez', 12000.00, '2026-11-02', 'Vacunación del ciclo I-2026 ICA'),
(2, '2026-05-02', 'vacunacion', 'Prevención fiebre aftosa', 'Aftobov Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Ramírez', 12000.00, '2026-11-02', 'Ciclo I-2026'),
(3, '2026-05-02', 'vacunacion', 'Prevención fiebre aftosa', 'Aftobov Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Ramírez', 12000.00, '2026-11-02', 'Ciclo I-2026'),
(4, '2026-05-02', 'vacunacion', 'Prevención fiebre aftosa', 'Aftobov Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Ramírez', 12000.00, '2026-11-02', 'Ciclo I-2026'),
(5, '2026-05-02', 'vacunacion', 'Prevención fiebre aftosa', 'Aftobov Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Ramírez', 12000.00, '2026-11-02', 'Ciclo I-2026'),
-- Desparasitación porcinos
(7, '2026-05-04', 'desparasitacion', 'Control parasitario de rutina', 'Ivermectina 1%', '1 mL/33 kg', 'subcutanea', 'Dr. Carlos Ramírez', 8000.00, '2026-08-04', 'Desparasitación trimestral'),
(8, '2026-05-04', 'desparasitacion', 'Control parasitario de rutina', 'Ivermectina 1%', '1 mL/33 kg', 'subcutanea', 'Dr. Carlos Ramírez', 8000.00, '2026-08-04', 'Desparasitación trimestral'),
-- Control post-parto Paloma
(4, '2026-05-05', 'control', 'Revisión post-parto', NULL, NULL, NULL, 'Dr. Carlos Ramírez', 35000.00, '2026-06-05', 'Control post-parto 30 días. Involución uterina normal.'),
-- Vacunación aviar
(9, '2026-05-06', 'vacunacion', 'Prevención Newcastle', 'Newcastle LaSota', '1 dosis', 'ocular', 'Dr. Carlos Ramírez', 5000.00, '2026-08-06', 'Vacuna gota ocular, lote aves Rhode Island');

-- ---- Movimientos de Animales (Mayo 2026) ----
INSERT INTO movimientos_animales (animal_id, fecha, tipo, origen, destino, lote_origen_id, lote_destino_id, motivo, guia_ica) VALUES
-- Rotación de pastoreo: mover algunas vacas de Potrero Norte a Potrero Sur
(2, '2026-05-06', 'traslado_interno', 'Potrero Norte', 'Potrero Sur', 3, 4, 'Rotación de potreros - Pastoreo programado', NULL),
(5, '2026-05-06', 'traslado_interno', 'Potrero Sur', 'Potrero Norte', 4, 3, 'Rotación de potreros - Agrupación con lote principal', NULL),
-- Devolución después de una semana
(2, '2026-05-13', 'traslado_interno', 'Potrero Sur', 'Potrero Norte', 4, 3, 'Fin de rotación, retorno a lote base', NULL),
(5, '2026-05-13', 'traslado_interno', 'Potrero Norte', 'Potrero Sur', 3, 4, 'Retorno a lote habitual', NULL);

-- ---- Planificación de Pastoreo (Mayo 2026) ----
INSERT INTO planificacion_pastoreo (finca_id, lote_id, fecha_inicio, fecha_fin, numero_animales, carga_animal, estado) VALUES
-- Potrero Norte: pastoreo rotacional con 4 bovinos
(1, 3, '2026-05-01', '2026-05-07', 4, 1.87, 'completado'),
(1, 4, '2026-05-06', '2026-05-12', 3, 1.60, 'activo'),
-- Siguiente rotación: Potrero Norte recibe los animales de vuelta
(1, 3, '2026-05-14', '2026-05-21', 4, 1.87, 'planificado'),
-- Lote descanso programado como reserva
(1, 5, '2026-05-22', '2026-05-30', 2, 1.11, 'planificado');

-- ---- Labores de Campo (Mayo 2026) ----
INSERT INTO labores_campo (lote_id, siembra_id, fecha, tipo, descripcion, horas_trabajo, numero_trabajadores, costo_mano_obra, insumos_utilizados, maquinaria_id, observaciones) VALUES
-- Fertilización maíz Lote 1 (siembra activa id=2)
(1, 2, '2026-05-02', 'fertilizacion', 'Aplicación de urea al maíz (45 días)', 6.0, 3, 180000.00, 'Urea 46%: 150 kg', 1, 'Fertilización con tractor y abonadora. Suelo húmedo favorable.'),
-- Control de plagas arroz Lote 2 (siembra activa id=4)
(2, 4, '2026-05-03', 'control_plagas', 'Aplicación insecticida para control de chinche', 4.5, 2, 90000.00, 'Lorsban 48EC: 2 L', 1, 'Aplicación con bomba de espalda motorizada. Presencia moderada de chinche.'),
-- Riego frijol Lote 5 (siembra activa id=5)
(5, 5, '2026-05-04', 'riego', 'Riego por aspersión en frijol', 5.0, 1, 60000.00, 'Agua de pozo profundo', NULL, 'Riego programado, humedad de suelo en 65%.'),
-- Fertilización arroz Lote 2
(2, 4, '2026-05-07', 'fertilizacion', 'Segunda aplicación KCl en arroz', 5.5, 2, 110000.00, 'Cloruro de Potasio KCl: 200 kg', 1, 'Fertilización en etapa de macollamiento.'),
-- Control de malezas Lote 5
(5, 5, '2026-05-08', 'control_plagas', 'Control manual de malezas en frijol', 8.0, 4, 140000.00, NULL, NULL, 'Deshierbe manual. Presencia de coquito y bledo.'),
-- Preparación de terreno Lote 1 (post-siembra, mantenimiento)
(1, 2, '2026-05-09', 'otro', 'Mantenimiento de drenajes en maizal', 4.0, 2, 80000.00, NULL, NULL, 'Limpieza de canales de drenaje previendo inicio de lluvias.');
