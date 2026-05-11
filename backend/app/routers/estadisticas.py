from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models import (
    Animal, Siembra, Cosecha, Venta, Costo, Produccion, Producto,
    Lote, AnalisisSuelo, Usuario, EventoAnimal, Colmena, CosechaMiel,
    ProduccionHuevos, Camada, LoteAves,
)
from app.schemas import DashboardStats
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/estadisticas", tags=["Estadísticas"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(finca_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    hoy = date.today()
    inicio_mes = hoy.replace(day=1)

    total_animales = db.query(func.count(Animal.id)).filter(Animal.activo == True).scalar() or 0
    total_bovinos = db.query(func.count(Animal.id)).filter(Animal.especie == "bovino", Animal.activo == True).scalar() or 0
    total_porcinos = db.query(func.count(Animal.id)).filter(Animal.especie == "porcino", Animal.activo == True).scalar() or 0
    total_aves = db.query(func.count(Animal.id)).filter(Animal.especie == "aviar", Animal.activo == True).scalar() or 0
    total_caprinos = db.query(func.count(Animal.id)).filter(Animal.especie == "caprino", Animal.activo == True).scalar() or 0
    total_ovinos = db.query(func.count(Animal.id)).filter(Animal.especie == "ovino", Animal.activo == True).scalar() or 0
    total_equinos = db.query(func.count(Animal.id)).filter(Animal.especie == "equino", Animal.activo == True).scalar() or 0

    total_siembras_activas = db.query(func.count(Siembra.id)).filter(Siembra.estado == "activo").scalar() or 0
    area_cultivada = db.query(func.sum(Siembra.area_ha)).filter(Siembra.estado == "activo").scalar() or 0

    leche = (db.query(func.sum(Produccion.cantidad))
             .join(Producto)
             .filter(Producto.tipo == "leche", Produccion.fecha >= inicio_mes)
             .scalar()) or 0

    ingresos_mes = (db.query(func.sum(Venta.total))
                    .filter(Venta.fecha >= inicio_mes)
                    .scalar()) or 0

    gastos_mes = (db.query(func.sum(Costo.monto))
                  .filter(Costo.fecha >= inicio_mes)
                  .scalar()) or 0

    from app.models import Colmena, ProduccionHuevos
    huevos_hoy = db.query(func.sum(ProduccionHuevos.huevos_puestos)).filter(ProduccionHuevos.fecha == hoy).scalar() or 0
    colmenas_activas = db.query(func.count(Colmena.id)).filter(Colmena.estado == "activa").scalar() or 0

    return DashboardStats(
        total_animales=int(total_animales),
        total_bovinos=int(total_bovinos),
        total_porcinos=int(total_porcinos),
        total_aves=int(total_aves),
        total_caprinos=int(total_caprinos),
        total_ovinos=int(total_ovinos),
        total_equinos=int(total_equinos),
        huevos_hoy=int(huevos_hoy),
        colmenas_activas=int(colmenas_activas),
        total_siembras_activas=int(total_siembras_activas),
        area_cultivada_ha=float(area_cultivada or 0),
        litros_leche_mes=float(leche),
        ingresos_mes=float(ingresos_mes),
        gastos_mes=float(gastos_mes),
        balance_mes=float(ingresos_mes) - float(gastos_mes),
    )


