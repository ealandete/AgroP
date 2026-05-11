import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, Table, Column, Integer, MetaData
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.config import settings
from app.utils.auth import hash_password, create_access_token

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Register missing referenced tables so FK constraints resolve
Table('dietas', Base.metadata, Column('id', Integer, primary_key=True))
Table('alimentos', Base.metadata, Column('id', Integer, primary_key=True))
Table('equipos', Base.metadata, Column('id', Integer, primary_key=True))
Table('diagnosticos_gestacion', Base.metadata, Column('id', Integer, primary_key=True))


@pytest.fixture(autouse=True)
def setup_db():
    import app.models
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db):
    from app.models import Usuario, Rol, Finca
    rol = Rol(nombre="admin", descripcion="Administrador")
    db.add(rol)
    db.flush()
    finca = Finca(nombre="Test Finca")
    db.add(finca)
    db.flush()
    user = Usuario(
        email="test@agrop.com",
        password_hash=hash_password("test1234"),
        nombre="Test",
        apellido="User",
        rol_id=rol.id,
        finca_id=finca.id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, finca, rol


@pytest.fixture
def auth_headers(client, test_user):
    resp = client.post("/api/auth/login", json={
        "email": "test@agrop.com",
        "password": "test1234",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_lote(db, test_user):
    from app.models import Lote
    user, finca, rol = test_user
    lote = Lote(
        finca_id=finca.id,
        nombre="Test Lote",
        area_ha=10.0,
        tipo_suelo="franco",
        uso_actual="cultivo",
        sistema_riego="secano",
        color="#4CAF50",
    )
    db.add(lote)
    db.commit()
    db.refresh(lote)
    return lote
