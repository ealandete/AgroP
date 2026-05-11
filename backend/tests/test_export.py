def test_export_csv_animales(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "EXP1", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })

    resp = client.get("/api/export/csv/animales", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/csv; charset=utf-8"
    content = resp.text
    assert "codigo" in content
    assert "EXP1" in content


def test_export_csv_siembras(client, auth_headers, test_lote):
    client.post("/api/cultivos/", headers=auth_headers, json={
        "lote_id": test_lote.id, "cultivo": "maiz",
        "fecha_siembra": "2024-01-01",
    })

    resp = client.get("/api/export/csv/siembras", headers=auth_headers)
    assert resp.status_code == 200
    assert "cultivo" in resp.text
    assert "maiz" in resp.text


def test_export_excel_animales(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "XLS1", "especie": "bovino", "sexo": "M",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })

    resp = client.get("/api/export/excel/animales", headers=auth_headers)
    assert resp.status_code == 200
    assert "spreadsheetml" in resp.headers["content-type"]


def test_export_pdf_animales(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "PDF1", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })

    resp = client.get("/api/export/pdf/reporte-animales", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"


def test_export_pdf_financiero(client, auth_headers):
    resp = client.get("/api/export/pdf/reporte-financiero", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"


def test_export_csv_invalid_model(client, auth_headers):
    resp = client.get("/api/export/csv/noexiste", headers=auth_headers)
    assert resp.status_code == 200
    assert "error" in resp.json()
