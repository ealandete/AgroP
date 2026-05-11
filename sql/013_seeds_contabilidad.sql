-- ============================================================
-- AgroP - Seeds: PUC (Plan Único de Cuentas) adaptado sector agro
-- ============================================================

-- Clase 1: ACTIVO
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('1','ACTIVO',1,'activo','debito',1),
('11','EFECTIVO Y EQUIVALENTES',2,'activo','debito',1),
('1105','Caja',3,'activo','debito',1),
('1110','Bancos',3,'activo','debito',1),
('111005','Banco Agrario - Cta Ahorros',4,'activo','debito',1),
('111010','Bancolombia - Cta Corriente',4,'activo','debito',1),
('1120','Fondos',3,'activo','debito',1),
('13','INVENTARIOS AGROPECUARIOS',2,'activo','debito',1),
('1305','Inventario de Animales',3,'activo','debito',1),
('130505','Bovinos',4,'activo','debito',1),
('130510','Bufalinos',4,'activo','debito',1),
('130515','Porcinos',4,'activo','debito',1),
('130520','Ovinos/Caprinos',4,'activo','debito',1),
('130525','Equinos',4,'activo','debito',1),
('130530','Aves',4,'activo','debito',1),
('130535','Animales en Préstamo',4,'activo','debito',1),
('1310','Inventario de Cultivos',3,'activo','debito',1),
('131005','Cultivos en Desarrollo',4,'activo','debito',1),
('131010','Cosechas en Proceso',4,'activo','debito',1),
('1315','Inventario de Insumos',3,'activo','debito',1),
('131505','Semillas',4,'activo','debito',1),
('131510','Fertilizantes',4,'activo','debito',1),
('131515','Plaguicidas',4,'activo','debito',1),
('131520','Alimentos Concentrados',4,'activo','debito',1),
('131525','Medicamentos Veterinarios',4,'activo','debito',1),
('131530','Materiales de Empaque',4,'activo','debito',1),
('1320','Productos en Almacén',3,'activo','debito',1),
('14','PROPIEDADES Y EQUIPOS',2,'activo','debito',1),
('1405','Terrenos',3,'activo','debito',1),
('1410','Construcciones y Edificaciones',3,'activo','debito',1),
('141005','Establos',4,'activo','debito',1),
('141010','Galpones',4,'activo','debito',1),
('141015','Bodegas',4,'activo','debito',1),
('141020','Silos',4,'activo','debito',1),
('1415','Maquinaria y Equipo Agrícola',3,'activo','debito',1),
('141505','Tractores',4,'activo','debito',1),
('141510','Cosechadoras',4,'activo','debito',1),
('141515','Sembradoras',4,'activo','debito',1),
('141520','Sistemas de Riego',4,'activo','debito',1),
('1420','Equipo de Ordeño',3,'activo','debito',1),
('1425','Vehículos',3,'activo','debito',1),
('1430','Muebles y Enseres',3,'activo','debito',1),
('1435','Equipo de Computación',3,'activo','debito',1),
('1440','Semovientes (Reproductores)',3,'activo','debito',1),
('15','ACTIVOS BIOLÓGICOS',2,'activo','debito',1),
('1505','Plantaciones Agrícolas',3,'activo','debito',1),
('1510','Semovientes en Producción',3,'activo','debito',1),
('16','DEPRECIACIONES',2,'activo','debito',1),
('1605','Depreciación Maquinaria',3,'activo','debito',1),
('1610','Depreciación Equipos',3,'activo','debito',1),
('1615','Depreciación Vehículos',3,'activo','debito',1),
('17','CUENTAS POR COBRAR',2,'activo','debito',1),
('1705','Clientes Nacionales',3,'activo','debito',1),
('1710','Cuentas por Cobrar a Terceros',3,'activo','debito',1),
('19','OTROS ACTIVOS',2,'activo','debito',1),
('1905','Diferidos',3,'activo','debito',1);

