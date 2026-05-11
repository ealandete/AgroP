-- ============================================================
-- AgroP - Datos semilla
-- ============================================================

USE agrop;

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Veterinario', 'Gestión de animales y salud animal'),
('Agrónomo', 'Gestión de cultivos, siembras y cosechas'),
('Operario', 'Registro de actividades diarias'),
('Financiero', 'Gestión de costos, ingresos y ventas'),
('Invitado', 'Solo lectura de reportes');

-- Finca de prueba
INSERT INTO fincas (nombre, direccion, ciudad, departamento, latitud, longitud, area_total) VALUES
('Finca El Porvenir', 'Km 5 Vía al Llano', 'Villavicencio', 'Meta', 4.1420, -73.6266, 120.5);

-- Lotes
INSERT INTO lotes (finca_id, nombre, codigo, area_ha, tipo_suelo, uso_actual, latitud, longitud, color) VALUES
(1, 'Lote La Vega', 'L01', 15.0, 'franco', 'cultivo', 4.1420, -73.6266, '#4CAF50'),
(1, 'Lote El Alto', 'L02', 22.5, 'arcilloso', 'cultivo', 4.1435, -73.6250, '#8BC34A'),
(1, 'Potrero Norte', 'L03', 30.0, 'arenoso', 'pastoreo', 4.1450, -73.6240, '#CDDC39'),
(1, 'Potrero Sur', 'L04', 25.0, 'franco', 'pastoreo', 4.1400, -73.6280, '#FFC107'),
(1, 'Lote El Mirador', 'L05', 18.0, 'franco', 'descanso', 4.1415, -73.6275, '#FF9800'),
(1, 'Bosque Nativo', 'L06', 10.0, 'limoso', 'bosque', 4.1440, -73.6230, '#795548');

-- Análisis de suelo
INSERT INTO analisis_suelo (lote_id, fecha, ph, nitrogeno, fosforo, potasio, materia_organica, humedad, textura) VALUES
(1, '2026-01-15', 6.2, 45.5, 22.3, 180.0, 3.5, 28.0, 'franco'),
(2, '2026-01-15', 5.8, 38.0, 18.5, 210.0, 2.8, 32.0, 'arcilloso'),
(3, '2026-02-01', 6.5, 52.0, 25.0, 160.0, 4.0, 22.0, 'arenoso'),
(4, '2026-02-01', 6.3, 48.0, 20.0, 175.0, 3.7, 25.0, 'franco');

-- Razas
INSERT INTO razas (especie, nombre, proposito) VALUES
('bovino', 'Brahman', 'carne'),
('bovino', 'Holstein', 'leche'),
('bovino', 'Gyr', 'doble'),
('bovino', 'Angus', 'carne'),
('porcino', 'Landrace', 'carne'),
('porcino', 'Duroc', 'carne'),
('aviar', 'Rhode Island', 'huevos'),
('aviar', 'Broiler', 'carne'),
('ovino', 'Pelibuey', 'carne'),
('equino', 'Criollo', 'trabajo');

-- Animales de prueba
INSERT INTO animales (finca_id, lote_id, codigo, nombre, especie, raza_id, sexo, fecha_nacimiento, fecha_ingreso, peso_kg, color, activo) VALUES
(1, 3, 'BOV-001', 'Lucero', 'bovino', 1, 'H', '2020-03-15', '2020-06-01', 420.0, 'Blanco', TRUE),
(1, 3, 'BOV-002', 'Estrella', 'bovino', 3, 'H', '2019-07-20', '2019-07-20', 380.0, 'Gris', TRUE),
(1, 3, 'BOV-003', 'Tormenta', 'bovino', 1, 'M', '2021-01-10', '2021-01-10', 550.0, 'Rojo', TRUE),
(1, 3, 'BOV-004', 'Paloma', 'bovino', 2, 'H', '2018-11-05', '2018-11-05', 450.0, 'Negro-Blanco', TRUE),
(1, 4, 'BOV-005', 'Brisa', 'bovino', 4, 'H', '2022-05-12', '2022-08-01', 320.0, 'Negro', TRUE),
(1, 4, 'BOV-006', 'Gaviota', 'bovino', 3, 'H', '2020-08-20', '2020-08-20', 400.0, 'Gris', FALSE),
(1, 4, 'POR-001', 'Manchas', 'porcino', 5, 'H', '2023-02-01', '2023-02-01', 180.0, 'Blanco', TRUE),
(1, 4, 'POR-002', 'Pinto', 'porcino', 6, 'M', '2023-01-15', '2023-01-15', 200.0, 'Rojo', TRUE),
(1, 4, 'AVI-001', NULL, 'aviar', 7, 'H', '2025-06-01', '2025-06-01', 2.5, 'Marrón', TRUE);

