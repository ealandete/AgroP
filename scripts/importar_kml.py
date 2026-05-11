#!/usr/bin/env python3
"""
Importa el KML de Finca Magdalena a la base de datos agrop.
Extrae polígonos, calcula áreas aproximadas y crea lotes.
"""
import json
import xml.etree.ElementTree as ET
import pymysql
from math import radians, cos, sin, asin, sqrt

NS = {"kml": "http://www.opengis.net/kml/2.2"}

def haversine(lon1, lat1, lon2, lat2):
    """Calcula distancia en metros entre dos puntos (fórmula Haversine)."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return 6371000 * c  # radio Tierra en metros

def polygon_area_m2(coords):
    """Calcula área aproximada de un polígono en m² usando fórmula Shoelace con Haversine."""
    # Convertir a coordenadas planas (aproximación para áreas pequeñas)
    if len(coords) < 3:
        return 0
    # Calcular centroide
    cx = sum(c[0] for c in coords) / len(coords)
    cy = sum(c[1] for c in coords) / len(coords)
    # Proyectar a metros
    points = []
    for lon, lat in coords:
        dx = haversine(cx, cy, lon, cy) * (1 if lon >= cx else -1)
        dy = haversine(cx, cy, cx, lat) * (1 if lat >= cy else -1)
        points.append((dx, dy))
    # Shoelace formula
    area = 0
    n = len(points)
    for i in range(n):
        j = (i + 1) % n
        area += points[i][0] * points[j][1]
        area -= points[j][0] * points[i][1]
    return abs(area) / 2

def parse_coordinates(coord_text):
    """Convierte texto de coordenadas KML a lista de pares (lon, lat)."""
    coords = []
    for line in coord_text.strip().split():
        parts = line.split(",")
        if len(parts) >= 2:
            coords.append((float(parts[0]), float(parts[1])))
    return coords

def kml_to_geojson_polygon(coords):
    """Convierte coordenadas a formato GeoJSON Polygon."""
    ring = [[c[0], c[1]] for c in coords]  # [lng, lat]
    return {"type": "Polygon", "coordinates": [ring]}

# Conectar a BD
conn = pymysql.connect(host="127.0.0.1", user="emilio", password="s1gma", database="agrop", charset="utf8mb4")
cur = conn.cursor()

# Crear finca Magdalena (o actualizar si existe)
cur.execute("SELECT id FROM fincas WHERE nombre = 'Finca Magdalena'")
row = cur.fetchone()
if row:
    finca_id = row[0]
    print(f"Finca Magdalena ya existe: ID={finca_id}")
else:
    cur.execute("""
        INSERT INTO fincas (nombre, ciudad, departamento, latitud, longitud, area_total)
        VALUES ('Finca Magdalena', 'Barranquilla', 'Atlantico', 10.7535, -74.678, 0)
    """)
    finca_id = cur.lastrowid
    print(f"Finca Magdalena creada: ID={finca_id}")

# Eliminar lotes antiguos de prueba (con hijos en orden)
cur.execute("DELETE FROM cosechas WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("DELETE FROM siembras WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("DELETE FROM tratamientos WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("DELETE FROM analisis_suelo WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("DELETE FROM alimentacion WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("UPDATE alertas SET lote_id = NULL WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("UPDATE animales SET lote_id = NULL WHERE lote_id IN (SELECT id FROM lotes WHERE finca_id = 1)")
cur.execute("DELETE FROM lotes WHERE finca_id = 1")
print("Lotes de prueba eliminados")

# Parsear KML
tree = ET.parse("/home/emilio/Proyectos/AgroP/sql/Finca_Magdalena.kml")
root = tree.getroot()

placemarks = root.findall(".//kml:Placemark", NS)
print(f"Placemarks encontrados: {len(placemarks)}")

COLORES = [
    "#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0",
    "#00BCD4", "#8BC34A", "#FFC107", "#795548", "#607D8B",
    "#FF5722", "#3F51B5", "#009688", "#CDDC39", "#F44336", "#673AB7",
    "#03A9F4", "#FFEB3B", "#9E9E9E", "#8D6E63",
]

lotes_insertados = 0
area_total = 0

for i, pm in enumerate(placemarks):
    name_el = pm.find("kml:name", NS)
    name = name_el.text if name_el is not None else f"Lote {i+1}"

    polygon_el = pm.find(".//kml:Polygon", NS)
    if polygon_el is None:
        continue  # Skip line features (roads, canals)

    coords_el = polygon_el.find(".//kml:coordinates", NS)
    if coords_el is None or not coords_el.text:
        continue

    coords = parse_coordinates(coords_el.text)
    if len(coords) < 3:
        continue

    # Calcular centroide
    cx = sum(c[0] for c in coords) / len(coords)
    cy = sum(c[1] for c in coords) / len(coords)

    # Calcular área en m² y convertir a hectáreas
    area_m2 = polygon_area_m2(coords)
    area_ha = round(area_m2 / 10000, 4)
    area_total += area_ha

    # GeoJSON
    geojson = json.dumps(kml_to_geojson_polygon(coords))

    # Tipo de suelo (variado por defecto)
    color = COLORES[i % len(COLORES)]

    # Determinar uso actual basado en nombre
    uso = "cultivo"
    if "corral" in name.lower():
        uso = "pastoreo"
    elif "vivero" in name.lower():
        uso = "cultivo"
    elif "kiosco" in name.lower() or "alojamiento" in name.lower():
        uso = "construccion"
    elif "cultivo" in name.lower():
        uso = "cultivo"

    cur.execute("""
        INSERT INTO lotes (finca_id, nombre, codigo, area_ha, coordenadas, color, uso_actual,
                           latitud, longitud, tipo_suelo, sistema_riego, exposicion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (finca_id, name, f"FM-{i+1:02d}", area_ha, geojson, color, uso, cy, cx,
          "franco", "secano", "plano"))
    lotes_insertados += 1
    print(f"  {name}: {area_ha:.2f} ha - centro ({cy:.6f}, {cx:.6f})")

# Actualizar área total de la finca
cur.execute("UPDATE fincas SET area_total = %s WHERE id = %s", (round(area_total, 2), finca_id))

conn.commit()
cur.close()
conn.close()

print(f"\nTotal: {lotes_insertados} lotes insertados, área total: {area_total:.2f} ha")