-- Clase 2: PASIVO
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('2','PASIVO',1,'pasivo','credito',1),
('21','OBLIGACIONES FINANCIERAS',2,'pasivo','credito',1),
('2105','Bancos Nacionales',3,'pasivo','credito',1),
('2110','Proveedores',3,'pasivo','credito',1),
('22','PROVEEDORES',2,'pasivo','credito',1),
('2205','Proveedores Nacionales',3,'pasivo','credito',1),
('23','CUENTAS POR PAGAR',2,'pasivo','credito',1),
('2305','Costos y Gastos por Pagar',3,'pasivo','credito',1),
('2310','Acreedores Varios',3,'pasivo','credito',1),
('24','IMPUESTOS POR PAGAR',2,'pasivo','credito',1),
('2405','IVA por Pagar',3,'pasivo','credito',1),
('2410','Retención en la Fuente',3,'pasivo','credito',1),
('2415','ICA por Pagar',3,'pasivo','credito',1),
('25','OBLIGACIONES LABORALES',2,'pasivo','credito',1),
('2505','Salarios por Pagar',3,'pasivo','credito',1),
('2510','Prestaciones Sociales',3,'pasivo','credito',1),
('2515','Aportes Parafiscales',3,'pasivo','credito',1),
('26','PASIVOS POR ARRENDAMIENTO',2,'pasivo','credito',1),
('2605','Arrendamiento Financiero',3,'pasivo','credito',1),
('2610','Arrendamiento Operativo',3,'pasivo','credito',1),
('27','ANIMALES EN ADOPCIÓN',2,'pasivo','credito',1),
('2705','Animales Recibidos en Adopción',3,'pasivo','credito',1),
('2710','Animales en Consignación',3,'pasivo','credito',1),
('28','OTROS PASIVOS',2,'pasivo','credito',1),
('2805','Anticipos de Clientes',3,'pasivo','credito',1),
('2810','Ingresos Recibidos por Anticipado',3,'pasivo','credito',1);

-- Clase 3: PATRIMONIO
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('3','PATRIMONIO',1,'patrimonio','credito',1),
('31','CAPITAL SOCIAL',2,'patrimonio','credito',1),
('3105','Aportes Sociales',3,'patrimonio','credito',1),
('32','RESERVAS',2,'patrimonio','credito',1),
('3205','Reserva Legal',3,'patrimonio','credito',1),
('33','UTILIDADES ACUMULADAS',2,'patrimonio','credito',1),
('3305','Utilidades de Ejercicios Anteriores',3,'patrimonio','credito',1),
('34','UTILIDAD DEL EJERCICIO',2,'patrimonio','credito',1),
('3405','Utilidad Neta del Ejercicio',3,'patrimonio','credito',1);

-- Clase 4: INGRESOS
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('4','INGRESOS',1,'ingreso','credito',1),
('41','INGRESOS OPERACIONALES',2,'ingreso','credito',1),
('4105','Venta de Animales',3,'ingreso','credito',1),
('410505','Venta de Bovinos',4,'ingreso','credito',1),
('410510','Venta de Porcinos',4,'ingreso','credito',1),
('410515','Venta de Aves',4,'ingreso','credito',1),
('410520','Venta de Leche',4,'ingreso','credito',1),
('410525','Venta de Queso y Derivados',4,'ingreso','credito',1),
('410530','Venta de Huevos',4,'ingreso','credito',1),
('410535','Venta de Miel',4,'ingreso','credito',1),
('4110','Venta de Productos Agrícolas',3,'ingreso','credito',1),
('411005','Venta de Cultivos',4,'ingreso','credito',1),
('411010','Venta de Semillas',4,'ingreso','credito',1),
('4115','Venta de Insumos',3,'ingreso','credito',1),
('42','INGRESOS NO OPERACIONALES',2,'ingreso','credito',1),
('4205','Arrendamientos',3,'ingreso','credito',1),
('4210','Servicios Prestados',3,'ingreso','credito',1),
('4215','Subsidios y Ayudas',3,'ingreso','credito',1);

