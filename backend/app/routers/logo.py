import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/logo", tags=["Logo"])

LOGOS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "logos")
os.makedirs(LOGOS_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg"}
MAX_SIZE = 2 * 1024 * 1024

@router.post("/upload")
async def upload_logo(file: UploadFile = File(...), finca_id: str = Form("global")):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Formato no soportado. Use PNG, JPG o SVG.")
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "El archivo excede el tamaño máximo de 2MB.")
    filename = f"{finca_id}.png"
    filepath = os.path.join(LOGOS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    return {"url": f"/api/logo/{finca_id}", "finca_id": finca_id}

@router.get("/{finca_id}")
async def get_logo(finca_id: str):
    for ext in [".png", ".jpg", ".jpeg", ".svg"]:
        filepath = os.path.join(LOGOS_DIR, f"{finca_id}{ext}")
        if os.path.isfile(filepath):
            return FileResponse(filepath, media_type=f"image/{ext[1:]}")
    raise HTTPException(404, "Logo no encontrado")

@router.delete("/{finca_id}")
async def delete_logo(finca_id: str):
    deleted = False
    for ext in [".png", ".jpg", ".jpeg", ".svg"]:
        filepath = os.path.join(LOGOS_DIR, f"{finca_id}{ext}")
        if os.path.isfile(filepath):
            os.remove(filepath)
            deleted = True
    if not deleted:
        raise HTTPException(404, "Logo no encontrado")
    return {"message": "Logo eliminado"}