-- Eventos de animales
INSERT INTO eventos_animales (animal_id, tipo_evento, fecha, diagnostico, descripcion, costo) VALUES
(1, 'vacunacion', '2026-01-10', NULL, 'Vacuna aftosa', 15000),
(1, 'desparasitacion', '2026-03-15', NULL, 'Ivermectina 1%', 8000),
(2, 'enfermedad', '2026-02-20', 'Mastitis leve', 'Tratamiento antibiótico 5 días', 45000),
(3, 'vacunacion', '2026-01-10', NULL, 'Vacuna aftosa', 15000),
(4, 'parto', '2026-04-01', 'Parto normal', 'Cría macho, 35kg', 0),
(6, 'muerte', '2025-12-10', 'Anaplasmosis', 'Falleció pese a tratamiento', 0),
(7, 'desparasitacion', '2026-03-01', NULL, 'Desparasitación general', 5000);

-- Variedades de cultivo
INSERT INTO variedades_cultivo (cultivo, variedad, dias_ciclo, rendimiento_ref, tolerancia) VALUES
('maiz', 'ICA V-305', 130, 5500, 'Sequía moderada'),
('maiz', 'Pioneer 30F35', 120, 6200, 'Plagas'),
('arroz', 'FEDEARROZ 2000', 110, 4800, 'Enfermedades'),
('arroz', 'FEDEARROZ 67', 105, 5200, 'Sequía'),
('frijol', 'ICA Cerinza', 90, 1800, 'Plagas'),
('cafe', 'Castillo', 730, 2500, 'Roya'),
('cafe', 'Caturra', 700, 2200, 'Media'),
('platano', 'Dominico Harton', 365, 15000, 'Sigatoka'),
('yuca', 'ICA Negrita', 300, 18000, 'Sequía');

-- Siembras
INSERT INTO siembras (lote_id, variedad_id, cultivo, fecha_siembra, fecha_cosecha_estimada, fecha_cosecha_real, area_ha, cantidad_semilla, estado, rendimiento_kg) VALUES
(1, 2, 'maiz', '2025-10-01', '2026-02-01', '2026-02-05', 8.0, 160, 'cosechado', 48000),
(1, 1, 'maiz', '2026-03-01', '2026-07-01', NULL, 10.0, 200, 'activo', NULL),
(2, 4, 'arroz', '2025-11-15', '2026-03-15', '2026-03-10', 15.0, 300, 'cosechado', 72000),
(2, 3, 'arroz', '2026-04-01', '2026-07-20', NULL, 12.0, 240, 'activo', NULL),
(5, 5, 'frijol', '2026-02-15', '2026-05-15', NULL, 5.0, 100, 'activo', NULL),
(5, 8, 'platano', '2025-01-01', '2026-01-01', '2026-01-10', 3.0, 150, 'cosechado', 42000);

-- Cosechas
INSERT INTO cosechas (siembra_id, lote_id, fecha, cantidad_kg, calidad, metodo) VALUES
(1, 1, '2026-02-05', 28000, 'A', 'mecanizada'),
(1, 1, '2026-02-07', 20000, 'B', 'mecanizada'),
(3, 2, '2026-03-10', 45000, 'A', 'mecanizada'),
(3, 2, '2026-03-12', 27000, 'B', 'mecanizada'),
(6, 5, '2026-01-10', 25000, 'A', 'manual');

