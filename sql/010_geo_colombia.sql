-- ============================================================
-- AgroP - Datos Geográficos de Colombia y Parámetros ICA
-- Schema: MariaDB 11.x
-- ============================================================

-- ============================================================
-- 1. DEPARTAMENTOS DE COLOMBIA (32 departamentos + Bogotá D.C.)
-- ============================================================

DROP TABLE IF EXISTS departamentos;

CREATE TABLE departamentos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    codigo_dane CHAR(2)      NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO departamentos (nombre, codigo_dane) VALUES
('Amazonas',            '91'),
('Antioquia',           '05'),
('Arauca',              '81'),
('Atlántico',           '08'),
('Bolívar',             '13'),
('Boyacá',              '15'),
('Caldas',              '17'),
('Caquetá',             '18'),
('Casanare',            '85'),
('Cauca',               '19'),
('Cesar',               '20'),
('Chocó',               '27'),
('Córdoba',             '23'),
('Cundinamarca',        '25'),
('Guainía',             '94'),
('Guaviare',            '95'),
('Huila',               '41'),
('La Guajira',          '44'),
('Magdalena',           '47'),
('Meta',                '50'),
('Nariño',              '52'),
('Norte de Santander',  '54'),
('Putumayo',            '86'),
('Quindío',             '63'),
('Risaralda',           '66'),
('San Andrés y Providencia', '88'),
('Santander',           '68'),
('Sucre',               '70'),
('Tolima',              '73'),
('Valle del Cauca',     '76'),
('Vaupés',              '97'),
('Vichada',             '99'),
('Bogotá D.C.',         '11');

-- ============================================================
-- 2. MUNICIPIOS DE COLOMBIA (50+ municipios, enfoque agropecuario)
-- ============================================================

DROP TABLE IF EXISTS municipios;

CREATE TABLE municipios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    departamento_id INT          NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    codigo_dane     CHAR(5)      NOT NULL UNIQUE,
    latitud         DECIMAL(10,7),
    longitud        DECIMAL(10,7),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id),
    INDEX idx_municipios_dpto (departamento_id),
    INDEX idx_municipios_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO municipios (departamento_id, nombre, codigo_dane, latitud, longitud) VALUES
-- Bogotá D.C. (33)
(33, 'Bogotá D.C.', '11001', 4.6097100, -74.0817500),

-- Antioquia (2)
(2, 'Medellín',     '05001', 6.2476370, -75.5658150),
(2, 'Rionegro',     '05615', 6.1551450, -75.3737100),
(2, 'Apartadó',     '05045', 7.8829980, -76.6258700),
(2, 'Turbo',        '05837', 8.0926760, -76.7266700),
(2, 'Caucasia',     '05154', 7.9865350, -75.1935700),

-- Atlántico (4)
(4, 'Barranquilla', '08001', 10.9685400, -74.7813200),
(4, 'Soledad',      '08758', 10.9184300, -74.7645800),

-- Bolívar (5)
(5, 'Cartagena de Indias', '13001', 10.3910480, -75.4794250),
(5, 'Magangué',            '13430', 9.2420220, -74.7547400),
(5, 'El Carmen de Bolívar','13244', 9.7173940, -75.1202300),

-- Boyacá (6)
(6, 'Tunja',        '15001', 5.5352800, -73.3677800),
(6, 'Duitama',      '15238', 5.8265700, -73.0200800),
(6, 'Sogamoso',     '15759', 5.7143400, -72.9339100),

-- Caldas (7)
(7, 'Manizales',    '17001', 5.0688900, -75.5173800),
(7, 'La Dorada',    '17380', 5.4531000, -74.6631200),

-- Cauca (10)
(10, 'Popayán',     '19001', 2.4448100, -76.6147400),
(10, 'Santander de Quilichao', '19698', 3.0094500, -76.4849300),

-- Cesar (11)
(11, 'Valledupar',   '20001', 10.4631400, -73.2532200),
(11, 'Aguachica',    '20011', 8.3086600, -73.6166000),

-- Córdoba (13)
(13, 'Montería',     '23001', 8.7479800, -75.8814300),
(13, 'Cereté',       '23162', 8.8856300, -75.7921100),
(13, 'Lorica',       '23417', 9.2364800, -75.8135000),

-- Cundinamarca (14)
(14, 'Zipaquirá',    '25899', 5.0247200, -74.0012300),
(14, 'Facatativá',   '25269', 4.8133300, -74.3546400),
(14, 'Fusagasugá',   '25290', 4.3364600, -74.3647800),

