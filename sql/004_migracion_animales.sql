-- ============================================================
-- AgroP - Migration v4: Animales (chapeta, estado, fotos)
-- ============================================================

ALTER TABLE animales
  ADD COLUMN numero_chapeta VARCHAR(30) NULL AFTER codigo,
  ADD COLUMN tiene_chapeta BOOLEAN DEFAULT FALSE AFTER numero_chapeta,
  ADD COLUMN estado_origen VARCHAR(20) DEFAULT 'propio' COMMENT 'propio, prestamo, adopcion, consignacion' AFTER activo,
  ADD COLUMN marcas_hierro VARCHAR(100) NULL AFTER marcas_senales,
  ADD COLUMN microchip_id VARCHAR(50) NULL AFTER marcas_hierro,
  ADD COLUMN foto_perfil VARCHAR(500) NULL AFTER microchip_id,
  ADD COLUMN foto_lateral VARCHAR(500) NULL AFTER foto_perfil,
  ADD COLUMN fecha_ultima_identificacion DATE NULL AFTER foto_lateral,
  ADD COLUMN grupo_manejo_id INT NULL AFTER lote_id;

ALTER TABLE lotes
  ADD COLUMN altitud_msnm DECIMAL(6,2) NULL AFTER longitud,
  ADD COLUMN pendiente_pct DECIMAL(5,2) NULL AFTER altitud_msnm,
  ADD COLUMN exposicion VARCHAR(20) NULL AFTER pendiente_pct,
  ADD COLUMN sistema_riego VARCHAR(50) NULL AFTER exposicion,
  ADD COLUMN fuente_agua VARCHAR(100) NULL AFTER sistema_riego,
  ADD COLUMN caudal_lps DECIMAL(8,2) NULL AFTER fuente_agua;

CREATE TABLE IF NOT EXISTS grupos_manejo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  finca_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) COMMENT 'sanitario, alimentacion, reproduccion, cuarentena, engorde',
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finca_id) REFERENCES fincas(id),
  UNIQUE KEY uk_grupo_finca (finca_id, nombre)
) ENGINE=InnoDB;
