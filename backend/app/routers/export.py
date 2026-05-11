from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import io, csv, json
from app.database import get_db
from app.models import (
    Animal, Siembra, Venta, Costo, Ordeno, Pesaje, Sanidad,
    Usuario, Lote, Producto, Finca, Reproduccion, Lactancia,
    AlimentacionDiaria, MovimientoAnimal, PlanificacionPastoreo, LaborCampo,
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/export", tags=["Exportacion"])


def get_model(model_name: str):
    models = {
        "animales": Animal, "siembras": Siembra, "ventas": Venta,
        "costos": Costo, "ordenos": Ordeno, "pesajes": Pesaje,
        "sanidad": Sanidad, "usuarios": Usuario, "lotes": Lote,
        "productos": Producto, "reproduccion": Reproduccion,
        "lactancias": Lactancia, "alimentacion": AlimentacionDiaria,
        "movimientos": MovimientoAnimal, "pastoreo": PlanificacionPastoreo,
        "labores": LaborCampo,
    }
    return models.get(model_name)


def model_to_dict(obj):
    d = {}
    for c in obj.__table__.columns:
        val = getattr(obj, c.name)
        if isinstance(val, (date,)):
            val = str(val)
        d[c.name] = val
    return d


@router.get("/csv/{model_name}")
def export_csv(
    model_name: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    Model = get_model(model_name)
    if not Model:
        return {"error": "Modelo no encontrado"}

    records = db.query(Model).all()
    if not records:
        return {"error": "Sin datos"}

    output = io.StringIO()
    headers = [c.name for c in Model.__table__.columns]
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for r in records:
        writer.writerow(model_to_dict(r))

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={model_name}.csv"},
    )


@router.get("/excel/{model_name}")
def export_excel(
    model_name: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    Model = get_model(model_name)
    if not Model:
        return {"error": "Modelo no encontrado"}

    records = db.query(Model).all()
    if not records:
        return {"error": "Sin datos"}

    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment

    wb = Workbook()
    ws = wb.active
    ws.title = model_name

    headers = [c.name for c in Model.__table__.columns]

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="2E7D32", end_color="2E7D32", fill_type="solid")
    header_align = Alignment(horizontal="center")

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align

    for row, r in enumerate(records, 2):
        d = model_to_dict(r)
        for col, h in enumerate(headers, 1):
            ws.cell(row=row, column=col, value=d.get(h))

    ws.auto_filter.ref = ws.dimensions

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={model_name}.xlsx"},
    )


@router.get("/pdf/reporte-animales")
def export_pdf_animales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph

    animales = db.query(Animal).filter(Animal.activo == True).all()
    finca = db.query(Finca).first()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(f"Reporte de Animales - {finca.nombre if finca else 'AgroP'}", styles["Title"]))
    elements.append(Paragraph(f"Fecha: {date.today()}", styles["Normal"]))
    elements.append(Paragraph("", styles["Normal"]))

    data = [["Codigo", "Nombre", "Especie", "Raza", "Sexo", "Peso (kg)", "Estado"]]
    for a in animales:
        data.append([
            a.codigo or "", a.nombre or "", a.especie or "",
            a.raza.nombre if a.raza else "", a.sexo or "",
            str(float(a.peso_kg)) if a.peso_kg else "",
            "Activo" if a.activo else "Inactivo",
        ])

    t = Table(data)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_animales.pdf"},
    )


@router.get("/pdf/reporte-financiero")
def export_pdf_financiero(
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph

    qv = db.query(Venta)
    qc = db.query(Costo)
    if desde:
        qv = qv.filter(Venta.fecha >= desde)
        qc = qc.filter(Costo.fecha >= desde)
    if hasta:
        qv = qv.filter(Venta.fecha <= hasta)
        qc = qc.filter(Costo.fecha <= hasta)

    ventas = qv.all()
    costos = qc.all()
    total_ingresos = sum(float(v.total or 0) for v in ventas)
    total_gastos = sum(float(c.monto or 0) for c in costos)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Reporte Financiero - AgroP", styles["Title"]))
    elements.append(Paragraph(f"Periodo: {desde or 'Todos'} al {hasta or 'Hoy'}", styles["Normal"]))
    elements.append(Paragraph(f"Ingresos: ${total_ingresos:,.0f} | Gastos: ${total_gastos:,.0f} | Balance: ${total_ingresos - total_gastos:,.0f}", styles["Heading3"]))
    elements.append(Paragraph("", styles["Normal"]))

    elements.append(Paragraph("Ventas", styles["Heading2"]))
    data_v = [["Fecha", "Producto", "Cliente", "Cantidad", "Total"]]
    for v in ventas:
        prod = db.query(Producto).filter(Producto.id == v.producto_id).first()
        data_v.append([str(v.fecha), prod.nombre if prod else "", v.cliente or "", str(float(v.cantidad)), f"${float(v.total or 0):,.0f}"])

    t = Table(data_v)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTSIZE", (0, 0), (-1, -1), 7), ("GRID", (0, 0), (-1, -1), 0.5, colors.grey)]))
    elements.append(t)

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=reporte_financiero.pdf"},
    )
