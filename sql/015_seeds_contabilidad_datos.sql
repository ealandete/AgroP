-- ============================================================
-- AgroP - Seeds: Datos Contables y Financieros
-- Costos, Ventas, Facturas, Nómina (últimos 6 meses)
-- Fincas: Hacienda El Porvenir (id=2) y Finca Magdalena (id=4)
-- ============================================================

USE agrop;

-- ============================================================
-- 1. ASEGURAR FINCAS EXISTAN
-- ============================================================
INSERT IGNORE INTO fincas (id, nombre, direccion, ciudad, departamento, pais, area_total) VALUES
(2, 'Hacienda El Porvenir', 'Vereda La Florida, Km 3 Vía Fundación', 'Fundación', 'Magdalena', 'Colombia', 320.0),
(4, 'Finca Magdalena', 'Vereda El Progreso, Corregimiento de Riofrío', 'Zona Bananera', 'Magdalena', 'Colombia', 185.0);

-- ============================================================
-- 2. PRODUCTOS ADICIONALES (si faltan)
-- ============================================================
INSERT IGNORE INTO productos (nombre, tipo, unidad_medida, precio_ref) VALUES
('Leche Pasteurizada', 'leche', 'L', 2800),
('Yogur Natural', 'elaborado', 'L', 5000),
('Dulce de Leche', 'elaborado', 'kg', 18000),
('Miel de Abeja', 'miel', 'kg', 25000),
('Cerdo en Pie', 'carne', 'kg', 7000),
('Pollo Beneficiado', 'carne', 'kg', 9500),
('Huevo de Mesa', 'huevos', 'unidad', 450);

-- ============================================================
-- 3. CATEGORIAS FINANCIERAS ADICIONALES (si faltan)
-- ============================================================
INSERT IGNORE INTO categorias_financieras (nombre, tipo, descripcion) VALUES
('Transporte', 'gasto', 'Fletes y transporte de productos e insumos'),
('Servicios públicos', 'gasto', 'Energía, agua, internet'),
('Arrendamientos', 'gasto', 'Arrendamiento de tierras y equipos'),
('Gastos veterinarios', 'gasto', 'Honorarios veterinarios y procedimientos'),
('Venta de huevos', 'ingreso', 'Venta de huevos de mesa'),
('Venta de miel', 'ingreso', 'Venta de miel de abeja'),
('Venta de porcinos', 'ingreso', 'Venta de cerdos en pie'),
('Venta de pollos', 'ingreso', 'Venta de pollos beneficiados'),
('Venta de plátano', 'ingreso', 'Venta de plátano y derivados'),
('Venta de yuca', 'ingreso', 'Venta de yuca industrial');

-- ============================================================
-- 4. PERSONAL (si no existe)
-- ============================================================
INSERT IGNORE INTO personal (tipo_documento, numero_documento, nombre, apellido, fecha_nacimiento, telefono, cargo, tipo_contrato, fecha_ingreso, salario_base, eps, arl, fondo_pension, activo) VALUES
('CC', '12345678', 'Carlos', 'Mendoza Pérez', '1985-03-12', '3102003344', 'administrador', 'indefinido', '2020-01-15', 2800000, 'Nueva EPS', 'Seguros Bolívar', 'Porvenir', 1),
('CC', '23456789', 'María', 'García López', '1990-07-25', '3104005566', 'ordenador', 'fijo', '2021-06-01', 1600000, 'Sanitas', 'Positiva', 'Colfondos', 1),
('CC', '34567890', 'Jorge', 'Ramírez Díaz', '1988-11-05', '3205102030', 'operario_campo', 'fijo', '2022-02-15', 1450000, 'Sura EPS', 'ARL Sura', 'Protección', 1),
('CC', '45678901', 'Pedro', 'Martínez Torres', '1975-09-18', '3012345678', 'vaquero', 'indefinido', '2019-08-01', 1500000, 'Compensar', 'Positiva', 'Colfondos', 1),
('CC', '56789012', 'Luisa', 'Fernández Castro', '1995-02-28', '3105678901', 'operario_campo', 'fijo', '2023-04-01', 1300000, 'Famisanar', 'ARL Sura', 'Porvenir', 1),
('CC', '67890123', 'Andrés', 'Jiménez Morales', '1982-06-14', '3006789012', 'conductor', 'fijo', '2021-11-15', 1600000, 'Nueva EPS', 'Seguros Bolívar', 'Protección', 1),
('CC', '78901234', 'Rosa', 'Ortiz Sánchez', '1993-12-20', '3157890123', 'tecnico', 'prestacion_servicios', '2024-01-10', 2000000, 'Sanitas', 'Positiva', 'Colfondos', 1),
('CC', '89012345', 'Luis', 'Hernández Vargas', '1980-04-08', '3118901234', 'vigilante', 'indefinido', '2020-06-01', 1350000, 'Sura EPS', 'ARL Sura', 'Porvenir', 1);

