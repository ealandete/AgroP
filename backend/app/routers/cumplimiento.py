from datetime import date, timedelta
from fastapi import APIRouter, HTTPException
from typing import Optional
import random

router = APIRouter(prefix="/api/cumplimiento", tags=["Cumplimiento Normativo"])

REQUISITOS = [
    {"codigo": "ICA-001", "categoria": "ICA", "requisito": "Registro predio ante ICA", "norma": "Resolución ICA 20148/2016", "critico": True},
    {"codigo": "ICA-002", "categoria": "ICA", "requisito": "Identificación animal (chapeta/chip)", "norma": "Resolución ICA 20148/2016", "critico": True},
    {"codigo": "ICA-003", "categoria": "ICA", "requisito": "Registro de vacunación aftosa", "norma": "Resolución ICA 20148/2016", "critico": True},
    {"codigo": "ICA-004", "categoria": "ICA", "requisito": "Registro de insumos agropecuarios", "norma": "Decreto 1840/1994", "critico": True},
    {"codigo": "ICA-005", "categoria": "ICA", "requisito": "Plan sanitario predial", "norma": "Resolución ICA 20148/2016", "critico": False},
    {"codigo": "ICA-006", "categoria": "ICA", "requisito": "Guía sanitaria de movilización", "norma": "Resolución ICA 20148/2016", "critico": True},
    {"codigo": "ICA-007", "categoria": "ICA", "requisito": "Registro de productos veterinarios", "norma": "Decreto 1840/1994", "critico": False},
    {"codigo": "DAN-001", "categoria": "DIAN", "requisito": "Registro Único Tributario (RUT)", "norma": "Decreto 1070/2015", "critico": True},
    {"codigo": "DAN-002", "categoria": "DIAN", "requisito": "Facturación electrónica", "norma": "Resolución DIAN 000042/2020", "critico": True},
    {"codigo": "DAN-003", "categoria": "DIAN", "requisito": "Declaración IVA mensual", "norma": "Estatuto Tributario", "critico": True},
    {"codigo": "DAN-004", "categoria": "DIAN", "requisito": "Retención en la fuente", "norma": "Estatuto Tributario", "critico": True},
    {"codigo": "DAN-005", "categoria": "DIAN", "requisito": "Declaración de renta anual", "norma": "Estatuto Tributario", "critico": True},
    {"codigo": "DAN-006", "categoria": "DIAN", "requisito": "Registro de facturación electrónica (RFE)", "norma": "Resolución DIAN 000042/2020", "critico": True},
    {"codigo": "DAN-007", "categoria": "DIAN", "requisito": "Declaración ICA municipal", "norma": "Estatuto Tributario", "critico": True},
    {"codigo": "LAB-001", "categoria": "Laboral", "requisito": "Contrato laboral escrito", "norma": "Código Sustantivo del Trabajo", "critico": True},
    {"codigo": "LAB-002", "categoria": "Laboral", "requisito": "Afiliación EPS trabajadores", "norma": "Ley 100/1993", "critico": True},
    {"codigo": "LAB-003", "categoria": "Laboral", "requisito": "Afiliación ARL", "norma": "Decreto 1295/1994", "critico": True},
    {"codigo": "LAB-004", "categoria": "Laboral", "requisito": "Pago de nómina y parafiscales", "norma": "Ley 1607/2012", "critico": True},
    {"codigo": "LAB-005", "categoria": "Laboral", "requisito": "Reglamento interno de trabajo", "norma": "Código Sustantivo del Trabajo", "critico": False},
    {"codigo": "LAB-006", "categoria": "Laboral", "requisito": "SST - COPASST", "norma": "Decreto 1072/2015", "critico": True},
    {"codigo": "LAB-007", "categoria": "Laboral", "requisito": "SST - Matriz de peligros", "norma": "Resolución 0312/2019", "critico": True},
    {"codigo": "LAB-008", "categoria": "Laboral", "requisito": "Afiliación fondo de pensiones", "norma": "Ley 100/1993", "critico": True},
    {"codigo": "LAB-009", "categoria": "Laboral", "requisito": "Caja de compensación familiar", "norma": "Ley 21/1982", "critico": True},
    {"codigo": "AMB-001", "categoria": "Ambiental", "requisito": "Permiso de aprovechamiento forestal", "norma": "Decreto 1791/1996", "critico": True},
    {"codigo": "AMB-002", "categoria": "Ambiental", "requisito": "Concesión de aguas", "norma": "Decreto 1076/2015", "critico": True},
    {"codigo": "AMB-003", "categoria": "Ambiental", "requisito": "Plan de manejo ambiental", "norma": "Ley 99/1993", "critico": False},
    {"codigo": "AMB-004", "categoria": "Ambiental", "requisito": "Manejo de residuos sólidos", "norma": "Decreto 1076/2015", "critico": False},
    {"codigo": "AMB-005", "categoria": "Ambiental", "requisito": "Permiso de vertimientos", "norma": "Decreto 1076/2015", "critico": True},
    {"codigo": "AMB-006", "categoria": "Ambiental", "requisito": "Registro de generadores de residuos peligrosos", "norma": "Decreto 4741/2005", "critico": True},
    {"codigo": "MUN-001", "categoria": "Municipal", "requisito": "Registro comercial municipal", "norma": "Ley 232/1995", "critico": True},
    {"codigo": "MUN-002", "categoria": "Municipal", "requisito": "Permiso de uso del suelo", "norma": "Ley 388/1997", "critico": True},
    {"codigo": "MUN-003", "categoria": "Municipal", "requisito": "Licencia de construcción (si aplica)", "norma": "Decreto 1077/2015", "critico": False},
    {"codigo": "MUN-004", "categoria": "Municipal", "requisito": "Pago de impuesto predial", "norma": "Ley 44/1990", "critico": True},
    {"codigo": "MUN-005", "categoria": "Municipal", "requisito": "Registro de propiedad rural (SNR)", "norma": "Decreto 1250/1970", "critico": True},
]