-- Clase 5: GASTOS
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('5','GASTOS',1,'gasto','debito',1),
('51','GASTOS OPERACIONALES',2,'gasto','debito',1),
('5105','Gastos de Personal',3,'gasto','debito',1),
('510505','Salarios',4,'gasto','debito',1),
('510510','Prestaciones Sociales',4,'gasto','debito',1),
('510515','Aportes Parafiscales',4,'gasto','debito',1),
('5110','Gastos de Alimentación Animal',3,'gasto','debito',1),
('511005','Concentrados',4,'gasto','debito',1),
('511010','Forrajes',4,'gasto','debito',1),
('511015','Suplementos',4,'gasto','debito',1),
('5115','Gastos Veterinarios',3,'gasto','debito',1),
('511505','Medicamentos',4,'gasto','debito',1),
('511510','Honorarios Veterinarios',4,'gasto','debito',1),
('511515','Vacunas',4,'gasto','debito',1),
('5120','Gastos de Cultivo',3,'gasto','debito',1),
('512005','Semillas',4,'gasto','debito',1),
('512010','Fertilizantes',4,'gasto','debito',1),
('512015','Plaguicidas',4,'gasto','debito',1),
('512020','Riego',4,'gasto','debito',1),
('5125','Gastos de Mantenimiento',3,'gasto','debito',1),
('512505','Maquinaria Agrícola',4,'gasto','debito',1),
('512510','Vehículos',4,'gasto','debito',1),
('512515','Infraestructura',4,'gasto','debito',1),
('5130','Gastos de Transporte',3,'gasto','debito',1),
('5135','Servicios Públicos',3,'gasto','debito',1),
('5140','Arrendamientos',3,'gasto','debito',1),
('5145','Depreciaciones',3,'gasto','debito',1),
('5150','Gastos de Comercialización',3,'gasto','debito',1),
('52','GASTOS NO OPERACIONALES',2,'gasto','debito',1),
('5205','Gastos Financieros',3,'gasto','debito',1),
('5210','Impuestos Asumidos',3,'gasto','debito',1),
('5215','Gastos Extraordinarios',3,'gasto','debito',1),
('53','COSTO DE VENTAS',2,'gasto','debito',1),
('5305','Costo Venta de Animales',3,'gasto','debito',1),
('5310','Costo Venta de Productos Agrícolas',3,'gasto','debito',1),
('5315','Costo Venta de Insumos',3,'gasto','debito',1);

-- Clase 6: COSTOS DE PRODUCCIÓN
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('6','COSTOS DE PRODUCCIÓN',1,'costo','debito',1),
('61','COSTOS PRODUCCIÓN ANIMAL',2,'costo','debito',1),
('6105','Costo Producción Bovinos',3,'costo','debito',1),
('6110','Costo Producción Porcinos',3,'costo','debito',1),
('6115','Costo Producción Aves',3,'costo','debito',1),
('6120','Costo Producción Leche',3,'costo','debito',1),
('6125','Costo Beneficio',3,'costo','debito',1),
('62','COSTOS PRODUCCIÓN AGRÍCOLA',2,'costo','debito',1),
('6205','Preparación de Terreno',3,'costo','debito',1),
('6210','Siembra',3,'costo','debito',1),
('6215','Labores Culturales',3,'costo','debito',1),
('6220','Cosecha',3,'costo','debito',1),
('6225','Poscosecha',3,'costo','debito',1);

-- Clase 7: CUENTAS DE ORDEN
INSERT IGNORE INTO plan_cuentas (codigo, nombre, nivel, tipo, naturaleza, activo) VALUES
('7','CUENTAS DE ORDEN',1,'orden','debito',1),
('71','CUENTAS DE ORDEN DEUDORAS',2,'orden','debito',1),
('7105','Bienes en Poder de Terceros',3,'orden','debito',1),
('7110','Valores Recibidos en Garantía',3,'orden','debito',1),
('72','CUENTAS DE ORDEN ACREEDORAS',2,'orden','credito',1),
('7205','Bienes Recibidos en Custodia',3,'orden','credito',1);