@router.get("/animales/muertes-por-especie")
def muertes_por_especie(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return [
        {"especie": r[0], "total": r[1], "muertes": r[2], "porcentaje": round((r[2] / r[1] * 100) if r[1] else 0, 2)}
        for r in db.query(
            Animal.especie,
            func.count(Animal.id),
            func.sum(func.if_(Animal.motivo_salida == "muerte", 1, 0))
        ).group_by(Animal.especie).all()
    ]


@router.get("/cultivos/rendimientos")
def rendimientos_por_cultivo(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return [
        {"cultivo": r[0], "siembras": r[1], "rendimiento_total_kg": float(r[2] or 0), "rendimiento_promedio_ha": float(r[3] or 0)}
        for r in db.query(
            Siembra.cultivo,
            func.count(Siembra.id),
            func.sum(Siembra.rendimiento_kg),
            func.avg(Siembra.rendimiento_ha)
        ).filter(Siembra.estado == "cosechado").group_by(Siembra.cultivo).all()
    ]


@router.get("/suelos/ph-por-lote")
def ph_por_lote(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    sub = (
        db.query(
            AnalisisSuelo.lote_id,
            func.max(AnalisisSuelo.fecha).label("ultima")
        )
        .group_by(AnalisisSuelo.lote_id)
        .subquery()
    )
    resultados = (
        db.query(Lote.nombre, AnalisisSuelo.ph, AnalisisSuelo.nitrogeno,
                  AnalisisSuelo.humedad, AnalisisSuelo.fecha)
        .join(sub, AnalisisSuelo.lote_id == sub.c.lote_id)
        .join(Lote, AnalisisSuelo.lote_id == Lote.id)
        .filter(AnalisisSuelo.fecha == sub.c.ultima)
        .all()
    )
    return [
        {"lote": r[0], "ph": float(r[1]) if r[1] else None, "nitrogeno": float(r[2]) if r[2] else None,
         "humedad": float(r[3]) if r[3] else None, "fecha": str(r[4])}
        for r in resultados
    ]


@router.get("/finanzas/ingresos-vs-gastos")
def ingresos_vs_gastos(
    meses: int = 6,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    desde = date.today().replace(day=1) - timedelta(days=30 * (meses - 1))
    ingresos = (
        db.query(func.date_format(Venta.fecha, "%Y-%m"), func.sum(Venta.total))
        .filter(Venta.fecha >= desde)
        .group_by(func.date_format(Venta.fecha, "%Y-%m"))
        .all()
    )
    gastos = (
        db.query(func.date_format(Costo.fecha, "%Y-%m"), func.sum(Costo.monto))
        .filter(Costo.fecha >= desde)
        .group_by(func.date_format(Costo.fecha, "%Y-%m"))
        .all()
    )
    ing_dict = {r[0]: float(r[1] or 0) for r in ingresos}
    gas_dict = {r[0]: float(r[1] or 0) for r in gastos}
    meses_labels = []
    for i in range(meses):
        m = date.today().replace(day=1) - timedelta(days=30 * i)
        label = m.strftime("%Y-%m")
        meses_labels.append(label)
    meses_labels.reverse()
    return [
        {"mes": m, "ingresos": ing_dict.get(m, 0), "gastos": gas_dict.get(m, 0),
         "balance": ing_dict.get(m, 0) - gas_dict.get(m, 0)}
        for m in meses_labels
    ]


@router.get("/eventos/tipos-frecuencia")
def tipos_eventos_frecuencia(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return [
        {"tipo": r[0], "cantidad": r[1]}
        for r in db.query(EventoAnimal.tipo_evento, func.count(EventoAnimal.id))
        .group_by(EventoAnimal.tipo_evento).order_by(func.count(EventoAnimal.id).desc()).all()
    ]


@router.get("/especies/resumen")
def resumen_especies(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    especies = db.query(Animal.especie, func.count(Animal.id)).filter(Animal.activo == True).group_by(Animal.especie).all()
    huevos_hoy = db.query(func.sum(ProduccionHuevos.huevos_puestos)).filter(ProduccionHuevos.fecha == date.today()).scalar() or 0
    miel_total = db.query(func.sum(CosechaMiel.kg_miel)).scalar() or 0
    colmenas = db.query(func.count(Colmena.id)).filter(Colmena.estado == "activa").scalar() or 0

    # Camadas
    stats_camadas = db.query(
        func.count(Camada.id),
        func.avg(Camada.lechones_nacidos),
    ).first()

    # Lotes aves activos
    lotes_aves = db.query(func.count(LoteAves.id)).filter(LoteAves.activo == True).scalar() or 0

    return {
        "especies": [{"especie": e[0], "cantidad": e[1]} for e in especies],
        "porcinos_camadas": stats_camadas[0] or 0,
        "porcinos_promedio_lechones": round(float(stats_camadas[1] or 0), 1),
        "avicola_huevos_hoy": int(huevos_hoy),
        "avicola_lotes": lotes_aves,
        "apicola_miel_total_kg": float(miel_total),
        "apicola_colmenas_activas": colmenas,
    }
