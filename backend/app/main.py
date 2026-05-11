import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.routers import auth, animales, cultivos, lotes, finanzas, estadisticas, sync
from app.routers.export import router as export_router
from app.routers.operaciones import router as operaciones_router
from app.routers.especies_menores import router as especies_menores_router
from app.routers.erp import router as erp_router
from app.routers.facturacion import router as facturacion_router
from app.routers.utilidades import router as utilidades_router
from app.routers.agrotecnico import router as agrotecnico_router
from app.routers.planeacion import router as planeacion_router
from app.routers.consumo import router as consumo_router
from app.routers.transferencias import router as transferencias_router
from app.routers.sistema import router as sistema_router
from app.routers.alertas import router as alertas_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app.include_router(auth.router)
app.include_router(animales.router)
app.include_router(cultivos.router)
app.include_router(lotes.router)
app.include_router(finanzas.router)
app.include_router(estadisticas.router)
app.include_router(sync.router)
app.include_router(export_router)
app.include_router(operaciones_router)
app.include_router(especies_menores_router)
app.include_router(erp_router)
app.include_router(facturacion_router)
app.include_router(utilidades_router)
app.include_router(agrotecnico_router)
app.include_router(planeacion_router)
app.include_router(consumo_router)
app.include_router(transferencias_router)
app.include_router(sistema_router)
app.include_router(alertas_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    app.mount("/favicon.svg", StaticFiles(directory=static_dir), name="favicon")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
