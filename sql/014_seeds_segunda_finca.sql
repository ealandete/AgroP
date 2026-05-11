-- ============================================================
-- AgroP - Datos semilla: Segunda Finca
-- Finca: Hacienda El Porvenir (Fundación, Magdalena)
-- ============================================================

USE agrop;

-- ============================================================
-- 1. FINCA
-- ============================================================
INSERT IGNORE INTO fincas (id, nombre, direccion, ciudad, departamento, pais, latitud, longitud, area_total) VALUES
(2, 'Hacienda El Porvenir', 'Vereda La Florida, Km 3 Vía Fundación', 'Fundación', 'Magdalena', 'Colombia', 10.5200, -74.1850, 320.0);

-- ============================================================
-- 2. LOTES con GeoJSON polygon coordinates
-- ============================================================
INSERT IGNORE INTO lotes (id, finca_id, nombre, codigo, area_ha, tipo_suelo, uso_actual, latitud, longitud, coordenadas, color, altitud_msnm, pendiente_pct, exposicion, sistema_riego, fuente_agua) VALUES
(27, 2, 'Potrero La Gloria', 'HEP-01', 45.0, 'franco', 'pastoreo', 10.5215, -74.1835,
  '{"type":"Polygon","coordinates":[[[10.5200,-74.1850],[10.5230,-74.1850],[10.5230,-74.1820],[10.5200,-74.1820],[10.5200,-74.1850]]]}',
  '#4CAF50', 30, 1.5, 'plano', 'secano', 'Arroyo La Florida'),
(28, 2, 'Lote El Tesoro', 'HEP-02', 35.0, 'arcilloso', 'cultivo', 10.5240, -74.1800,
  '{"type":"Polygon","coordinates":[[[10.5230,-74.1820],[10.5270,-74.1820],[10.5270,-74.1780],[10.5230,-74.1780],[10.5230,-74.1820]]]}',
  '#8BC34A', 28, 2.0, 'loma', 'aspersion', 'Pozo profundo'),
(29, 2, 'Potrero Las Flores', 'HEP-03', 50.0, 'arenoso', 'pastoreo', 10.5170, -74.1890,
  '{"type":"Polygon","coordinates":[[[10.5150,-74.1910],[10.5200,-74.1910],[10.5200,-74.1870],[10.5150,-74.1870],[10.5150,-74.1910]]]}',
  '#FFC107', 25, 1.0, 'plano', 'secano', 'Arroyo La Florida'),
(30, 2, 'Lote La Esperanza', 'HEP-04', 30.0, 'franco', 'cultivo', 10.5270, -74.1890,
  '{"type":"Polygon","coordinates":[[[10.5245,-74.1910],[10.5295,-74.1910],[10.5295,-74.1870],[10.5245,-74.1870],[10.5245,-74.1910]]]}',
  '#FF9800', 32, 3.0, 'norte', 'goteo', 'Pozo profundo'),
(31, 2, 'Lote El Bosque', 'HEP-05', 20.0, 'limoso', 'bosque', 10.5130, -74.1940,
  '{"type":"Polygon","coordinates":[[[10.5110,-74.1960],[10.5160,-74.1960],[10.5160,-74.1920],[10.5110,-74.1920],[10.5110,-74.1960]]]}',
  '#795548', 35, 5.0, 'occidente', NULL, 'Nacimiento natural');

-- ============================================================
-- 3. ANÁLISIS DE SUELO
-- ============================================================
INSERT IGNORE INTO analisis_suelo (lote_id, fecha, ph, nitrogeno, fosforo, potasio, materia_organica, humedad, textura, profundidad_cm, observaciones) VALUES
(27, '2026-03-10', 6.0, 42.0, 19.5, 165.0, 3.2, 26.0, 'franco', 30, 'Suelo apto para pastoreo, fertilidad media'),
(28, '2026-03-10', 5.6, 35.0, 15.0, 195.0, 2.5, 30.0, 'arcilloso', 40, 'Requiere enmienda calcárea, alto contenido de arcilla'),
(29, '2026-03-11', 6.8, 48.0, 22.0, 145.0, 3.8, 20.0, 'arenoso', 25, 'Buen drenaje, baja retencion de humedad'),
(30, '2026-03-11', 6.3, 45.0, 20.0, 170.0, 3.5, 24.0, 'franco', 35, 'Suelo equilibrado, apto para cultivos');