-- Huila (17)
(17, 'Neiva',        '41001', 2.9273000, -75.2818800),
(17, 'Pitalito',     '41551', 1.8496600, -76.0518500),
(17, 'Garzón',       '41298', 2.1959300, -75.6277700),

-- La Guajira (18)
(18, 'Riohacha',     '44001', 11.5444400, -72.9072200),

-- Magdalena (19)
(19, 'Santa Marta',          '47001', 11.2407900, -74.1990400),
(19, 'Ciénaga',              '47189', 11.0070300, -74.2476500),
(19, 'Fundación',            '47288', 10.5206600, -74.1854400),

-- Meta (20)
(20, 'Villavicencio',        '50001', 4.1420000, -73.6266400),
(20, 'Puerto López',         '50573', 4.0848100, -72.9561700),
(20, 'Granada',              '50313', 3.5404000, -73.7058800),

-- Nariño (21)
(21, 'Pasto',        '52001', 1.2136100, -77.2811100),
(21, 'Ipiales',      '52356', 0.8250000, -77.6402800),
(21, 'Tumaco',       '52835', 1.8066700, -78.7647200),

-- Norte de Santander (22)
(22, 'Cúcuta',       '54001', 7.8939100, -72.5078200),
(22, 'Ocaña',        '54498', 8.2359300, -73.3562400),

-- Quindío (24)
(24, 'Armenia',      '63001', 4.5338900, -75.6811100),
(24, 'Montenegro',   '63470', 4.5662700, -75.7511100),

-- Risaralda (25)
(25, 'Pereira',      '66001', 4.8133300, -75.6961100),
(25, 'Dosquebradas', '66170', 4.8361100, -75.6761100),

-- Santander (27)
(27, 'Bucaramanga',  '68001', 7.1253900, -73.1198000),
(27, 'Barrancabermeja',      '68081',  7.0653600, -73.8544700),
(27, 'San Vicente de Chucurí','68689', 6.8810000, -73.4097700),

-- Sucre (28)
(28, 'Sincelejo',    '70001',  9.3047200, -75.3977800),

-- Tolima (29)
(29, 'Ibagué',       '73001',  4.4388900, -75.2322200),
(29, 'Espinal',      '73268',  4.1492400, -74.8845800),
(29, 'Chaparral',    '73168',  3.7234200, -75.4835600),

-- Valle del Cauca (30)
(30, 'Cali',         '76001',  3.4372200, -76.5225000),
(30, 'Palmira',      '76520',  3.5394400, -76.3036100),
(30, 'Buga',         '76111',  3.9000000, -76.2977800),
(30, 'Tuluá',        '76834',  4.0845200, -76.1979700),
(30, 'Buenaventura', '76109',  3.8883600, -77.0703000),
(30, 'Cartago',      '76147',  4.7450000, -75.9116700);

-- ============================================================
-- 3. PARÁMETROS ICA
-- ============================================================

-- 3.1 Razas bovinas registradas por el ICA

DROP TABLE IF EXISTS parametros_ica_razas;

CREATE TABLE parametros_ica_razas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    tipo        ENUM('Bos taurus','Bos indicus','Sintético','Criollo') NOT NULL,
    aptitud     VARCHAR(50) COMMENT 'Carne, Leche, Doble propósito',
    activo      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO parametros_ica_razas (nombre, tipo, aptitud) VALUES
-- Cebú / Bos indicus
('Brahman',                'Bos indicus', 'Carne'),
('Gyr',                    'Bos indicus', 'Leche'),
('Guzerat',                'Bos indicus', 'Doble propósito'),
('Nelore',                 'Bos indicus', 'Carne'),
('Indubrasil',             'Bos indicus', 'Carne'),
('Cebú Rojo',             'Bos indicus', 'Carne'),

-- Criollos colombianos
('Romosinuano',            'Criollo',     'Carne'),
('Costeño con Cuernos',    'Criollo',     'Doble propósito'),
('Blanco Orejinegro (BON)','Criollo',     'Doble propósito'),
('Hartón del Valle',       'Criollo',     'Doble propósito'),
('Chino Santandereano',    'Criollo',     'Doble propósito'),
('Lucerna',                'Criollo',     'Leche'),
('Sanmartinero',           'Criollo',     'Carne'),
('Casanareño',             'Criollo',     'Carne'),
('Velásquez',              'Criollo',     'Carne'),

-- Sintéticos
('Simbrah',                'Sintético',   'Carne'),
('Girolando',              'Sintético',   'Leche'),

