-- ============================================================
-- AgroP - Fix seeds: Finca Magdalena operational data
-- Uses actual lot IDs (7-26) and finca ID (4)
-- ============================================================
USE agrop;

-- Fix plaguicidas ENUM issue
ALTER TABLE parametros_ica_plaguicidas MODIFY tipo VARCHAR(60);

-- Reload plaguicidas
DELETE FROM parametros_ica_plaguicidas;
INSERT INTO parametros_ica_plaguicidas (ingrediente_activo, tipo, categoria_toxicologica, cultivo_principal, dosis_referencia, periodo_carencia) VALUES
('Glifosato','Herbicida','III','Arroz, Maiz, Pastos, Cafe, Palma','1.5-4.0 L/ha',7),
('Paraquat','Herbicida','II','Papa, Arroz, Algodon','1.0-2.0 L/ha',0),
('2,4-D','Herbicida','II','Arroz, Cana de azucar, Potreros','0.5-2.0 L/ha',7),
('Atrazina','Herbicida','III','Maiz, Sorgo','2.0-4.0 L/ha',30),
('Clorpirifos','Insecticida','II','Arroz, Maiz, Algodon','0.5-2.0 L/ha',21),
('Metamidofos','Insecticida','Ib','Arroz, Papa, Algodon','0.3-1.0 L/ha',7),
('Fipronil','Insecticida','II','Arroz, Pastos, Papa','0.2-0.5 L/ha',14),
('Imidacloprid','Insecticida','II','Arroz, Cafe, Citricos','0.2-0.5 L/ha',14),
('Tiametoxam','Insecticida','III','Arroz, Papa, Tomate','0.1-0.3 kg/ha',7),
('Lambda-Cialotrina','Insecticida','II','Algodon, Arroz, Maiz','0.15-0.5 L/ha',15),
('Abamectina','Insecticida-Acaricida','Ib','Citricos, Tomate','0.3-0.6 L/ha',14),
('Mancozeb','Fungicida','III','Papa, Tomate, Arroz','1.0-2.5 kg/ha',7),
('Propiconazol','Fungicida','II','Arroz, Cafe, Banano','0.3-0.5 L/ha',14),
('Tebuconazol','Fungicida','II','Arroz, Cafe, Soja','0.3-0.5 L/ha',14),
('Azoxistrobina','Fungicida','III','Arroz, Banano, Cafe','0.2-0.4 L/ha',14),
('Clorotalonil','Fungicida','II','Banano, Papa, Tomate','1.0-3.0 L/ha',14),
('Difenoconazol','Fungicida','II','Arroz, Papa, Cafe','0.3-0.5 L/ha',14),
('Carbendazim','Fungicida','III','Arroz, Frutales, Papa','0.3-0.5 L/ha',30),
('Metalaxil','Fungicida','III','Papa, Tomate, Tabaco','0.5-1.0 kg/ha',7);

-- ============================================================
-- Create siembras for Finca Magdalena lots
-- ============================================================
INSERT INTO siembras (lote_id, cultivo, fecha_siembra, fecha_cosecha_estimada, area_ha, metodo_siembra, estado) VALUES
(11, 'maiz', '2026-04-01', '2026-08-01', 2.13, 'directa', 'activo'),
(12, 'arroz', '2026-04-15', '2026-08-15', 2.08, 'directa', 'activo'),
(13, 'frijol', '2026-05-01', '2026-07-30', 2.06, 'directa', 'activo'),
(16, 'maiz', '2026-05-01', '2026-09-01', 2.04, 'directa', 'activo'),
(20, 'arroz', '2026-04-20', '2026-08-20', 2.38, 'trasplante', 'activo');

-- ============================================================
-- Reproduccion data (animal IDs 1-9 exist)
-- ============================================================
ALTER TABLE lactancias ADD COLUMN IF NOT EXISTS reproduccion_id INT AFTER animal_id;

INSERT INTO reproduccion (animal_id, tipo_servicio, fecha_servicio, resultado, fecha_parto_estimada, fecha_parto_real, numero_crias, usuario_id) VALUES
(1, 'monta_natural', '2024-11-15', 'preñada', '2025-08-25', '2025-08-28', 1, 1),
(2, 'inseminacion', '2024-09-01', 'preñada', '2025-07-05', '2025-07-03', 1, 1),
(4, 'monta_natural', '2025-06-10', 'preñada', '2026-04-01', '2026-04-01', 1, 1),
(4, 'inseminacion', '2026-05-05', 'preñada', '2027-02-05', NULL, NULL, 1);