-- ============================================================
-- 4b. CLIENTE ADICIONAL (para facturas)
-- ============================================================
INSERT IGNORE INTO clientes (tipo_documento, numero_documento, dv, nombre, nombre_comercial, direccion, telefono, email, regimen, responsabilidad_fiscal, actividad_economica, activo) VALUES
('NIT','901111222', '3', 'Comercializadora Agrícola del Magdalena S.A.S.', 'Comercializadora Agrícola del Magdalena', 'Km 5 Vía Ciénaga, Ciénaga, Magdalena', '6052757788', 'compras@comagromagdalena.com', 'comun', 'IVA', 'G4620 - Comercio productos agrícolas', 1);

-- ============================================================
-- 5. NÓMINA (4 registros)
-- ============================================================
INSERT INTO nominas (personal_id, periodo, dias_trabajados, horas_extras, salario_base, auxilio_transporte, bonificaciones, deducciones, total_devengado, total_deducciones, neto_pagado, estado) VALUES
(1, '2026-05-01', 30, 0, 2800000, 162000, 200000, 0, 3162000, 345000, 2817000, 'pendiente'),
(3, '2026-05-01', 30, 8, 1450000, 162000, 0, 0, 1612000, 190000, 1422000, 'pendiente'),
(4, '2026-05-01', 30, 12, 1500000, 162000, 150000, 0, 1812000, 198000, 1614000, 'pendiente'),
(6, '2026-05-01', 30, 6, 1600000, 162000, 80000, 0, 1842000, 210000, 1632000, 'pendiente');

-- ============================================================
-- 6. COSTOS (20+ registros, últimos 6 meses)
-- ============================================================

-- Hacienda El Porvenir (finca_id=2)
INSERT INTO costos (categoria_id, finca_id, fecha, descripcion, monto, medio_pago) VALUES
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2025-12-05', 'Concentrado bovinos engorde diciembre', 2800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2025-12-20', 'Sal mineralizada bufalinos 100 kg', 220000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2025-12-15', 'Vacuna aftosa y desparasitantes hato bufalino', 380000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-01-10', 'Urea 46% y DAP para maíz lote El Tesoro', 3500000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 2, '2026-01-12', 'Semilla pasto Brachiaria 500 kg', 1500000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 2, '2026-01-18', 'Flete transporte de concentrados y fertilizantes', 450000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-01-22', 'Reparación sistema de riego lote La Esperanza', 890000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-01-31', 'Nómina operarios enero', 5200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-02-05', 'ACPM tractor y motobombas febrero', 780000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-02-10', 'Concentrado bufalinos lactancia 300 kg', 1080000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-02-18', 'Mantenimiento preventivo tractor agrícola', 1250000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-02-28', 'Nómina operarios febrero', 5200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 2, '2026-03-05', 'Fertilizante 15-15-15 y cal dolomita maíz', 2800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 2, '2026-03-12', 'Antibióticos y vitaminas bovinos/bufalinos', 420000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 2, '2026-03-20', 'Transporte de leche a planta de enfriamiento marzo', 520000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-03-31', 'Nómina operarios marzo', 6500000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 2, '2026-04-02', 'ACPM tractor abril', 810000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 2, '2026-04-15', 'Concentrado bovinos 500 kg y sal mineralizada', 1650000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 2, '2026-04-20', 'Mantenimiento cercas potreros La Gloria y Las Flores', 560000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 2, '2026-04-30', 'Nómina operarios abril', 6500000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 2, '2026-05-05', 'Factura energía eléctrica bombeo pozos', 380000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 2, '2026-05-08', 'Honorarios veterinario control reproductivo bufalino', 350000, 'efectivo');