-- ============================================================
-- 4. RAZAS (bufalino y adicionales para esta finca)
-- ============================================================
INSERT IGNORE INTO razas (especie, nombre, proposito) VALUES
('bufalino', 'Murrah', 'leche'),
('bufalino', 'Mediterráneo', 'doble'),
('bufalino', 'Jafarabadi', 'carne'),
('bovino', 'Guzerat', 'carne'),
('bovino', 'Romosinuano', 'carne');

-- ============================================================
-- 5. ANIMALES (mezcla bovino y bufalino, con chapeta y estados_origen)
-- ============================================================
INSERT IGNORE INTO animales (finca_id, lote_id, codigo, nombre, especie, raza_id, sexo, fecha_nacimiento, fecha_ingreso, peso_kg, color, numero_chapeta, tiene_chapeta, estado_origen, marcas_hierro, activo) VALUES
-- Bovinos en Potrero La Gloria (lote 27)
(2, 27, 'BOV-010', 'Reina', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'H', '2019-05-10', '2019-05-10', 480.0, 'Blanco', 'CH-001', TRUE, 'propio', 'HEP', TRUE),
(2, 27, 'BOV-011', 'Sultana', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Gyr'), 'H', '2020-08-15', '2020-08-15', 450.0, 'Gris', NULL, FALSE, 'propio', 'HEP', TRUE),
(2, 27, 'BOV-012', 'Rey', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Guzerat'), 'M', '2021-03-20', '2021-03-20', 620.0, 'Rojo', 'CH-002', TRUE, 'propio', 'HEP', TRUE),
(2, 27, 'BOV-013', 'Estrella', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'H', '2022-01-05', '2022-04-01', 350.0, 'Blanco', NULL, FALSE, 'propio', 'HEP', TRUE),
(2, 27, 'BOV-014', 'Lucero', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Romosinuano'), 'M', '2023-06-12', '2023-06-12', 280.0, 'Cafe', 'CH-003', TRUE, 'propio', 'HEP', TRUE),
-- Bovinos en Potrero Las Flores (lote 29)
(2, 29, 'BOV-015', 'Paloma', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Gyr'), 'H', '2018-11-30', '2018-11-30', 510.0, 'Gris', NULL, FALSE, 'propio', 'HEP', TRUE),
(2, 29, 'BOV-016', 'Candela', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'H', '2020-04-18', '2020-04-18', 490.0, 'Negro', 'CH-004', TRUE, 'propio', 'HEP', TRUE),
(2, 29, 'BOV-017', 'Tormento', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Guzerat'), 'M', '2022-09-01', '2022-09-01', 580.0, 'Rojo', NULL, FALSE, 'prestamo', 'FDL', TRUE),
(2, 29, 'BOV-018', 'Clavel', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Romosinuano'), 'H', '2023-12-20', '2024-02-01', 240.0, 'Cafe', 'CH-005', TRUE, 'propio', 'HEP', TRUE),

-- Bufalinos en Potrero La Gloria (lote 27) y Potrero Las Flores (lote 29)
(2, 27, 'BUF-001', 'Mora', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2020-02-14', '2020-02-14', 520.0, 'Negro', 'CH-006', TRUE, 'propio', 'HEP', TRUE),
(2, 27, 'BUF-002', 'Perla', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2021-07-08', '2021-07-08', 480.0, 'Negro', NULL, FALSE, 'propio', 'HEP', TRUE),
(2, 29, 'BUF-003', 'Titan', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Jafarabadi'), 'M', '2019-11-25', '2019-11-25', 750.0, 'Negro', 'CH-007', TRUE, 'propio', 'HEP', TRUE),
(2, 29, 'BUF-004', 'Luna', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Mediterráneo'), 'H', '2022-05-30', '2022-05-30', 440.0, 'Gris', NULL, FALSE, 'adopcion', NULL, TRUE),
(2, 29, 'BUF-005', 'Sombra', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'H', '2023-03-10', '2023-03-10', 350.0, 'Negro', 'CH-008', TRUE, 'propio', 'HEP', TRUE),
(2, 27, 'BUF-006', 'Brisa', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Mediterráneo'), 'H', '2024-01-15', '2024-01-15', 200.0, 'Gris', NULL, FALSE, 'propio', 'HEP', TRUE),

-- Algunos juveniles en ambos potreros
(2, 27, 'BOV-019', 'Ternero HEP-01', 'bovino', (SELECT id FROM razas WHERE especie='bovino' AND nombre='Brahman'), 'M', '2025-10-05', '2025-10-05', 120.0, 'Blanco', NULL, FALSE, 'propio', NULL, TRUE),
(2, 29, 'BUF-007', 'Bufalito HEP-01', 'bufalino', (SELECT id FROM razas WHERE especie='bufalino' AND nombre='Murrah'), 'M', '2025-09-12', '2025-09-12', 150.0, 'Negro', NULL, FALSE, 'propio', NULL, TRUE);

-- ============================================================
-- 6. EVENTOS DE ANIMALES (salud)
-- ============================================================
INSERT IGNORE INTO eventos_animales (animal_id, tipo_evento, fecha, diagnostico, descripcion, medicamento_id, dosis, veterinario, costo, observaciones) VALUES
-- Bovinos
((SELECT id FROM animales WHERE codigo='BOV-010'), 'vacunacion', '2026-03-01', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BOV-011'), 'vacunacion', '2026-03-01', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BOV-012'), 'vacunacion', '2026-03-01', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BOV-015'), 'vacunacion', '2026-03-01', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BOV-016'), 'desparasitacion', '2026-03-15', NULL, 'Ivermectina 1% control parasitario', NULL, '1 mL/50 kg', 'Dr. Andrés Mejía', 12000, 'Aplicación subcutánea, pesó 490 kg'),
((SELECT id FROM animales WHERE codigo='BOV-013'), 'desparasitacion', '2026-03-15', NULL, 'Ivermectina 1% control parasitario', NULL, '1 mL/50 kg', 'Dr. Andrés Mejía', 8000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BOV-015'), 'enfermedad', '2026-04-10', 'Mastitis clínica', 'Tratamiento antibiótico intramamario 3 días', NULL, '200 mg/cuarto', 'Dr. Andrés Mejía', 65000, 'Cuarto posterior derecho afectado, respuesta positiva'),
((SELECT id FROM animales WHERE codigo='BOV-010'), 'parto', '2026-04-20', 'Parto normal', 'Cría hembra Brahman, 32 kg', NULL, NULL, 'Dr. Andrés Mejía', 0, 'Parto sin complicaciones, cría en buen estado'),
-- Bufalinos
((SELECT id FROM animales WHERE codigo='BUF-001'), 'vacunacion', '2026-03-02', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BUF-003'), 'vacunacion', '2026-03-02', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BUF-002'), 'desparasitacion', '2026-03-15', NULL, 'Ivermectina 1% control parasitario', NULL, '1 mL/50 kg', 'Dr. Andrés Mejía', 10000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BUF-004'), 'enfermedad', '2026-03-20', 'Pododermatitis leve', 'Pediluvio con sulfato de zinc y cura local', NULL, 'N/A', 'Dr. Andrés Mejía', 35000, 'Cojea del miembro posterior izquierdo, hernia de pezuña'),
((SELECT id FROM animales WHERE codigo='BUF-005'), 'vacunacion', '2026-03-02', NULL, 'Vacuna aftosa ciclo I-2026', NULL, '5 mL', 'Dr. Andrés Mejía', 15000, 'Aplicación subcutánea'),
((SELECT id FROM animales WHERE codigo='BUF-001'), 'parto', '2026-05-02', 'Parto normal', 'Cría macho Murrah, 38 kg', NULL, NULL, 'Dr. Andrés Mejía', 0, 'Parto en potrero, vigía exitoso');

-- ============================================================
-- 7. VARIEDADES DE CULTIVO (adicionales para zona Caribe)
-- ============================================================
INSERT IGNORE INTO variedades_cultivo (cultivo, variedad, dias_ciclo, rendimiento_ref, tolerancia) VALUES
('maiz', 'Sintético Caribe', 125, 5000, 'Sequía, altas temperaturas'),
('pasto', 'Brachiaria decumbens', 45, 25000, 'Sequía, suelos ácidos'),
('pasto', 'Panicum maximum', 35, 30000, 'Sequía, pisoteo'),
('yuca', 'ICA Costeña', 330, 22000, 'Sequía prolongada'),
('ajoni', 'Sésamo Regional', 95, 1200, 'Sequía');

-- ============================================================
-- 8. SIEMBRAS
-- ============================================================
INSERT IGNORE INTO siembras (lote_id, variedad_id, cultivo, fecha_siembra, fecha_cosecha_estimada, fecha_cosecha_real, area_ha, cantidad_semilla, metodo_siembra, estado, rendimiento_kg, rendimiento_ha) VALUES
-- Siembras en Lote El Tesoro (lote 28)
(28, (SELECT id FROM variedades_cultivo WHERE variedad='Sintético Caribe'), 'maiz', '2026-02-01', '2026-06-05', NULL, 20.0, 400, 'directa', 'activo', NULL, NULL),
(28, (SELECT id FROM variedades_cultivo WHERE variedad='ICA Costeña'), 'yuca', '2026-01-15', '2026-12-10', NULL, 10.0, 20000, 'directa', 'activo', NULL, NULL),
-- Siembras en Lote La Esperanza (lote 30)
(30, (SELECT id FROM variedades_cultivo WHERE variedad='Brachiaria decumbens'), 'pasto', '2025-09-15', '2025-10-30', '2025-10-28', 15.0, 300, 'voleo', 'cosechado', 375000, 25000),
(30, (SELECT id FROM variedades_cultivo WHERE variedad='Panicum maximum'), 'pasto', '2026-04-01', '2026-05-06', NULL, 12.0, 250, 'voleo', 'activo', NULL, NULL),
-- Siembras en Potrero La Gloria (lote 27) - pasto mejorado
(27, (SELECT id FROM variedades_cultivo WHERE variedad='Brachiaria decumbens'), 'pasto', '2025-08-01', '2025-09-15', '2025-09-10', 25.0, 500, 'voleo', 'cosechado', 625000, 25000);
-- Siembra de ajoni (sésamo) en Lote El Tesoro
INSERT IGNORE INTO siembras (lote_id, variedad_id, cultivo, fecha_siembra, fecha_cosecha_estimada, area_ha, cantidad_semilla, metodo_siembra, estado) VALUES
(28, (SELECT id FROM variedades_cultivo WHERE variedad='Sésamo Regional'), 'ajoni', '2026-05-01', '2026-08-03', 5.0, 10, 'voleo', 'activo');

-- ============================================================
-- 9. COSECHAS
-- ============================================================
INSERT IGNORE INTO cosechas (siembra_id, lote_id, fecha, cantidad_kg, calidad, metodo) VALUES
((SELECT MIN(s.id) FROM siembras s JOIN variedades_cultivo v ON s.variedad_id = v.id WHERE s.lote_id = 30 AND v.variedad = 'Brachiaria decumbens' AND v.cultivo = 'pasto'),
 30, '2025-10-28', 200000, 'A', 'mecanizada'),
((SELECT MIN(s.id) FROM siembras s JOIN variedades_cultivo v ON s.variedad_id = v.id WHERE s.lote_id = 30 AND v.variedad = 'Brachiaria decumbens' AND v.cultivo = 'pasto'),
 30, '2025-10-30', 175000, 'B', 'mecanizada'),
((SELECT MIN(s.id) FROM siembras s JOIN variedades_cultivo v ON s.variedad_id = v.id WHERE s.lote_id = 27 AND v.variedad = 'Brachiaria decumbens' AND v.cultivo = 'pasto'),
 27, '2025-09-10', 350000, 'A', 'mecanizada'),
((SELECT MIN(s.id) FROM siembras s JOIN variedades_cultivo v ON s.variedad_id = v.id WHERE s.lote_id = 27 AND v.variedad = 'Brachiaria decumbens' AND v.cultivo = 'pasto'),
 27, '2025-09-12', 275000, 'B', 'mecanizada');

-- ============================================================
-- 10. INSUMOS (adicionales regionales)
-- ============================================================
INSERT IGNORE INTO insumos (categoria_id, codigo, nombre, unidad_medida, stock_minimo, tipo) VALUES
(1, 'FER-004', 'Fertilizante 15-15-15 NPK', 'kg', 200, 'fertilizante'),
(1, 'FER-005', 'Cal dolomita', 'kg', 500, 'fertilizante'),
(2, 'PES-003', 'Cipermetrina 20%', 'L', 5, 'pesticida'),
(2, 'PES-004', 'Carbaryl 85%', 'kg', 10, 'pesticida'),
(3, 'HER-002', 'Paraquat', 'L', 8, 'herbicida'),
(4, 'SEM-002', 'Semilla Maiz Sintético Caribe', 'kg', 100, 'semilla'),
(4, 'SEM-003', 'Semilla Pasto Brachiaria', 'kg', 50, 'semilla'),
(5, 'ALI-002', 'Sal mineralizada bufalinos', 'kg', 100, 'alimento'),
(6, 'MED-003', 'Vacuna Aftosa Oleosa', 'dosis', 50, 'medicamento'),
(6, 'MED-004', 'Antibiótico intramamario', 'jeringa', 20, 'medicamento'),
(6, 'MED-005', 'Complejo vitamínico ADE', 'L', 5, 'medicamento');

-- ============================================================
-- 11. PROVEEDORES (región Caribe)
-- ============================================================
INSERT IGNORE INTO proveedores (nombre, nit, contacto, telefono, email, ciudad, categoria) VALUES
('Agropecuaria del Caribe S.A.S.', '802345678-9', 'Pedro Martínez', '3205001234', 'pedro@agrocaribe.com', 'Santa Marta', 'insumos'),
('Distribuidora Bufalina del Norte', '901876543-2', 'Laura Jiménez', '3156789012', 'laura@bufalinanorte.com', 'Fundación', 'medicamentos'),
('Semillas del Trópico S.A.S.', '900123987-6', 'Alberto Castro', '3045678901', 'alberto@semitropico.com', 'Ciénaga', 'semillas'),
('Fertilizantes de la Costa Ltda.', '800111222-3', 'Rosa Mendoza', '3123456789', 'ventas@ferticosta.com', 'Barranquilla', 'insumos'),
('Alimentos Balanceados del Magdalena', '901345678-0', 'Jorge Peñaranda', '3107890123', 'jorge@alibalma.com', 'Fundación', 'insumos');

-- ============================================================
-- 12. PRODUCCIÓN (leche y queso de bufalina)
-- ============================================================
INSERT IGNORE INTO produccion (producto_id, finca_id, fecha, cantidad, animal_id, observaciones) VALUES
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-01', 85.0, (SELECT id FROM animales WHERE codigo='BUF-001'), 'Leche de bufala Murrah'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-08', 82.0, (SELECT id FROM animales WHERE codigo='BUF-001'), 'Leche de bufala Murrah'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-15', 88.0, (SELECT id FROM animales WHERE codigo='BUF-001'), 'Leche de bufala Murrah'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-22', 80.0, (SELECT id FROM animales WHERE codigo='BUF-001'), 'Leche de bufala Murrah'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-01', 60.0, (SELECT id FROM animales WHERE codigo='BUF-002'), 'Leche de bufala Murrah Perla'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-15', 65.0, (SELECT id FROM animales WHERE codigo='BUF-002'), 'Leche de bufala Murrah Perla'),
((SELECT id FROM productos WHERE nombre='Queso costeño'), 2, '2026-04-10', 25.0, NULL, 'Queso artesanal de leche de bufala'),
((SELECT id FROM productos WHERE nombre='Queso costeño'), 2, '2026-04-20', 30.0, NULL, 'Queso artesanal de leche de bufala'),
((SELECT id FROM productos WHERE nombre='Maiz grano'), 2, '2026-04-15', 48000.0, NULL, 'Maíz Sintético Caribe cosechado'),
((SELECT id FROM productos WHERE nombre='Carne en canal bovino'), 2, '2026-03-20', 320.0, NULL, 'Novillo gordo Brahman');

-- ============================================================
-- 13. CATEGORIAS FINANCIERAS (adicionales para esta finca)
-- ============================================================
INSERT IGNORE INTO categorias_financieras (nombre, tipo, descripcion) VALUES
('Venta de leche bufalina', 'ingreso', 'Venta de leche de búfala'),
('Venta de quesos bufalinos', 'ingreso', 'Queso artesanal de leche de búfala'),
('Venta de búfalos', 'ingreso', 'Venta de animales bufalinos'),
('Servicio de pastoreo', 'ingreso', 'Arrendamiento de potreros'),
('Fertilizantes foliares', 'gasto', 'Fertilización foliar'),
('Sales minerales', 'gasto', 'Minerales para bovinos y bufalinos'),
('Empaque y etiquetado', 'gasto', 'Materiales de empaque'),
('Transporte de leche', 'gasto', 'Flete y transporte de productos lácteos');

-- ============================================================
-- 14. COSTOS (finca_id = 2)
-- ============================================================
INSERT IGNORE INTO costos (categoria_id, finca_id, fecha, descripcion, monto, lote_id, medio_pago) VALUES
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-02-05', 'Fertilizante 15-15-15 para maíz lote El Tesoro', 3200000, 28, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-03-01', 'Urea 46% para maíz', 1850000, 28, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes foliares'), 2, '2026-03-15', 'Fertilizante foliar Stage + microelementos', 890000, 30, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-03-01', 'Vacuna aftosa ciclo I-2026 - 10 animales', 150000, NULL, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-03-15', 'Ivermectina 1% y antibiótico intramamario', 245000, NULL, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-03-20', 'Atención veterinaria pododermatitis bufalina', 35000, 29, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Sales minerales'), 2, '2026-02-10', 'Sal mineralizada bovinos 50 kg', 110000, 27, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Sales minerales'), 2, '2026-02-10', 'Sal mineralizada bufalinos 50 kg', 125000, 29, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-02-15', 'Concentrado bovino engorde 200 kg', 640000, 27, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-03-10', 'Concentrado bufalinos lactancia 150 kg', 540000, 29, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-01-20', 'Semilla maíz Sintético Caribe 400 kg', 2800000, 28, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-01-20', 'Semilla pasto Brachiaria 300 kg', 900000, 30, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-01-31', 'Nómina enero - 4 operarios', 5200000, NULL, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-02-28', 'Nómina febrero - 4 operarios', 5200000, NULL, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-03-31', 'Nómina marzo - 5 operarios', 6500000, NULL, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-03-05', 'Mantenimiento tractor y rastra', 980000, NULL, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-01-25', 'ACPM tractor enero', 720000, NULL, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-02-25', 'ACPM tractor febrero', 680000, NULL, 'efectivo');

-- ============================================================
-- 15. VENTAS (finca_id = 2)
-- ============================================================
INSERT IGNORE INTO ventas (producto_id, finca_id, fecha, cliente, cantidad, precio_unitario, total, medio_pago, observaciones) VALUES
-- Venta de leche de bufala
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-01', 'Quesera Artesanal El Molino', 85.0, 3200, 272000, 'efectivo', 'Leche de bufala Murrah'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-08', 'Quesera Artesanal El Molino', 82.0, 3200, 262400, 'transferencia', 'Leche de bufala'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-15', 'Quesera Artesanal El Molino', 88.0, 3200, 281600, 'transferencia', 'Leche de bufala'),
((SELECT id FROM productos WHERE nombre='Leche cruda'), 2, '2026-04-22', 'Quesera Artesanal El Molino', 80.0, 3200, 256000, 'efectivo', 'Leche de bufala'),
-- Venta de queso costeño
((SELECT id FROM productos WHERE nombre='Queso costeño'), 2, '2026-04-12', 'Tienda La Campesina', 25.0, 12000, 300000, 'efectivo', 'Queso costeño de bufala'),
((SELECT id FROM productos WHERE nombre='Queso costeño'), 2, '2026-04-22', 'Tienda La Campesina', 30.0, 12000, 360000, 'efectivo', 'Queso costeño de bufala'),
-- Venta de maíz
((SELECT id FROM productos WHERE nombre='Maiz grano'), 2, '2026-04-18', 'Comercializadora Agrícola del Magdalena', 46000, 2000, 92000000, 'transferencia', 'Cosecha maíz Sintético Caribe lote El Tesoro'),
-- Venta de carne bovina
((SELECT id FROM productos WHERE nombre='Carne en canal bovino'), 2, '2026-03-22', 'Frigorífico del Magdalena', 320, 14000, 4480000, 'transferencia', 'Novillo gordo Brahman');

-- ============================================================
-- 16. PLAN DE CUENTAS (adicionales específicos para finca)
-- ============================================================
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('111015', 'Banco Agrario - Fundación', 4, 'activo', 'debito', 1),
('130545', 'Bufalinos', 4, 'activo', 'debito', 1),
('131040', 'Cultivos de Pastos', 4, 'activo', 'debito', 1),
('144005', 'Bufalinos Reproductores', 4, 'activo', 'debito', 1),
('410540', 'Venta de Leche de Búfala', 4, 'ingreso', 'credito', 1),
('410545', 'Venta de Queso de Búfala', 4, 'ingreso', 'credito', 1),
('410550', 'Venta de Búfalos', 4, 'ingreso', 'credito', 1),
('411015', 'Venta de Pastos', 4, 'ingreso', 'credito', 1),
('512030', 'Fertilizantes Foliares', 4, 'gasto', 'debito', 1),
('512035', 'Sales Minerales', 4, 'gasto', 'debito', 1),
('513006', 'Fletes y Transporte Leche', 4, 'gasto', 'debito', 1),
('515006', 'Empaque y Etiquetado', 4, 'gasto', 'debito', 1),
('610515', 'Costo Producción Bufalinos', 3, 'costo', 'debito', 1),
('6230', 'Costo Producción Pastos', 3, 'costo', 'debito', 1);

-- ============================================================
-- 17. PARÁMETROS DEL SISTEMA (adicionales)
-- ============================================================
INSERT IGNORE INTO parametros (clave, valor, tipo, descripcion) VALUES
('finca_activa_id', '2', 'int', 'ID de la finca activa por defecto'),
('precio_leche_bufala_cop', '3200', 'float', 'Precio de referencia leche de bufala por litro'),
('dias_pastoreo_rotacional', '7', 'int', 'Días por potrero en pastoreo rotacional');