NORMATIVIDAD = [
    {"numero": "Resolución ICA 20148/2016", "titulo": "Requisitos sanitarios para predios pecuarios", "descripcion": "Establece los requisitos sanitarios para la obtención del registro de predios pecuarios, identificación animal y planes sanitarios.", "aplica_a": "Todas las fincas con animales", "categoria": "ICA"},
    {"numero": "Decreto 1840/1994", "titulo": "Registro de insumos agropecuarios", "descripcion": "Por el cual se reglamenta el registro y control de insumos agropecuarios, fertilizantes, plaguicidas y productos veterinarios.", "aplica_a": "Todas las fincas", "categoria": "ICA"},
    {"numero": "Resolución ICA 001/2018", "titulo": "Ciclo de vacunación contra fiebre aftosa", "descripcion": "Establece los ciclos obligatorios de vacunación contra la fiebre aftosa en todo el territorio nacional.", "aplica_a": "Fincas con bovinos y porcinos", "categoria": "ICA"},
    {"numero": "Resolución ICA 6974/2020", "titulo": "Guía sanitaria de movilización animal", "descripcion": "Regula la expedición de guías sanitarias para la movilización de animales en el territorio nacional.", "aplica_a": "Todas las fincas con animales", "categoria": "ICA"},
    {"numero": "Decreto 1070/2015", "titulo": "Registro Único Tributario (RUT)", "descripcion": "Decreto reglamentario del Estatuto Tributario que establece la obligación de inscripción en el RUT.", "aplica_a": "Todas las fincas", "categoria": "DIAN"},
    {"numero": "Resolución DIAN 000042/2020", "titulo": "Facturación electrónica", "descripcion": "Establece la obligatoriedad de la facturación electrónica para todos los contribuyentes.", "aplica_a": "Todas las fincas", "categoria": "DIAN"},
    {"numero": "Estatuto Tributario", "titulo": "Declaración de IVA", "descripcion": "Obligación de presentar declaración de IVA de forma mensual o cuatrimestral según el régimen.", "aplica_a": "Fincas responsables de IVA", "categoria": "DIAN"},
    {"numero": "Estatuto Tributario", "titulo": "Retención en la fuente", "descripcion": "Obligación de practicar retención en la fuente en pagos sujetos a esta.", "aplica_a": "Fincas con trabajadores y proveedores", "categoria": "DIAN"},
    {"numero": "Estatuto Tributario", "titulo": "Declaración de renta anual", "descripcion": "Obligación de presentar declaración de renta y complementarios.", "aplica_a": "Fincas con ingresos >= 4.500 UVT", "categoria": "DIAN"},
    {"numero": "Ley 100/1993", "titulo": "Sistema de Seguridad Social Integral", "descripcion": "Establece la obligación de afiliación a EPS, pensiones y ARL para todos los trabajadores.", "aplica_a": "Todas las fincas con empleados", "categoria": "Laboral"},
    {"numero": "Código Sustantivo del Trabajo", "titulo": "Contrato laboral y reglamento interno", "descripcion": "Obligación de tener contratos laborales escritos y reglamento interno de trabajo.", "aplica_a": "Todas las fincas con empleados", "categoria": "Laboral"},
    {"numero": "Decreto 1295/1994", "titulo": "Afiliación ARL", "descripcion": "Obligación de afiliar a todos los trabajadores al Sistema General de Riesgos Laborales.", "aplica_a": "Todas las fincas con empleados", "categoria": "Laboral"},
    {"numero": "Ley 1607/2012", "titulo": "Pago de nómina y parafiscales", "descripcion": "Obligaciones en materia de pago de nómina, seguridad social y parafiscales.", "aplica_a": "Todas las fincas con empleados", "categoria": "Laboral"},
    {"numero": "Decreto 1072/2015", "titulo": "SST - COPASST", "descripcion": "Obligación de conformar el Comité Paritario de Seguridad y Salud en el Trabajo.", "aplica_a": "Fincas con más de 10 empleados", "categoria": "Laboral"},
    {"numero": "Resolución 0312/2019", "titulo": "SST - Estándares mínimos", "descripcion": "Establece los estándares mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo.", "aplica_a": "Todas las fincas con empleados", "categoria": "Laboral"},
    {"numero": "Ley 21/1982", "titulo": "Caja de compensación familiar", "descripcion": "Obligación de afiliar a los trabajadores a una caja de compensación familiar.", "aplica_a": "Todas las fincas con empleados", "categoria": "Laboral"},
    {"numero": "Decreto 1791/1996", "titulo": "Permiso de aprovechamiento forestal", "descripcion": "Regula el aprovechamiento de recursos forestales y la obtención de permisos.", "aplica_a": "Fincas con bosques o árboles maderables", "categoria": "Ambiental"},
    {"numero": "Decreto 1076/2015", "titulo": "Concesión de aguas", "descripcion": "Regula la obtención de concesiones para el uso de aguas superficiales y subterráneas.", "aplica_a": "Fincas que usan agua de fuentes naturales", "categoria": "Ambiental"},
    {"numero": "Ley 99/1993", "titulo": "Plan de manejo ambiental", "descripcion": "Establece la obligación de presentar planes de manejo ambiental para actividades que afecten el ambiente.", "aplica_a": "Fincas con impacto ambiental significativo", "categoria": "Ambiental"},
    {"numero": "Decreto 4741/2005", "titulo": "Registro de generadores de residuos peligrosos", "descripcion": "Regula la generación y manejo de residuos peligrosos y la obligación de registro.", "aplica_a": "Fincas que generan residuos peligrosos", "categoria": "Ambiental"},
    {"numero": "Ley 232/1995", "titulo": "Registro comercial municipal", "descripcion": "Obligación de inscripción en el registro mercantil de la cámara de comercio local.", "aplica_a": "Todas las fincas con actividad comercial", "categoria": "Municipal"},
    {"numero": "Ley 388/1997", "titulo": "Permiso de uso del suelo", "descripcion": "Regula el uso del suelo y establece la necesidad de permisos municipales.", "aplica_a": "Todas las fincas", "categoria": "Municipal"},
    {"numero": "Decreto 1077/2015", "titulo": "Licencia de construcción", "descripcion": "Regula la obtención de licencias de construcción para edificaciones rurales.", "aplica_a": "Fincas con construcciones nuevas", "categoria": "Municipal"},
    {"numero": "Ley 44/1990", "titulo": "Impuesto predial", "descripcion": "Establece el impuesto predial unificado como obligación anual de todo propietario.", "aplica_a": "Todas las fincas", "categoria": "Municipal"},
    {"numero": "Decreto 1250/1970", "titulo": "Registro de propiedad rural (SNR)", "descripcion": "Regula el registro de la propiedad rural ante la Superintendencia de Notariado y Registro.", "aplica_a": "Todas las fincas", "categoria": "Municipal"},
]

