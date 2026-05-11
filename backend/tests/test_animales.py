def test_list_animales_empty(client, auth_headers):
    resp = client.get("/api/animales/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_animal(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    resp = client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "B001",
        "nombre": "Toro Test",
        "especie": "bovino",
        "sexo": "M",
        "fecha_ingreso": "2024-01-15",
        "finca_id": finca.id,
        "lote_id": test_lote.id,
        "peso_kg": 450.0,
        "color": "Negro",
        "estado_origen": "propio",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["codigo"] == "B001"
    assert data["especie"] == "bovino"
    assert data["sexo"] == "M"
    assert data["activo"] is True
    assert data["id"] > 0


def test_create_animal_missing_fields(client, auth_headers, test_user):
    user, finca, rol = test_user
    resp = client.post("/api/animales/", headers=auth_headers, json={
        "finca_id": finca.id,
    })
    assert resp.status_code == 422


def test_get_animal(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    create = client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "B002", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-02-01", "finca_id": finca.id,
        "lote_id": test_lote.id,
    })
    animal_id = create.json()["id"]

    resp = client.get(f"/api/animales/{animal_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["codigo"] == "B002"


def test_get_animal_not_found(client, auth_headers):
    resp = client.get("/api/animales/99999", headers=auth_headers)
    assert resp.status_code == 404


def test_update_animal(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    create = client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "B003", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-03-01", "finca_id": finca.id,
        "lote_id": test_lote.id, "peso_kg": 300.0,
    })
    animal_id = create.json()["id"]

    resp = client.put(f"/api/animales/{animal_id}", headers=auth_headers, json={
        "codigo": "B003-upd", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-03-01", "finca_id": finca.id,
        "lote_id": test_lote.id, "peso_kg": 350.0,
    })
    assert resp.status_code == 200
    assert resp.json()["peso_kg"] == 350.0
    assert resp.json()["codigo"] == "B003-upd"


def test_delete_animal_soft(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    create = client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "B004", "especie": "bovino", "sexo": "M",
        "fecha_ingreso": "2024-04-01", "finca_id": finca.id,
        "lote_id": test_lote.id,
    })
    animal_id = create.json()["id"]

    resp = client.delete(f"/api/animales/{animal_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["detail"] == "Animal desactivado"

    get = client.get(f"/api/animales/{animal_id}", headers=auth_headers)
    assert get.json()["activo"] is False


def test_list_animals_filtered(client, auth_headers, test_user, test_lote):
    user, finca, rol = test_user
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "BOV1", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "POR1", "especie": "porcino", "sexo": "M",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })

    resp = client.get("/api/animales/?especie=bovino", headers=auth_headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["especie"] == "bovino"


def test_animal_stats(client, auth_headers, test_user):
    user, finca, rol = test_user
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "S1", "especie": "bovino", "sexo": "H",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })
    client.post("/api/animales/", headers=auth_headers, json={
        "codigo": "S2", "especie": "bovino", "sexo": "M",
        "fecha_ingreso": "2024-01-01", "finca_id": finca.id,
    })

    resp = client.get("/api/animales/stats/resumen", headers=auth_headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert len(stats) >= 1
    bovino = next(s for s in stats if s["especie"] == "bovino")
    assert bovino["total"] >= 2


def test_list_razas(client, auth_headers):
    resp = client.get("/api/animales/razas/", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