-- Bos taurus
('Holstein',               'Bos taurus',  'Leche'),
('Pardo Suizo',            'Bos taurus',  'Doble propósito'),
('Jersey',                 'Bos taurus',  'Leche'),
('Normando',               'Bos taurus',  'Doble propósito'),
('Angus',                  'Bos taurus',  'Carne'),
('Hereford',               'Bos taurus',  'Carne'),
('Simmental',              'Bos taurus',  'Doble propósito'),
('Limousin',               'Bos taurus',  'Carne'),
('Charolais',              'Bos taurus',  'Carne'),
('Simental',               'Bos taurus',  'Doble propósito');

-- 3.2 Vacunas exigidas por el ICA

DROP TABLE IF EXISTS parametros_ica_vacunas;

CREATE TABLE parametros_ica_vacunas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    enfermedad      VARCHAR(100) NOT NULL,
    nombre_comercial VARCHAR(150),
    especie_objetivo VARCHAR(100) NOT NULL COMMENT 'Bovinos, Bufalinos, Equinos, etc.',
    obligatoria     BOOLEAN NOT NULL DEFAULT TRUE,
    periodicidad    VARCHAR(50) COMMENT 'Anual, Semestral, Cada 6 meses, Única',
    descripcion     TEXT,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO parametros_ica_vacunas (enfermedad, nombre_comercial, especie_objetivo, obligatoria, periodicidad, descripcion) VALUES
-- Fiebre aftosa
('Fiebre Aftosa', 'Aftovax',        'Bovinos, Bufalinos',     TRUE, 'Cada 6 meses', 'Vacuna antiaftosa oleosa bivalente (serotipos O y A). Ciclo I: mayo-junio, Ciclo II: noviembre-diciembre.'),
('Fiebre Aftosa', 'Aftobov',        'Bovinos, Bufalinos',     TRUE, 'Cada 6 meses', 'Vacuna antiaftosa importada. Región libre de aftosa sin vacunación requiere autorización especial del ICA.'),
('Fiebre Aftosa', 'BIO-Aftogen',    'Bovinos, Bufalinos',     TRUE, 'Cada 6 meses', 'Vacuna polivalente fabricada por Vecol. Debe aplicarse en predios registrados ante el ICA.'),

-- Brucelosis
('Brucelosis',    'RB51',           'Bovinos, Bufalinos',     TRUE, 'Única',        'Cepa viva RB51. Aplicación única en hembras entre 3 y 8 meses de edad. Obligatoria en hatos lecheros según Resolución ICA.'),
('Brucelosis',    'Cepa 19',        'Bovinos, Bufalinos',     TRUE, 'Única',        'Vacuna viva Cepa 19. Alternativa a RB51. Edad de aplicación: 3 a 6 meses. Debe ser aplicada por médico veterinario acreditado ICA.'),

-- Rabia
('Rabia Bovina',  'Rabvac',         'Bovinos, Equinos',       TRUE, 'Anual',        'Vacuna inactivada contra rabia de origen silvestre (murciélago hematófago). Obligatoria en zonas endémicas con reporte de Desmodus rotundus. Refuerzo anual.'),
('Rabia Bovina',  'Inmunab',        'Bovinos, Equinos',       TRUE, 'Anual',        'Vacuna antirrábica inactivada fabricada por Vecol. Aplicación cada 12 meses en zonas de riesgo ICA.'),

-- Enfermedades adicionales con registro ICA (opcionales)
('Clostridiosis', 'Clostrivac 8',   'Bovinos, Ovinos',        FALSE, 'Anual',       'Vacuna polivalente contra clostridiosis (C. chauvoei, C. septicum, C. novyi, C. perfringens tipos B, C y D, C. sordellii, C. haemolyticum). Recomendada en zonas cálidas y húmedas.'),
('Ántrax',        'Carbovac',       'Bovinos, Equinos, Ovinos',FALSE, 'Anual',      'Vacuna contra carbón bacteridiano (Bacillus anthracis). Obligatoria en zonas con historial de brotes según ICA.');

-- 3.3 Plaguicidas con registro ICA

DROP TABLE IF EXISTS parametros_ica_plaguicidas;