-- Finca Magdalena (finca_id=4)
INSERT INTO costos (categoria_id, finca_id, fecha, descripcion, monto, medio_pago) VALUES
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2025-12-08', 'Concentrado cerdos y aves diciembre', 1800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 4, '2025-12-15', 'Vacunas y desparasitantes especies menores', 290000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Fertilizantes'), 4, '2026-01-15', 'Fertilizante foliar y urea para pastos mejorados', 2100000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-01-31', 'Nómina enero operarios y personal mantenimiento', 3800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Combustible'), 4, '2026-02-10', 'Gasolina motosierra y guadañadora', 320000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mantenimiento'), 4, '2026-02-25', 'Mantenimiento galpones aves y porquerizas', 940000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-02-28', 'Nómina febrero', 3800000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-03-05', 'Concentrado levante cerdos 400 kg', 1400000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Transporte'), 4, '2026-03-12', 'Flete transporte huevos y pollos a mercado', 280000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Semillas'), 4, '2026-03-18', 'Semilla maíz y frijol siembra abril', 2200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-03-31', 'Nómina marzo', 4200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Servicios públicos'), 4, '2026-04-03', 'Factura agua y energía abril', 245000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Medicamentos veterinarios'), 4, '2026-04-10', 'Control sanitario aves y desparasitación porcinos', 180000, 'efectivo'),
((SELECT id FROM categorias_financieras WHERE nombre='Mano de obra'), 4, '2026-04-30', 'Nómina abril', 4200000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Alimento animal'), 4, '2026-05-03', 'Alimento para aves ponedoras 300 kg', 780000, 'transferencia'),
((SELECT id FROM categorias_financieras WHERE nombre='Gastos veterinarios'), 4, '2026-05-07', 'Honorarios veterinario atención porcinos', 200000, 'efectivo');

-- ============================================================
-- 7. VENTAS (15+ registros)
-- ============================================================

-- Hacienda El Porvenir (finca_id=2)
INSERT INTO ventas (producto_id, finca_id, fecha, cliente, cantidad, precio_unitario, total, medio_pago, observaciones) VALUES
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 2, '2025-12-10', 'Cooperativa Lechera del Magdalena', 220, 2200, 484000, 'transferencia', 'Venta leche de bufala diciembre'),
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 2, '2026-01-15', 'Cooperativa Lechera del Magdalena', 250, 2300, 575000, 'transferencia', 'Venta leche de bufala enero'),
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 2, '2026-02-12', 'Cooperativa Lechera del Magdalena', 240, 2300, 552000, 'transferencia', 'Venta leche de bufala febrero'),
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 2, '2026-03-10', 'Cooperativa Lechera del Magdalena', 260, 2400, 624000, 'transferencia', 'Venta leche de bufala marzo'),
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 2, '2026-04-08', 'Cooperativa Lechera del Magdalena', 245, 2400, 588000, 'transferencia', 'Venta leche de bufala abril'),
((SELECT id FROM productos WHERE nombre='Queso costeño' LIMIT 1), 2, '2025-12-18', 'Central de Abastos de Ciénaga', 40, 12000, 480000, 'efectivo', 'Queso costeño artesanal'),
((SELECT id FROM productos WHERE nombre='Queso campesino' LIMIT 1), 2, '2026-02-20', 'Central de Abastos de Ciénaga', 35, 18000, 630000, 'transferencia', 'Queso campesino de bufala'),
((SELECT id FROM productos WHERE nombre='Maiz grano' LIMIT 1), 2, '2026-01-25', 'Comercializadora Agrícola del Magdalena', 35000, 1900, 66500000, 'transferencia', 'Maíz cosecha lote El Tesoro'),
((SELECT id FROM productos WHERE nombre='Carne en canal bovino' LIMIT 1), 2, '2026-03-05', 'Frigorífico del Caribe S.A.S.', 410, 13500, 5535000, 'transferencia', 'Novillo gordo Brahman y Guzerat'),
((SELECT id FROM productos WHERE nombre='Miel de Abeja' LIMIT 1), 2, '2026-04-25', 'María Fernanda Pérez López', 30, 25000, 750000, 'efectivo', 'Miel de abeja cosecha abril');

-- Finca Magdalena (finca_id=4)
INSERT INTO ventas (producto_id, finca_id, fecha, cliente, cantidad, precio_unitario, total, medio_pago, observaciones) VALUES
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2025-12-05', 'Central de Abastos de Ciénaga', 1200, 450, 540000, 'efectivo', 'Huevos de gallina criolla diciembre'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-01-08', 'Central de Abastos de Ciénaga', 1500, 450, 675000, 'efectivo', 'Huevos de gallina criolla enero'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-02-06', 'Central de Abastos de Ciénaga', 1400, 460, 644000, 'efectivo', 'Huevos de gallina criolla febrero'),
((SELECT id FROM productos WHERE nombre='Huevo de Mesa' LIMIT 1), 4, '2026-03-06', 'Central de Abastos de Ciénaga', 1600, 460, 736000, 'transferencia', 'Huevos de gallina criolla marzo'),
((SELECT id FROM productos WHERE nombre='Cerdo en Pie' LIMIT 1), 4, '2026-01-20', 'Frigorífico del Caribe S.A.S.', 380, 7000, 2660000, 'transferencia', 'Cerdo cebado raza Duroc'),
((SELECT id FROM productos WHERE nombre='Pollo Beneficiado' LIMIT 1), 4, '2026-03-15', 'Carlos Arturo Mendoza', 200, 9500, 1900000, 'efectivo', 'Pollos finca beneficiados'),
((SELECT id FROM productos WHERE nombre='Pollo Beneficiado' LIMIT 1), 4, '2026-04-22', 'Carlos Arturo Mendoza', 180, 9500, 1710000, 'efectivo', 'Pollos finca beneficiados abril'),
((SELECT id FROM productos WHERE nombre='Frijol seco' LIMIT 1), 4, '2026-02-28', 'Central de Abastos de Ciénaga', 1200, 6000, 7200000, 'transferencia', 'Frijol seco cosecha lote'),
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 4, '2026-03-20', 'Cooperativa Lechera del Magdalena', 180, 2400, 432000, 'transferencia', 'Leche de vaca Finca Magdalena marzo'),
((SELECT id FROM productos WHERE nombre='Leche cruda' LIMIT 1), 4, '2026-04-17', 'Cooperativa Lechera del Magdalena', 195, 2400, 468000, 'transferencia', 'Leche de vaca Finca Magdalena abril');

