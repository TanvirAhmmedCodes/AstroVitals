import os
from pathlib import Path
from typing import List
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

    # Host & Port
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8080"))

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
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "alerts@astrovitals.app")
    AUTHOR: str = os.getenv("AUTHOR", "MD Tanvir Ahmmed")

    # Paths
    BASE_DIR: Path = ROOT_DIR
    MODELS_DIR: Path = ROOT_DIR / "models"
    DATA_DIR: Path = ROOT_DIR / "data"
    DOCS_DIR: Path = ROOT_DIR / "docs"

    # CORS
    CORS_ORIGINS: List[str] = [
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

    class Config:
        case_sensitive = True


settings = Settings()