-- ============================================================
-- Lactancias
-- ============================================================
INSERT INTO lactancias (animal_id, parto_id, fecha_inicio, produccion_total_l, produccion_promedio_diaria, pico_produccion_l, dia_pico_produccion, estado) VALUES
(4, 3, '2026-04-01', 580.00, 15.20, 19.00, 28, 'activa'),
(1, 1, '2025-08-28', 2850.00, 8.50, 12.00, 45, 'finalizada');

-- ============================================================
-- Ordeños (daily milk for animal 4, lactancia 1)
-- ============================================================
INSERT INTO ordenos (animal_id, lactancia_id, fecha, ordeno_am, ordeno_pm, total_dia, calidad, celulas_somaticas, proteina_pct, grasa_pct) VALUES
(4, 1, '2026-05-01', 7.50, 6.80, 14.30, 'A', 180, 3.25, 3.80),
(4, 1, '2026-05-02', 8.00, 7.20, 15.20, 'A', 165, 3.30, 3.75),
(4, 1, '2026-05-03', 7.80, 7.00, 14.80, 'A', 190, 3.20, 3.85),
(4, 1, '2026-05-04', 8.20, 7.50, 15.70, 'B', 210, 3.15, 3.70),
(4, 1, '2026-05-05', 7.60, 6.90, 14.50, 'A', 175, 3.28, 3.78),
(4, 1, '2026-05-06', 7.90, 7.10, 15.00, 'A', 168, 3.22, 3.82),
(4, 1, '2026-05-07', 8.10, 7.30, 15.40, 'A', 172, 3.26, 3.79),
(4, 1, '2026-05-08', 7.70, 7.00, 14.70, 'A', 185, 3.24, 3.80);

-- ============================================================
-- Pesajes (weight tracking for animals 1-8)
-- ============================================================
INSERT INTO pesajes (animal_id, fecha, peso_kg, condicion_corporal, ganancia_diaria, metodo) VALUES
(1, '2026-05-03', 445.00, 4, 0.420, 'bascula'),
(2, '2026-05-03', 398.00, 3, 0.310, 'bascula'),
(3, '2026-05-03', 570.00, 4, 0.550, 'bascula'),
(4, '2026-05-03', 435.00, 3, -0.180, 'bascula'),
(5, '2026-05-03', 335.00, 3, 0.380, 'bascula'),
(7, '2026-05-03', 190.00, 3, 0.450, 'bascula'),
(8, '2026-05-03', 215.00, 3, 0.520, 'bascula'),
(3, '2026-05-17', 577.00, 4, 0.500, 'bascula'),
(4, '2026-05-17', 432.00, 3, -0.210, 'bascula'),
(1, '2026-05-17', 451.00, 4, 0.430, 'bascula');

-- ============================================================
-- Alimentacion diaria (use lot IDs 7-26 from Finca Magdalena)
-- Lote 9 = Potrero Norte equivalent; Lote 10 = Potrero Sur equivalent
-- ============================================================
INSERT INTO alimentacion_diaria (lote_id, fecha, alimento_id, cantidad_kg, costo) VALUES
(9, '2026-05-01', 4, 80.00, 32000.00),
(9, '2026-05-01', 5, 3.00, 6600.00),
(9, '2026-05-02', 4, 80.00, 32000.00),
(9, '2026-05-03', 4, 80.00, 32000.00),
(9, '2026-05-04', 4, 80.00, 32000.00),
(9, '2026-05-05', 4, 80.00, 32000.00),
(9, '2026-05-06', 4, 80.00, 32000.00),
(9, '2026-05-07', 4, 75.00, 30000.00),
(9, '2026-05-08', 4, 80.00, 32000.00),
(9, '2026-05-08', 5, 3.00, 6600.00);