-- Plagas y enfermedades
INSERT INTO plagas_enfermedades (nombre, tipo, afecta_a, cultivo_especie, sintomas, tratamiento_general, severidad) VALUES
('Gusano cogollero', 'plaga', 'cultivo', 'maiz', 'Hojas perforadas, excremento en cogollo', 'Insecticida a base de Bacillus thuringiensis', 'moderada'),
('Roya del cafeto', 'enfermedad', 'cultivo', 'cafe', 'Manchas amarillas y polvo naranja en hojas', 'Fungicida cúprico, manejo de sombra', 'severa'),
('Sigatoka negra', 'enfermedad', 'cultivo', 'platano', 'Manchas negras en hojas, reduccion de area foliar', 'Fungicida sistémico, deshoje', 'severa'),
('Mastitis bovina', 'enfermedad', 'animal', 'bovino', 'Inflamacion de ubre, leche con grumos', 'Antibiotico intramamario', 'moderada'),
('Anaplasmosis', 'enfermedad', 'animal', 'bovino', 'Fiebre, anemia, debilidad', 'Oxitetraciclina, control de garrapatas', 'severa'),
('Mosca blanca', 'plaga', 'cultivo', 'frijol', 'Hojas amarillentas, transmision de virus', 'Jabon potasico, insecticida', 'leve');

-- Categorias de insumos
INSERT INTO categorias_insumo (nombre) VALUES
('Fertilizantes'),
('Pesticidas'),
('Herbicidas'),
('Semillas'),
('Alimento animal'),
('Medicamentos veterinarios'),
('Herramientas'),
('Combustibles');

-- Insumos
INSERT INTO insumos (categoria_id, codigo, nombre, unidad_medida, stock_minimo, tipo) VALUES
(1, 'FER-001', 'Urea 46%', 'kg', 100, 'fertilizante'),
(1, 'FER-002', 'Fosfato Diamónico DAP', 'kg', 80, 'fertilizante'),
(1, 'FER-003', 'Cloruro de Potasio KCl', 'kg', 80, 'fertilizante'),
(2, 'PES-001', 'Lorsban 48EC', 'L', 5, 'pesticida'),
(2, 'PES-002', 'Bacillus thuringiensis', 'kg', 2, 'pesticida'),
(3, 'HER-001', 'Glifosato', 'L', 10, 'herbicida'),
(4, 'SEM-001', 'Semilla Maiz ICA V-305', 'kg', 50, 'semilla'),
(5, 'ALI-001', 'Concentrado Bovino Engorde', 'kg', 200, 'alimento'),
(6, 'MED-001', 'Ivermectina 1%', 'L', 10, 'medicamento'),
(6, 'MED-002', 'Oxitetraciclina LA', 'mL', 500, 'medicamento');

-- Proveedores
INSERT INTO proveedores (nombre, nit, contacto, telefono, categoria) VALUES
('Agroinsumos del Llano S.A.', '800123456-7', 'Carlos Perez', '3101234567', 'insumos'),
('Distribuidora Veterinaria LaSabana', '900765432-1', 'Ana Lopez', '3159876543', 'medicamentos'),
('Semillas Certificadas S.A.S.', '901234567-8', 'Juan Ruiz', '3204567890', 'semillas'),
('Cooperativa Lactea Regional', '800987654-3', 'Maria Torres', '3112345678', 'servicios');

-- Productos
INSERT INTO productos (nombre, tipo, unidad_medida, precio_ref) VALUES
('Leche cruda', 'leche', 'L', 2500),
('Carne en canal bovino', 'carne', 'kg', 14000),
('Queso campesino', 'queso', 'kg', 18000),
('Maiz grano', 'grano', 'kg', 2000),
('Arroz paddy', 'grano', 'kg', 1800),
('Frijol seco', 'grano', 'kg', 6000),
('Huevos', 'huevos', 'unidad', 800),
('Platano verde', 'fruta', 'kg', 1500);