-- ============================================================
-- 8. FACTURAS DE VENTA (2-3 facturas)
-- ============================================================

-- Factura 1: Venta de maíz - Hacienda El Porvenir a Comercializadora Agrícola del Magdalena
INSERT INTO factura_cabecera (cliente_id, finca_id, prefijo, numero_factura, fecha_emision, fecha_vencimiento, forma_pago, subtotal, iva_porcentaje, iva_total, retencion_fuente_porcentaje, retencion_fuente_total, total_bruto, total_impuestos, total_neto, estado)
SELECT c.id, 2, 'FHE', 1001, '2026-01-25', '2026-02-24', 'credito_30', 66500000, 19, 12635000, 2.5, 1662500, 66500000, 12635000, 77472500, 'pagada'
FROM clientes c WHERE c.nombre_comercial = 'Comercializadora Agrícola del Magdalena';

INSERT INTO factura_items (factura_id, producto_id, descripcion, cantidad, unidad_medida, precio_unitario, iva_porcentaje, iva_unitario, subtotal)
SELECT fc.id, p.id, 'Maíz grano variedad Sintético Caribe - 35 toneladas', 35000, 'kg', 1900, 19, 361, 66500000
FROM factura_cabecera fc
JOIN productos p ON p.nombre LIKE 'Maiz grano'
WHERE fc.numero_factura = 1001 AND fc.prefijo = 'FHE';

-- Factura 2: Venta de carne - Hacienda El Porvenir a Frigorífico del Caribe
INSERT INTO factura_cabecera (cliente_id, finca_id, prefijo, numero_factura, fecha_emision, fecha_vencimiento, forma_pago, subtotal, iva_porcentaje, iva_total, total_impuestos, total_neto, estado)
SELECT c.id, 2, 'FHE', 1002, '2026-03-05', '2026-03-19', 'contado', 5535000, 0, 0, 0, 5535000, 'pagada'
FROM clientes c WHERE c.nombre = 'Frigorífico del Caribe S.A.S.';

INSERT INTO factura_items (factura_id, producto_id, descripcion, cantidad, unidad_medida, precio_unitario, iva_porcentaje, iva_unitario, subtotal)
SELECT fc.id, p.id, 'Carne en canal bovino - Brahman y Guzerat - 410 kg', 410, 'kg', 13500, 0, 0, 5535000
FROM factura_cabecera fc
JOIN productos p ON p.nombre LIKE 'Carne en canal bovino'
WHERE fc.numero_factura = 1002 AND fc.prefijo = 'FHE';

-- Factura 3: Venta de huevos - Finca Magdalena a Central de Abastos
INSERT INTO factura_cabecera (cliente_id, finca_id, prefijo, numero_factura, fecha_emision, fecha_vencimiento, forma_pago, subtotal, iva_porcentaje, iva_total, total_impuestos, total_neto, estado)
SELECT c.id, 4, 'FFM', 1001, '2026-03-06', '2026-04-05', 'credito_30', 736000, 19, 139840, 139840, 875840, 'emitida'
FROM clientes c WHERE c.nombre = 'Central de Abastos de Ciénaga';

INSERT INTO factura_items (factura_id, producto_id, descripcion, cantidad, unidad_medida, precio_unitario, iva_porcentaje, iva_unitario, subtotal)
SELECT fc.id, p.id, 'Huevos de mesa gallina criolla - 1600 unidades', 1600, 'unidad', 460, 19, 87.4, 736000
FROM factura_cabecera fc
JOIN productos p ON p.nombre LIKE 'Huevo de Mesa'
WHERE fc.numero_factura = 1001 AND fc.prefijo = 'FFM';
