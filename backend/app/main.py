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
from app.routers.templates import router as templates_router
from app.routers.vigilancia import router as vigilancia_router
from app.routers.trazabilidad import router as trazabilidad_router
from app.routers.mensajeria import router as mensajeria_router
from app.routers.farmacia import router as farmacia_router
from app.routers.equipos import router as equipos_router
from app.routers.agua import router as agua_router
from app.routers.alimentacion import router as alimentacion_router
from app.routers.bioseguridad import router as bioseguridad_router
from app.routers.certificaciones import router as certificaciones_router
from app.routers.picicultura import router as picicultura_router
from app.routers.suelos import router as suelos_router
from app.routers.sensores import router as sensores_router
from app.routers.forestal import router as forestal_router
from app.routers import procedimientos
from app.routers.recomendaciones import router as recomendaciones_router
from app.routers.cumplimiento import router as cumplimiento_router

tags_metadata = [
    {"name": "Autenticacion", "description": "Login, registro, tokens"},
    {"name": "Animales", "description": "Gestion de ganado y especies"},
    {"name": "Cultivos", "description": "Gestion de siembras y cosechas"},
    {"name": "Lotes", "description": "Gestion de terrenos y mapas"},
    {"name": "Contabilidad", "description": "Facturacion, costos, ventas"},
    {"name": "Planeacion", "description": "Cronograma de actividades"},
    {"name": "Alertas", "description": "Notificaciones y webhooks"},
    {"name": "Exportar", "description": "PDF, Excel, CSV"},
    {"name": "Sistema", "description": "Usuarios, roles, diagnostico"},
    {"name": "Mensajeria", "description": "Mensajeria interna entre usuarios"},
    {"name": "Farmacia", "description": "Gestion de farmacia veterinaria"},
    {"name": "Bioseguridad", "description": "Control de visitas, desinfeccion y vehiculos"},
    {"name": "Certificaciones", "description": "Gestion de certificaciones y no conformidades"},
    {"name": "Agua / Riego", "description": "Fuentes de agua, consumo y calidad"},
    {"name": "Alimentacion", "description": "Alimentos, dietas y consumo diario"},
    {"name": "Picicultura", "description": "Gestion de estanques, cosechas, calidad de agua y alimentacion de peces"},
    {"name": "Procedimientos Veterinarios", "description": "Registro de procedimientos clinicos y quirurgicos veterinarios"},
    {"name": "Suelos / Analisis", "description": "Analisis de suelo, recomendaciones de fertilizacion y cultivos"},
    {"name": "Sensores / Estaciones", "description": "Sensores IoT, estaciones meteorologicas y lecturas"},
    {"name": "Forestal / Plantaciones", "description": "Plantaciones forestales, crecimiento y monitoreo"},
    {"name": "Cumplimiento Normativo", "description": "Gestion de cumplimiento legal y normativo ICA, DIAN, laboral, ambiental y municipal"},
]

app = FastAPI(
    title="AgroP API - Sistema de Gestion Agropecuaria",
    description="""
# AgroP API

Sistema de gestion agropecuaria para la administracion de fincas, ganado,
cultivos, insumos, contabilidad y trazabilidad.

## Autenticacion

Usa JWT (Bearer token). Obtenga su token via `POST /api/auth/login`.

```
curl -X POST /api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@agrop.com","password":"secreto"}'
```

Use el token en todas las solicitudes:

```
curl -H "Authorization: Bearer <token>" /api/animales/
```

## Modulos disponibles

- **Autenticacion** - Login, registro, gestion de tokens
- **Animales** - CRUD de animales, eventos, sanidad, pesajes, reproduccion
- **Cultivos** - Siembras, cosechas, tratamientos, labores de campo
- **Lotes** - Gestion de terrenos, mapas interactivos, analisis de suelo
- **Contabilidad** - Facturacion electronica, costos, ventas, nominas
- **Planeacion** - Plan de actividades, presupuestos
- **Alertas** - Notificaciones, webhooks, Telegram, Email, WhatsApp
- **Trazabilidad** - Trazabilidad completa de animales, cultivos y productos
- **Exportar** - Exportacion a PDF, Excel, CSV
- **Sistema** - Usuarios, roles, configuracion, diagnostico
- **Mensajeria** - Mensajeria interna entre usuarios del sistema
- **Farmacia** - Gestion de farmacia veterinaria, inventario y aplicaciones
- **Agua / Riego** - Fuentes de agua, consumo y calidad del agua
- **Alimentacion** - Alimentos, dietas y consumo diario

## Rate Limiting

Actualmente no hay limite de tasa implementado.

## Contacto

Soporte: soporte@agrop.com
    """,
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    contact={
        "name": "Equipo AgroP",
        "email": "soporte@agrop.com",
        "url": "https://agrop.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    terms_of_service="https://agrop.com/terminos",
    openapi_tags=tags_metadata,
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
app.include_router(templates_router)
app.include_router(vigilancia_router)
app.include_router(trazabilidad_router)
app.include_router(mensajeria_router)
app.include_router(farmacia_router)
app.include_router(bioseguridad_router)
app.include_router(certificaciones_router)
app.include_router(agua_router)
app.include_router(alimentacion_router)
app.include_router(picicultura_router)
app.include_router(suelos_router)
app.include_router(sensores_router)
app.include_router(forestal_router)
app.include_router(procedimientos.router)
app.include_router(recomendaciones_router)
app.include_router(cumplimiento_router)


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