VENCIMIENTOS_BASE = [
    {"id": 1, "titulo": "Declaración IVA mensual", "tipo": "tributario", "dias_aviso": 15, "categoria": "DIAN", "critico": True},
    {"id": 2, "titulo": "Declaración ReteFuente", "tipo": "tributario", "dias_aviso": 20, "categoria": "DIAN", "critico": True},
    {"id": 3, "titulo": "Declaración ICA municipal", "tipo": "tributario", "dias_aviso": 25, "categoria": "DIAN", "critico": True},
    {"id": 4, "titulo": "Vacunación aftosa - 1er ciclo", "tipo": "sanitario", "dias_aviso": 45, "categoria": "ICA", "critico": True},
    {"id": 5, "titulo": "Vacunación aftosa - 2do ciclo", "tipo": "sanitario", "dias_aviso": 120, "categoria": "ICA", "critico": True},
    {"id": 6, "titulo": "Renovación registro predial ICA", "tipo": "registro", "dias_aviso": 365, "categoria": "ICA", "critico": True},
    {"id": 7, "titulo": "Renovación Certificación BPA", "tipo": "certificacion", "dias_aviso": 180, "categoria": "ICA", "critico": False},
    {"id": 8, "titulo": "Declaración de renta anual", "tipo": "tributario", "dias_aviso": 60, "categoria": "DIAN", "critico": True},
    {"id": 9, "titulo": "Pago seguridad social empleados", "tipo": "laboral", "dias_aviso": 5, "categoria": "Laboral", "critico": True},
    {"id": 10, "titulo": "Renovación permiso concesión de aguas", "tipo": "ambiental", "dias_aviso": 300, "categoria": "Ambiental", "critico": True},
    {"id": 11, "titulo": "Pago impuesto predial", "tipo": "municipal", "dias_aviso": 90, "categoria": "Municipal", "critico": True},
    {"id": 12, "titulo": "Renovación registro mercantil", "tipo": "registro", "dias_aviso": 120, "categoria": "Municipal", "critico": True},
    {"id": 13, "titulo": "Actualización RUT", "tipo": "tributario", "dias_aviso": 365, "categoria": "DIAN", "critico": False},
    {"id": 14, "titulo": "Entrega informe SST anual", "tipo": "laboral", "dias_aviso": 30, "categoria": "Laboral", "critico": True},
    {"id": 15, "titulo": "Renovación permiso aprovechamiento forestal", "tipo": "ambiental", "dias_aviso": 180, "categoria": "Ambiental", "critico": True},
]


