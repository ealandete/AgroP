import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AgroP"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DB_HOST: str = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "emilio")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "s1gma")
    DB_NAME: str = os.getenv("DB_NAME", "agrop")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "agrop-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/home/emilio/Proyectos/AgroP/uploads")
    MAX_UPLOAD_SIZE_MB: int = 20

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000",
                                "http://192.168.1.200:5173", "http://192.168.1.200",
                                "http://localhost", "http://127.0.0.1"]

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()