-- Produccion
INSERT INTO produccion (producto_id, finca_id, fecha, cantidad) VALUES
(1, 1, '2026-01-15', 450.0),
(1, 1, '2026-02-15', 420.0),
(1, 1, '2026-03-15', 380.0),
(1, 1, '2026-04-15', 400.0),
(4, 1, '2026-02-10', 48000.0),
(5, 1, '2026-03-15', 72000.0),
(8, 1, '2026-01-15', 25000.0);

-- Categorias financieras
INSERT INTO categorias_financieras (nombre, tipo) VALUES
('Venta de leche', 'ingreso'),
('Venta de carne', 'ingreso'),
('Venta de granos', 'ingreso'),
('Venta de frutas', 'ingreso'),
('Subsidio gubernamental', 'ingreso'),
('Fertilizantes', 'gasto'),
('Medicamentos veterinarios', 'gasto'),
('Alimento animal', 'gasto'),
('Mano de obra', 'gasto'),
('Combustible', 'gasto'),
('Mantenimiento', 'gasto'),
('Semillas', 'gasto');

-- Costos de ejemplo
INSERT INTO costos (categoria_id, finca_id, fecha, descripcion, monto) VALUES
(6, 1, '2026-01-10', 'Compra urea y DAP para siembra maiz', 2500000),
(6, 1, '2026-02-05', 'Fertilizante KCl lote arroz', 1800000),
(7, 1, '2026-01-15', 'Ivermectina y vacunas bovinos', 450000),
(8, 1, '2026-01-20', 'Concentrado bovinos enero', 3200000),
(8, 1, '2026-02-20', 'Concentrado bovinos febrero', 3100000),
(9, 1, '2026-01-31', 'Nomina enero operarios', 4800000),
(9, 1, '2026-02-28', 'Nomina febrero operarios', 4800000),
(10, 1, '2026-01-25', 'ACPM tractor', 850000),
(10, 1, '2026-02-25', 'ACPM tractor', 780000),
(12, 1, '2026-03-01', 'Semilla maiz ICA V-305', 1200000);

-- Ingresos de ejemplo
INSERT INTO ventas (producto_id, finca_id, fecha, cliente, cantidad, precio_unitario, total) VALUES
(1, 1, '2026-01-31', 'Cooperativa Lactea', 450, 2500, 1125000),
(1, 1, '2026-02-28', 'Cooperativa Lactea', 420, 2500, 1050000),
(1, 1, '2026-03-31', 'Cooperativa Lactea', 380, 2500, 950000),
(1, 1, '2026-04-30', 'Cooperativa Lactea', 400, 2500, 1000000),
(4, 1, '2026-02-15', 'Comercializadora Granos', 45000, 2000, 90000000),
(5, 1, '2026-03-20', 'Molino Arroz Regional', 70000, 1800, 126000000),
(8, 1, '2026-01-20', 'Central Abastos', 24000, 1500, 36000000);

-- Usuario admin por defecto (password: admin123)
-- Hash bcrypt generado con: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('admin123'))"
INSERT INTO usuarios (email, password_hash, nombre, apellido, rol_id) VALUES
('admin@agrop.local', '$2b$12$LJ3m4ys3LkNCVqvLZJ/IOuS7dHrQOJxWyNhi9RMLYxFIADHcNPh96', 'Emilio', 'Administrador', 1);

-- Parametros del sistema
INSERT INTO parametros (clave, valor, tipo, descripcion) VALUES
('nombre_sistema', 'AgroP', 'string', 'Nombre del sistema'),
('version', '1.0.0', 'string', 'Version actual'),
('moneda', 'COP', 'string', 'Moneda por defecto'),
('idioma', 'es', 'string', 'Idioma'),
('um_peso', 'kg', 'string', 'Unidad de medida de peso'),
('um_area', 'ha', 'string', 'Unidad de medida de area'),
('alertas_ph_min', '5.5', 'float', 'Alerta de pH minimo'),
('alertas_ph_max', '7.5', 'float', 'Alerta de pH maximo'),
('dias_vencimiento_insumos', '30', 'int', 'Dias para alertar vencimiento');