-- ============================================================
-- Sanidad (health events for animals 1-9)
-- ============================================================
INSERT INTO sanidad (animal_id, fecha, tipo, diagnostico, producto_aplicado, dosis, via_aplicacion, veterinario, costo, fecha_proximo_control) VALUES
(1, '2026-05-01', 'vacunacion', 'Prevencion aftosa', 'Vacuna Aftosa Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Mendez', 15000, '2026-11-01'),
(2, '2026-05-01', 'vacunacion', 'Prevencion aftosa', 'Vacuna Aftosa Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Mendez', 15000, '2026-11-01'),
(3, '2026-05-01', 'vacunacion', 'Prevencion aftosa', 'Vacuna Aftosa Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Mendez', 15000, '2026-11-01'),
(4, '2026-05-01', 'vacunacion', 'Prevencion aftosa', 'Vacuna Aftosa Oleosa', '5 mL', 'subcutanea', 'Dr. Carlos Mendez', 15000, '2026-11-01'),
(4, '2026-05-05', 'tratamiento', 'Mastitis subclinica leve', 'Cefalexina intramamaria', '200 mg por cuarto', 'intramamaria', 'Dr. Carlos Mendez', 45000, '2026-05-12'),
(5, '2026-05-02', 'desparasitacion', 'Control parasitario', 'Ivermectina 1%', '1 mL/50 kg', 'subcutanea', 'Dr. Carlos Mendez', 8000, '2026-08-02'),
(7, '2026-05-02', 'desparasitacion', 'Control parasitario', 'Ivermectina 1%', '1 mL/33 kg', 'subcutanea', 'Dr. Carlos Mendez', 5000, '2026-08-02'),
(8, '2026-05-02', 'desparasitacion', 'Control parasitario', 'Ivermectina 1%', '1 mL/33 kg', 'subcutanea', 'Dr. Carlos Mendez', 5000, '2026-08-02'),
(1, '2026-05-15', 'control', 'Control post-parto. Involucion uterina normal.', NULL, NULL, NULL, 'Dr. Carlos Mendez', 25000, NULL);

-- ============================================================
-- Movimientos animales (lote IDs from Finca Magdalena)
-- ============================================================
INSERT INTO movimientos_animales (animal_id, fecha, tipo, origen, destino, lote_origen_id, lote_destino_id, motivo) VALUES
(2, '2026-05-06', 'traslado_interno', 'Poligono 9', 'Poligono 10', 9, 10, 'Rotacion de pastoreo'),
(5, '2026-05-06', 'traslado_interno', 'Poligono 10', 'Poligono 9', 10, 9, 'Rotacion de pastoreo'),
(2, '2026-05-13', 'traslado_interno', 'Poligono 10', 'Poligono 9', 10, 9, 'Fin de rotacion, retorno'),
(5, '2026-05-13', 'traslado_interno', 'Poligono 9', 'Poligono 10', 9, 10, 'Retorno a lote habitual');

-- ============================================================
-- Planificacion pastoreo (finca_id = 4)
-- ============================================================
INSERT INTO planificacion_pastoreo (finca_id, lote_id, fecha_inicio, fecha_fin, numero_animales, carga_animal, estado) VALUES
(4, 9, '2026-05-01', '2026-05-07', 4, 1.87, 'completado'),
(4, 10, '2026-05-06', '2026-05-12', 3, 1.60, 'activo'),
(4, 9, '2026-05-14', '2026-05-21', 4, 1.87, 'planificado'),
(4, 14, '2026-05-22', '2026-05-30', 2, 1.11, 'planificado');

-- ============================================================
-- Labores de campo
-- ============================================================
INSERT INTO labores_campo (lote_id, fecha, tipo, descripcion, horas_trabajo, numero_trabajadores, costo_mano_obra, insumos_utilizados, maquinaria_id) VALUES
(11, '2026-05-02', 'fertilizacion', 'Aplicacion de urea al maiz', 6.0, 3, 180000.00, 'Urea 46%: 150 kg', 1),
(12, '2026-05-03', 'control_plagas', 'Control de chinche en arroz', 4.5, 2, 90000.00, 'Lorsban 48EC: 2 L', 1),
(13, '2026-05-04', 'riego', 'Riego por aspersion en frijol', 5.0, 1, 60000.00, 'Agua de pozo profundo', NULL),
(12, '2026-05-07', 'fertilizacion', 'Aplicacion KCl en arroz', 5.5, 2, 110000.00, 'Cloruro de Potasio KCl: 200 kg', 1),
(13, '2026-05-08', 'control_plagas', 'Deshierbe manual en frijol', 8.0, 4, 140000.00, NULL, NULL),
(11, '2026-05-09', 'otro', 'Mantenimiento de drenajes', 4.0, 2, 80000.00, NULL, NULL);

-- ============================================================
-- Update lotes terreno data for the new lots
-- ============================================================
UPDATE lotes SET altitud_msnm = 40, pendiente_pct = 2.0, exposicion = 'plano', sistema_riego = 'secano', fuente_agua = 'Rio Magdalena', caudal_lps = 50.0 WHERE id IN (7,8,9,10);
UPDATE lotes SET altitud_msnm = 35, pendiente_pct = 1.5, exposicion = 'plano', sistema_riego = 'aspersion', fuente_agua = 'Pozo Profundo', caudal_lps = 15.0 WHERE id IN (11,12,13,14,15,16);
UPDATE lotes SET altitud_msnm = 42, pendiente_pct = 3.0, exposicion = 'norte', sistema_riego = 'goteo', fuente_agua = 'Rio Magdalena', caudal_lps = 30.0 WHERE id IN (17,18,19,20,21,22);
