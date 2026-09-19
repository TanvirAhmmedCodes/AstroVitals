import os
from pathlib import Path
from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load root or backend .env
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "AstroVitals Neuro-Shield"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Host & Port (Render automatically supplies $PORT)
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "8080")))

    # Database - Normalize SQLite relative path to backend/astrovitals.db
    _raw_db = os.getenv("DATABASE_URL", "sqlite:///./astrovitals.db")
    DATABASE_URL: str = (
        f"sqlite:///{(BACKEND_DIR / 'astrovitals.db').as_posix()}"
        if _raw_db in ("sqlite:///./astrovitals.db", "sqlite:///astrovitals.db")
        else _raw_db
    )

    # API Keys & Auth Secrets
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    NASA_API_KEY: str = os.getenv("NASA_API_KEY", "DEMO_KEY")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "astrovitals-orbital-secret-key-2026-dhaka")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))

    # Administration & Credits
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "tanvirahmmed13579@gmail.com")
    ADMIN_INITIAL_PASSWORD: str = os.getenv("ADMIN_INITIAL_PASSWORD", "ChangeMe123!")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
    AUTHOR: str = os.getenv("AUTHOR", "MD Tanvir Ahmmed")

    # Paths - Detect models in backend/models or root models/
    BASE_DIR: Path = ROOT_DIR
    _backend_models = BACKEND_DIR / "models"
    _root_models = ROOT_DIR / "models"
    MODELS_DIR: Path = (
        _backend_models
        if (_backend_models.exists() and any(_backend_models.glob("*.pkl")))
        else _root_models
    )
    DATA_DIR: Path = ROOT_DIR / "data"
    DOCS_DIR: Path = ROOT_DIR / "docs"

    # CORS - Supports comma-separated string, JSON array, or list of origins
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://astrovitals.vercel.app",
    ]
    CORS_ORIGIN_REGEX: str = r"^https:\/\/.*\.vercel\.app$"

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    class Config:
        case_sensitive = True


settings = Settings()