@router.get("/requisitos")
def listar_requisitos(categoria: Optional[str] = None):
    if categoria:
        return [r for r in REQUISITOS if r["categoria"].lower() == categoria.lower()]
    return REQUISITOS


@router.get("/normatividad")
def listar_normatividad(categoria: Optional[str] = None):
    if categoria:
        return [n for n in NORMATIVIDAD if n["categoria"].lower() == categoria.lower()]
    return NORMATIVIDAD


@router.get("/{finca_id}/checklist")
def checklist_finca(finca_id: int):
    random.seed(finca_id)
    items = []
    cumplidos = 0
    for r in REQUISITOS:
        rand = random.random()
        if rand < 0.4:
            status = "cumple"
            cumplidos += 1
        elif rand < 0.7:
            status = "cumple"
            cumplidos += 1
        elif rand < 0.9:
            status = "parcial"
        else:
            status = "no_cumple"
        items.append({
            "codigo": r["codigo"],
            "categoria": r["categoria"],
            "requisito": r["requisito"],
            "norma": r["norma"],
            "critico": r["critico"],
            "status": status,
            "last_update": (date.today() - timedelta(days=random.randint(1, 90))).isoformat(),
            "notes": "" if status == "cumple" else ("Pendiente de gestión" if status == "no_cumple" else "En proceso de implementación"),
        })
    total = len(items)
    return {
        "finca_id": finca_id,
        "total_requisitos": total,
        "cumplidos": cumplidos,
        "no_cumplidos": total - cumplidos,
        "porcentaje_cumplimiento": round((cumplidos / total) * 100, 1),
        "items": items,
    }


