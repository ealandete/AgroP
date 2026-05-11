def test_list_siembras_empty(client, auth_headers):
    resp = client.get("/api/cultivos/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_siembra(client, auth_headers, test_lote):
    resp = client.post("/api/cultivos/", headers=auth_headers, json={
        "lote_id": test_lote.id,
        "cultivo": "maiz",
        "fecha_siembra": "2024-01-15",
        "area_ha": 5.0,
        "metodo_siembra": "directa",
        "estado": "activo",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["cultivo"] == "maiz"
    assert data["lote_id"] == test_lote.id
    assert data["estado"] == "activo"
    assert "id" in data


def test_create_siembra_missing_fields(client, auth_headers):
    resp = client.post("/api/cultivos/", headers=auth_headers, json={})
    assert resp.status_code == 422


def test_get_siembra(client, auth_headers, test_lote):
    create = client.post("/api/cultivos/", headers=auth_headers, json={
        "lote_id": test_lote.id, "cultivo": "frijol",
        "fecha_siembra": "2024-02-01",
    })
    siembra_id = create.json()["id"]

    resp = client.get(f"/api/cultivos/{siembra_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["cultivo"] == "frijol"


def test_get_siembra_not_found(client, auth_headers):
    resp = client.get("/api/cultivos/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_update_siembra(client, auth_headers, test_lote):
    create = client.post("/api/cultivos/", headers=auth_headers, json={
        "lote_id": test_lote.id, "cultivo": "arroz",
        "fecha_siembra": "2024-03-01",
    })
    siembra_id = create.json()["id"]

    resp = client.put(f"/api/cultivos/{siembra_id}", headers=auth_headers, json={
        "lote_id": test_lote.id, "cultivo": "arroz",
        "fecha_siembra": "2024-03-01", "area_ha": 8.0,
        "estado": "activo",
    })
    assert resp.status_code == 200
    assert float(resp.json()["area_ha"]) == 8.0


def test_list_siembras_filtered(client, auth_headers, test_lote):
    client.post("/api/cultivos/", headers=auth_headers, json={
        "lote_id": test_lote.id, "cultivo": "maiz",
        "fecha_siembra": "2024-01-01", "estado": "activo",
    })
    client.post("/api/cultivos/", headers=auth_headers, json={
        "lote_id": test_lote.id, "cultivo": "cafe",
        "fecha_siembra": "2024-01-01", "estado": "cosechado",
    })

    resp = client.get("/api/cultivos/?estado=activo", headers=auth_headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["cultivo"] == "maiz"

    resp = client.get("/api/cultivos/?cultivo=cafe", headers=auth_headers)
    assert len(resp.json()) == 1


def test_list_variedades(client, auth_headers):
    resp = client.get("/api/cultivos/variedades/", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def _get_db():
    from app.database import get_db
    from app.main import app
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    return db, gen


def test_list_variedades_filtered(client, auth_headers):
    from app.models import VariedadCultivo
    db, gen = _get_db()
    try:
        db.add(VariedadCultivo(cultivo="maiz", variedad="ICA V-305", dias_ciclo=120))
        db.add(VariedadCultivo(cultivo="frijol", variedad="ICA Cerinza", dias_ciclo=90))
        db.commit()
    finally:
        gen.close()

    resp = client.get("/api/cultivos/variedades/?cultivo=maiz", headers=auth_headers)
    assert len(resp.json()) == 1


def test_validar_uso_lote(client, auth_headers, test_lote):
    resp = client.get(f"/api/cultivos/lotes/{test_lote.id}/validar-uso", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["lote_id"] == test_lote.id
    assert float(data["area_ha"]) == 10.0
    assert data["area_disponible"] > 0
    assert isinstance(data["warnings"], list)


def test_validar_uso_lote_not_found(client, auth_headers):
    resp = client.get("/api/cultivos/lotes/99999/validar-uso", headers=auth_headers)
    assert resp.status_code == 404