CREATE TABLE parametros_ica_plaguicidas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    ingrediente_activo VARCHAR(150) NOT NULL,
    tipo            ENUM('Herbicida','Insecticida','Fungicida','Acaricida','Nematicida','Coadyuvante','Regulador de crecimiento') NOT NULL,
    categoria_toxicologica ENUM('Ia','Ib','II','III','IV') NOT NULL COMMENT 'Clasificación OMS: Ia=Extremadamente peligroso, Ib=Altamente peligroso, II=Moderadamente peligroso, III=Ligeramente peligroso, IV=Normalmente no ofrece peligro',
    cultivo_principal VARCHAR(255),
    dosis_referencia VARCHAR(150),
    periodo_carencia INT COMMENT 'Días de carencia (Periodo de reentrada)',
    registro_ica    VARCHAR(50),
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO parametros_ica_plaguicidas (ingrediente_activo, tipo, categoria_toxicologica, cultivo_principal, dosis_referencia, periodo_carencia) VALUES
-- Herbicidas
('Glifosato',               'Herbicida',   'III', 'Arroz, Maíz, Pastos, Café, Palma',         '1.5 - 4.0 L/ha',       7),
('Paraquat',                'Herbicida',   'II',  'Papa, Arroz, Algodón',                     '1.0 - 2.0 L/ha',       0),
('2,4-D',                   'Herbicida',   'II',  'Arroz, Caña de azúcar, Potreros',           '0.5 - 2.0 L/ha',       7),
('Atrazina',                'Herbicida',   'III', 'Maíz, Sorgo',                              '2.0 - 4.0 L/ha',      30),
('Picloram',                'Herbicida',   'III', 'Pastos, Potreros',                         '0.5 - 2.0 L/ha',      14),
('Ametrina',                'Herbicida',   'III', 'Caña de azúcar',                           '3.0 - 5.0 L/ha',      60),
('Propanil',                'Herbicida',   'II',  'Arroz',                                    '3.0 - 6.0 L/ha',       0),
('Diuron',                  'Herbicida',   'III', 'Caña de azúcar, Palma',                    '2.0 - 4.0 kg/ha',     30),
('Fluroxipir',              'Herbicida',   'II',  'Potreros',                                 '0.5 - 1.5 L/ha',      14),

-- Insecticidas
('Clorpirifos',             'Insecticida', 'II',  'Arroz, Maíz, Algodón, Cítricos',           '0.5 - 2.0 L/ha',      21),
('Metamidofos',             'Insecticida', 'Ib',  'Arroz, Papa, Algodón',                     '0.3 - 1.0 L/ha',       7),
('Fipronil',                'Insecticida', 'II',  'Arroz, Pastos, Papa',                       '0.2 - 0.5 L/ha',      14),
('Imidacloprid',            'Insecticida', 'II',  'Arroz, Café, Cítricos, Tomate',             '0.2 - 0.5 L/ha',      14),
('Tiametoxam',              'Insecticida', 'III', 'Arroz, Papa, Tomate',                        '0.1 - 0.3 kg/ha',      7),
('Lambda-Cialotrina',       'Insecticida', 'II',  'Algodón, Arroz, Maíz, Pastos',              '0.15 - 0.5 L/ha',      15),
('Deltametrina',            'Insecticida', 'II',  'Algodón, Arroz, Hortalizas',               '0.2 - 0.5 L/ha',       7),
('Abamectina',              'Insecticida/Acaricida', 'Ib', 'Cítricos, Tomate, Aguacate',      '0.3 - 0.6 L/ha',      14),
('Emamectina benzoato',     'Insecticida', 'II',  'Arroz, Maíz, Tomate',                       '0.1 - 0.2 kg/ha',      7),
('Carbofuran',              'Insecticida/Nematicida', 'Ib', 'Arroz, Plátano, Papa',            '15 - 30 kg/ha',       90),
('Metomil',                 'Insecticida', 'Ib',  'Soja, Hortalizas',                          '0.5 - 1.0 L/ha',      14),

-- Fungicidas
('Mancozeb',                'Fungicida',   'III', 'Papa, Tomate, Arroz',                        '1.0 - 2.5 kg/ha',      7),
('Propiconazol',            'Fungicida',   'II',  'Arroz, Café, Banano',                       '0.3 - 0.5 L/ha',      14),
('Tebuconazol',             'Fungicida',   'II',  'Arroz, Café, Soja',                          '0.3 - 0.5 L/ha',      14),
('Azoxistrobina',           'Fungicida',   'III', 'Arroz, Banano, Café, Tomate',               '0.2 - 0.4 L/ha',      14),
('Clorotalonil',            'Fungicida',   'II',  'Banano, Papa, Tomate, Plátano',             '1.0 - 3.0 L/ha',      14),
('Difenoconazol',           'Fungicida',   'II',  'Arroz, Papa, Café',                          '0.3 - 0.5 L/ha',      14),
('Carbendazim',             'Fungicida',   'III', 'Arroz, Frutales, Papa',                      '0.3 - 0.5 L/ha',      30),
('Metalaxil',               'Fungicida',   'III', 'Papa, Tomate, Tabaco',                      '0.5 - 1.0 kg/ha',      7);