-- ============================================================
-- Clientes de ejemplo
-- ============================================================
INSERT IGNORE INTO clientes (tipo_documento, numero_documento, dv, nombre, nombre_comercial, direccion, telefono, email, regimen, responsabilidad_fiscal, actividad_economica, activo) VALUES
('NIT','900123456', '6', 'Cooperativa Lechera del Magdalena', 'Colechera Ltda', 'Cra 12 #34-56, Santa Marta', '6054203030', 'contabilidad@colechera.com', 'comun', 'IVA', 'A0121 - Ganadería bovina', 1),
('NIT','900789012', '4', 'Frigorífico del Caribe S.A.S.', 'FrigoCaribe', 'Av 5 #10-20, Barranquilla', '6053704040', 'compras@frigocaribe.com', 'comun', 'IVA', 'A1011 - Beneficio de ganado', 1),
('NIT','800505123', '8', 'Agroinsumos del Sur S.A.', 'AgroSur', 'Calle 8 #15-30, Bogotá', '6012456789', 'ventas@agrosur.com', 'comun', 'IVA_INC', 'G4661 - Comercio insumos agropecuarios', 1),
('CC','72234567', NULL, 'Carlos Arturo Mendoza', 'C.A. Mendoza', 'Vereda El Progreso, Finca La Esperanza', '3102003344', 'carlos.mendoza@email.com', 'simplificado', 'no_responsable', 'A0124 - Ganadería mixta', 1),
('NIT','901234567', '3', 'Central de Abastos de Ciénaga', 'Central Abastos Ciénaga', 'Km 2 Vía Ciénaga, Ciénaga', '6052755566', 'gerencia@centralabastos.com', 'comun', 'IVA', 'G4711 - Comercio productos agrícolas', 1),
('CC','81123456', NULL, 'María Fernanda Pérez López', 'M.F. Pérez', 'Finca Villa María, Aracataca', '3104005566', 'maria.perez@email.com', 'simplificado', 'no_responsable', 'A0121 - Ganadería bovina', 1),
('NIT','900654321', '1', 'Alimentos Balanceados del Norte S.A.S.', 'Alimbal Norte', 'Calle 30 #45-60, Valledupar', '6055807070', 'pedidos@alimbalnorte.com', 'comun', 'IVA', 'C1090 - Elaboración alimentos animales', 1);

-- ============================================================
-- Productos adicionales
-- ============================================================
INSERT IGNORE INTO productos (nombre, tipo, unidad_medida, precio_ref) VALUES
('Leche Cruda', 'leche', 'L', 1800),
('Queso Costeño', 'queso', 'kg', 12000),
('Queso Doble Crema', 'queso', 'kg', 15000),
('Bovino en Pie', 'carne', 'kg', 8500),
('Ternero Desteto', 'carne', 'unidad', 450000),
('Novillo Gordo', 'carne', 'unidad', 3200000),
('Cerdo en Pie', 'carne', 'kg', 7000),
('Pollo Beneficiado', 'carne', 'kg', 9500),
('Huevo de Mesa', 'huevos', 'unidad', 450),
('Miel de Abeja', 'miel', 'kg', 25000),
('Plátano Hartón', 'grano', 'kg', 1200),
('Yuca Industrial', 'grano', 'kg', 900),
('Abono Orgánico', 'elaborado', 'kg', 1500),
('Estiércol Compostado', 'elaborado', 'kg', 800),
('Servicio de Pastoreo', 'elaborado', 'unidad', 200000),
('Leche Pasteurizada', 'leche', 'L', 2800),
('Yogur Natural', 'elaborado', 'L', 5000),
('Dulce de Leche', 'elaborado', 'kg', 18000);

-- ============================================================
-- Presupuestos de ejemplo
-- ============================================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finca_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  tipo ENUM('anual','semestral','trimestral','mensual') DEFAULT 'anual',
  estado ENUM('borrador','aprobado','ejecucion','cerrado') DEFAULT 'borrador',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (finca_id) REFERENCES fincas(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS presupuesto_partidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  presupuesto_id INT NOT NULL,
  cuenta_id INT NOT NULL,
  mes INT NOT NULL COMMENT '1-12',
  valor_proyectado DECIMAL(14,2) DEFAULT 0,
  valor_ejecutado DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
  FOREIGN KEY (cuenta_id) REFERENCES plan_cuentas(id)
) ENGINE=InnoDB;

