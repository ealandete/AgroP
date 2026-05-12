import os
import json
import io
import zipfile
import subprocess
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.config import settings
from app.models import (
    Animal, Siembra, Venta, Costo, Ordeno, Pesaje, Sanidad,
    Usuario, Lote, Producto, Finca, Reproduccion, Lactancia,
    AlimentacionDiaria, MovimientoAnimal, PlanificacionPastoreo, LaborCampo,
    Raza, VariedadCultivo, Cosecha, Insumo, Inventario, Parametro,
    Alert, WebhookConfig, Mensaje, Equipo, AnalisisSuelo,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/backup", tags=["Backup"])

BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

BACKUP_META_FILE = os.path.join(BACKUP_DIR, "backups.json")

ALL_MODELS = [
    Animal, Siembra, Venta, Costo, Ordeno, Pesaje, Sanidad,
    Usuario, Lote, Producto, Finca, Reproduccion, Lactancia,
    AlimentacionDiaria, MovimientoAnimal, PlanificacionPastoreo, LaborCampo,
    Raza, VariedadCultivo, Cosecha, Insumo, Inventario, Parametro,
    Alert, WebhookConfig, Mensaje, Equipo, AnalisisSuelo,
]


def _load_meta():
    if os.path.exists(BACKUP_META_FILE):
        with open(BACKUP_META_FILE, "r") as f:
            return json.load(f)
    return []


def _save_meta(meta):
    with open(BACKUP_META_FILE, "w") as f:
        json.dump(meta, f, indent=2, default=str)


def _get_table_names():
    return [m.__tablename__ for m in ALL_MODELS]


def _run_mysqldump():
    db = settings.DB_NAME
    user = settings.DB_USER
    password = settings.DB_PASSWORD
    host = settings.DB_HOST
    port = settings.DB_PORT
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_filename = f"agrop_{timestamp}.sql"
    sql_path = os.path.join(BACKUP_DIR, sql_filename)
    zip_filename = f"agrop_{timestamp}.zip"
    zip_path = os.path.join(BACKUP_DIR, zip_filename)

    env = os.environ.copy()
    env["MYSQL_PWD"] = password

    cmd = [
        "mysqldump",
        f"--host={host}",
        f"--port={port}",
        f"--user={user}",
        "--single-transaction",
        "--routines",
        "--triggers",
        "--add-drop-table",
        db,
    ]

    result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f"mysqldump failed: {result.stderr}")

    with open(sql_path, "w") as f:
        f.write(result.stdout)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(sql_path, sql_filename)
        upload_dir = settings.UPLOAD_DIR
        if os.path.exists(upload_dir):
            for root, dirs, files in os.walk(upload_dir):
                for file in files:
                    fp = os.path.join(root, file)
                    arcname = os.path.relpath(fp, os.path.dirname(upload_dir))
                    zf.write(fp, arcname)

    os.remove(sql_path)
    return zip_filename


