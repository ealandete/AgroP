from fastapi.testclient import TestClient


def test_health(client: TestClient):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["app"] == "AgroP"


def _get_db():
    from app.database import get_db
    from app.main import app
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    return db, gen


def test_register(client: TestClient):
    from app.models import Rol, Finca
    db, gen = _get_db()
    try:
        rol = Rol(nombre="admin", descripcion="Administrador")
        db.add(rol)
        db.flush()
        finca = Finca(nombre="Test")
        db.add(finca)
        db.commit()
    finally:
        gen.close()

    resp = client.post("/api/auth/register", json={
        "email": "nuevo@test.com",
        "password": "pass1234",
        "nombre": "Nuevo",
        "apellido": "User",
        "rol_id": 1,
        "finca_id": 1,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "nuevo@test.com"
    assert data["nombre"] == "Nuevo"
    assert "id" in data


def test_register_duplicate_email(client: TestClient):
    from app.models import Usuario, Rol, Finca
    from app.utils.auth import hash_password
    db, gen = _get_db()
    try:
        rol = Rol(nombre="admin")
        db.add(rol)
        db.flush()
        finca = Finca(nombre="Test")
        db.add(finca)
        db.flush()
        user = Usuario(
            email="dup@test.com", password_hash=hash_password("1234"),
            nombre="Dup", rol_id=rol.id, finca_id=finca.id,
        )
        db.add(user)
        db.commit()
    finally:
        gen.close()

    resp = client.post("/api/auth/register", json={
        "email": "dup@test.com", "password": "pass",
        "nombre": "Dup2", "rol_id": 1, "finca_id": 1,
    })
    assert resp.status_code == 400
    assert "ya está registrado" in resp.json()["detail"]


def test_login_success(client: TestClient, test_user):
    resp = client.post("/api/auth/login", json={
        "email": "test@agrop.com",
        "password": "test1234",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["usuario"]["email"] == "test@agrop.com"


def test_login_invalid_password(client: TestClient, test_user):
    resp = client.post("/api/auth/login", json={
        "email": "test@agrop.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
    assert "incorrectos" in resp.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    resp = client.post("/api/auth/login", json={
        "email": "noexiste@test.com",
        "password": "pass1234",
    })
    assert resp.status_code == 401


def test_me_endpoint(client: TestClient, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@agrop.com"


def test_me_unauthorized(client: TestClient):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_invalid_token(client: TestClient):
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401


def test_list_usuarios(client: TestClient, auth_headers, test_user):
    resp = client.get("/api/auth/usuarios", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(u["email"] == "test@agrop.com" for u in data)