@router.get("/{finca_id}/vencimientos")
def vencimientos_finca(finca_id: int):
    random.seed(finca_id + 1000)
    hoy = date.today()
    resultados = []
    for v in VENCIMIENTOS_BASE:
        dias = v["dias_aviso"] + random.randint(-10, 30)
        fecha_venc = hoy + timedelta(days=dias)
        resultados.append({
            "id": v["id"],
            "titulo": v["titulo"],
            "tipo": v["tipo"],
            "categoria": v["categoria"],
            "critico": v["critico"],
            "fecha_vencimiento": fecha_venc.isoformat(),
            "dias_restantes": dias,
            "urgencia": "critica" if dias <= 15 else ("media" if dias <= 45 else "baja"),
        })
    return sorted(resultados, key=lambda x: x["dias_restantes"])


@router.get("/resumen/{finca_id}")
def resumen_cumplimiento(finca_id: int):
    random.seed(finca_id + 2000)
    total = len(REQUISITOS)
    categorias = {}
    for r in REQUISITOS:
        cat = r["categoria"]
        if cat not in categorias:
            categorias[cat] = {"total": 0, "cumplidos": 0, "criticos": 0, "criticos_cumplidos": 0}
        categorias[cat]["total"] += 1
        if r["critico"]:
            categorias[cat]["criticos"] += 1
        if random.random() < 0.65:
            categorias[cat]["cumplidos"] += 1
            if r["critico"]:
                categorias[cat]["criticos_cumplidos"] += 1

    cumplidos_total = sum(c["cumplidos"] for c in categorias.values())
    vencimientos_proximos = sum(1 for v in VENCIMIENTOS_BASE if v["dias_aviso"] <= 30)
    criticos_incumplidos = sum(c["criticos"] - c["criticos_cumplidos"] for c in categorias.values())

    return {
        "finca_id": finca_id,
        "porcentaje_general": round((cumplidos_total / total) * 100, 1),
        "total_requisitos": total,
        "cumplidos": cumplidos_total,
        "vencimientos_proximos": vencimientos_proximos,
        "criticos_incumplidos": criticos_incumplidos,
        "categorias": {
            k: {
                **v,
                "porcentaje": round((v["cumplidos"] / v["total"]) * 100, 1) if v["total"] else 0,
            }
            for k, v in categorias.items()
        },
    }