@router.post("/crear")
def crear_backup(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    meta = _load_meta()
    timestamp = datetime.now().isoformat()
    entry = {
        "id": len(meta) + 1,
        "fecha": timestamp,
        "tipo": "completo",
        "tamano_bytes": 0,
        "estado": "en_proceso",
        "filename": "",
        "tablas": len(_get_table_names()),
    }
    meta.append(entry)
    _save_meta(meta)

    try:
        zip_filename = _run_mysqldump()
        zip_path = os.path.join(BACKUP_DIR, zip_filename)
        size = os.path.getsize(zip_path)
        entry["tamano_bytes"] = size
        entry["estado"] = "completado"
        entry["filename"] = zip_filename
        _save_meta(meta)
        return {"mensaje": "Backup creado exitosamente", "filename": zip_filename, "id": entry["id"], "size": size}
    except Exception as e:
        entry["estado"] = "fallido"
        _save_meta(meta)
        raise HTTPException(status_code=500, detail=f"Error creating backup: {str(e)}")


@router.get("/listar")
def listar_backups(current_user: Usuario = Depends(get_current_user)):
    meta = _load_meta()
    result = []
    for entry in reversed(meta):
        size_str = _format_size(entry.get("tamano_bytes", 0))
        result.append({
            "id": entry["id"],
            "fecha": entry["fecha"],
            "tipo": entry.get("tipo", "completo"),
            "tamano": size_str,
            "tamano_bytes": entry.get("tamano_bytes", 0),
            "estado": entry.get("estado", "completado"),
            "filename": entry.get("filename", ""),
            "tablas": entry.get("tablas", 0),
        })
    return result


@router.post("/restaurar/{backup_id}")
def restaurar_backup(backup_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    meta = _load_meta()
    entry = next((e for e in meta if e["id"] == backup_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Backup no encontrado")
    if entry.get("estado") != "completado":
        raise HTTPException(status_code=400, detail="Backup no está completo")
    filename = entry.get("filename", "")
    zip_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="Archivo de backup no encontrado")

    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            sql_files = [n for n in zf.namelist() if n.endswith(".sql")]
            if not sql_files:
                raise HTTPException(status_code=400, detail="No se encontró archivo SQL en el backup")
            sql_data = zf.read(sql_files[0]).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo backup: {str(e)}")

    try:
        connection = engine.raw_connection()
        cursor = connection.cursor()
        for statement in sql_data.split(";\n"):
            stmt = statement.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                except Exception:
                    pass
        connection.commit()
        cursor.close()
        connection.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error restaurando backup: {str(e)}")

    return {"mensaje": "Backup restaurado exitosamente"}


@router.get("/descargar/{filename}")
def descargar_backup(filename: str, current_user: Usuario = Depends(get_current_user)):
    zip_path = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(zip_path, media_type="application/zip", filename=filename)


@router.get("/estadisticas")
def estadisticas_backup(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    meta = _load_meta()
    completados = [e for e in meta if e.get("estado") == "completado"]
    total_size = sum(e.get("tamano_bytes", 0) for e in completados)
    ultimo = completados[-1] if completados else None
    return {
        "total_backups": len(completados),
        "ultimo_backup": ultimo["fecha"] if ultimo else None,
        "ultimo_filename": ultimo["filename"] if ultimo else None,
        "tamano_total": _format_size(total_size),
        "tamano_total_bytes": total_size,
        "tablas_respaldadas": len(_get_table_names()),
        "estado_ultimo": ultimo["estado"] if ultimo else "sin_backups",
    }


def _format_size(bytes_val):
    for unit in ["B", "KB", "MB", "GB"]:
        if bytes_val < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TB"


@router.get("/export/datos-completos")
def export_datos_completos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    data = {}
    for model in ALL_MODELS:
        records = db.query(model).all()
        table_name = model.__tablename__
        data[table_name] = []
        for r in records:
            d = {}
            for c in model.__table__.columns:
                val = getattr(r, c.name)
                if isinstance(val, (datetime,)):
                    val = val.isoformat()
                d[c.name] = val
            data[table_name].append(d)

    return StreamingResponse(
        iter([json.dumps(data, indent=2, default=str)]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=agrop_datos_completos_{datetime.now().strftime('%Y%m%d')}.json"},
    )


@router.post("/programar")
def programar_backup(payload: dict, current_user: Usuario = Depends(get_current_user)):
    frecuencia = payload.get("frecuencia", "nunca")
    programacion_file = os.path.join(BACKUP_DIR, "schedule.json")
    with open(programacion_file, "w") as f:
        json.dump({"frecuencia": frecuencia, "actualizado": datetime.now().isoformat()}, f)
    return {"mensaje": f"Programación guardada: {frecuencia}", "frecuencia": frecuencia}


@router.get("/programacion")
def obtener_programacion(current_user: Usuario = Depends(get_current_user)):
    programacion_file = os.path.join(BACKUP_DIR, "schedule.json")
    if os.path.exists(programacion_file):
        with open(programacion_file, "r") as f:
            return json.load(f)
    return {"frecuencia": "nunca", "actualizado": None}