-- ============================================================
-- Registro de consumo de insumos (animales/cultivos)
-- ============================================================
CREATE TABLE IF NOT EXISTS consumo_insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL,
  inventario_id INT NULL,
  cantidad DECIMAL(12,3) NOT NULL,
  fecha DATE NOT NULL,
  tipo_consumo ENUM('animal','cultivo','lote','general') NOT NULL,
  animal_id INT NULL,
  siembra_id INT NULL,
  lote_id INT NULL,
  costo_unitario DECIMAL(12,2),
  responsable VARCHAR(100),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insumo_id) REFERENCES insumos(id),
  FOREIGN KEY (inventario_id) REFERENCES inventario(id),
  FOREIGN KEY (animal_id) REFERENCES animales(id),
  FOREIGN KEY (siembra_id) REFERENCES siembras(id),
  FOREIGN KEY (lote_id) REFERENCES lotes(id),
  INDEX idx_consumo_fecha (fecha),
  INDEX idx_consumo_tipo (tipo_consumo)
) ENGINE=InnoDB;

-- ============================================================
-- Historial clínico / morbilidad
-- ============================================================
CREATE TABLE IF NOT EXISTS morbilidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  animal_id INT NULL,
  lote_id INT NULL,
  especie VARCHAR(50),
  fecha_deteccion DATE NOT NULL,
  tipo_afectacion ENUM('enfermedad','lesion','desnutricion','parasitosis','estres_calorico','mastitis','pododermattitis','problema_reproductivo','otro') NOT NULL,
  diagnostico VARCHAR(255),
  severidad ENUM('leve','moderado','severo','critico') DEFAULT 'leve',
  estado_actual ENUM('activo','recuperado','cronico','fallecido') DEFAULT 'activo',
  tratamiento_id INT NULL,
  dias_incapacidad INT DEFAULT 0,
  perdida_economica DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (animal_id) REFERENCES animales(id),
  FOREIGN KEY (lote_id) REFERENCES lotes(id),
  INDEX idx_morbilidad_fecha (fecha_deteccion),
  INDEX idx_morbilidad_estado (estado_actual)
) ENGINE=InnoDB;

-- ============================================================
-- Módulo de planeación / cronograma
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finca_id INT NOT NULL,
  lote_id INT NULL,
  animal_id INT NULL,
  siembra_id INT NULL,
  tipo_actividad VARCHAR(50) NOT NULL COMMENT 'vacunacion, desparasitacion, pesaje, siembra, cosecha, rotacion, inseminacion, parto, marcacion, poda, fertilizacion, riego',
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_programada DATE NOT NULL,
  fecha_ejecucion DATE NULL,
  duracion_estimada INT COMMENT 'horas',
  responsable VARCHAR(100),
  prioridad ENUM('baja','media','alta','critica') DEFAULT 'media',
  estado ENUM('programado','en_curso','completado','cancelado','vencido') DEFAULT 'programado',
  resultado TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (finca_id) REFERENCES fincas(id),
  FOREIGN KEY (lote_id) REFERENCES lotes(id),
  INDEX idx_plan_fecha (fecha_programada),
  INDEX idx_plan_estado (estado),
  INDEX idx_plan_tipo (tipo_actividad)
) ENGINE=InnoDB;

-- ============================================================
-- Indicadores de cumplimiento de actividades
-- ============================================================
CREATE TABLE IF NOT EXISTS indicadores_actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finca_id INT NOT NULL,
  periodo DATE NOT NULL COMMENT 'primer dia del periodo',
  total_programadas INT DEFAULT 0,
  total_completadas INT DEFAULT 0,
  total_vencidas INT DEFAULT 0,
  cumplimiento_pct DECIMAL(5,2) DEFAULT 0,
  oportunidad_pct DECIMAL(5,2) DEFAULT 0 COMMENT 'completadas antes de vencimiento',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_indicador_periodo (finca_id, periodo),
  FOREIGN KEY (finca_id) REFERENCES fincas(id)
) ENGINE=InnoDB;

-- ============================================================
-- Registros climáticos
-- ============================================================
CREATE TABLE IF NOT EXISTS registros_climaticos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finca_id INT NOT NULL,
  fecha DATE NOT NULL,
  temperatura_max DECIMAL(5,2),
  temperatura_min DECIMAL(5,2),
  precipitacion_mm DECIMAL(8,2),
  humedad_relativa DECIMAL(5,2),
  viento_kmh DECIMAL(6,2),
  horas_sol DECIMAL(4,1),
  estacion VARCHAR(30) COMMENT 'invierno, verano, transicion',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finca_id) REFERENCES fincas(id),
  INDEX idx_clima_fecha (fecha)
) ENGINE=InnoDB;
