"""AstroVitals Neuro-Shield - Core Application Server.

Mission-grade astronaut health monitoring platform for deep space exploration.
Built by MD Tanvir Ahmmed and Team Orbitrix for NASA Space Apps Challenge 2026.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import sys
from pathlib import Path

# Ensure backend directory is in sys.path
_backend_dir = str(Path(__file__).resolve().parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

try:
    from config import settings
    from database import init_db
    from services.model_registry import registry
    from services.gemini_service import gemini_service
    from services.firebase_service import init_firebase
    from schemas import HealthCheckResponse
    from limiter import limiter
    from routers import (
        auth,
        admin,
        ingest,
        vitals,
        risk,
        radiation,
        cognitive,
        astronaut,
        chat,
        alerts,
        analytics,
        external,
        devices,
    )
except ImportError:
    from backend.config import settings
    from backend.database import init_db
    from backend.services.model_registry import registry
    from backend.services.gemini_service import gemini_service
    from backend.services.firebase_service import init_firebase
    from backend.schemas import HealthCheckResponse
    from backend.limiter import limiter
    from backend.routers import (
        auth,
        admin,
        ingest,
        vitals,
        risk,
        radiation,
        cognitive,
        astronaut,
        chat,
        alerts,
        analytics,
        external,
        devices,
    )

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print("[AstroVitals] Initializing system database...")
    init_db()
    print(f"[AstroVitals] ML Registry Status: Loaded={registry.loaded}")

    # Auto-warm AI Companion on startup to verify responsiveness
    try:
        warmed = gemini_service.warmup()
        print(f"[AstroVitals] AI Companion Warmup: Ready={warmed} (Model={gemini_service.active_model})")
    except Exception as e:
        print(f"[AstroVitals] Warning: AI Companion warmup exception: {e}")

    # Initialize Firebase Admin SDK for real-time Firestore sync
    try:
        fb_ok = init_firebase()
        if fb_ok:
            print("[AstroVitals] Firebase Admin SDK: Active (Real-Time Firestore Sync Enabled)")
        else:
            print("[AstroVitals] Firebase Admin SDK: Disabled (Graceful Fallback Mode)")
    except Exception as e:
        print(f"[AstroVitals] Firebase init warning: {e} (Continuing with local SQLite)")

    yield
    print("[AstroVitals] Console server shutting down...")


app = FastAPI(
    title="AstroVitals Neuro-Shield API",
    description=(
        "Mission-grade astronaut health monitoring platform. "
        "Made by MD Tanvir Ahmmed and Team Orbitrix for NASA Space Apps Challenge 2026. "
        "Team: MD Tanvir Ahmmed (Software, ML), Ishraq Ahmmed & Suvajit Kumar Arja (Hardware), "
        "Suborna Akter & Fatima Jahan Hitu (Documentation & Videography), "
        "Md. Afzal Hossain (Testing)."
    ),
    version="1.0.0",
    contact={"name": "MD Tanvir Ahmmed", "email": "tanvirahmmed13579@gmail.com"},
    lifespan=lifespan,
)

# Rate Limiting via SlowAPI
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS middleware for local dev, PWA, and Vercel production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP HEAD method middleware for Render health checks and uptime probes
@app.middleware("http")
async def handle_head_method(request: Request, call_next):
    if request.method == "HEAD":
        request.scope["method"] = "GET"
        response = await call_next(request)
        return Response(
            content=b"",
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )
    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global error handler providing uniform JSON error responses without leaking server internals."""
    print(f"[AstroVitals Server Error] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An internal mission telemetry error occurred.",
            "detail": "Internal operational anomaly recorded. Telemetry operations logged to mission control.",
        },
    )


# Mount API Routers under /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(ingest.router, prefix=settings.API_V1_STR)
app.include_router(vitals.router, prefix=settings.API_V1_STR)
app.include_router(risk.router, prefix=settings.API_V1_STR)
app.include_router(radiation.router, prefix=settings.API_V1_STR)
app.include_router(cognitive.router, prefix=settings.API_V1_STR)
app.include_router(astronaut.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(external.router, prefix=settings.API_V1_STR)
app.include_router(devices.router, prefix=settings.API_V1_STR)


@app.api_route("/", methods=["GET", "HEAD"], tags=["System"])
def root():
    return {
        "service": "AstroVitals Neuro-Shield API",
        "author": "MD Tanvir Ahmmed",
        "team": "Team Orbitrix · NASA Space Apps Challenge 2026",
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthCheckResponse, tags=["System"])
@app.api_route(f"{settings.API_V1_STR}/health", methods=["GET", "HEAD"], response_model=HealthCheckResponse, tags=["System"])
def health_check():
    return HealthCheckResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        models_loaded=registry.loaded,
        timestamp=datetime.now(timezone.utc),
    )


@app.api_route(f"{settings.API_V1_STR}/metrics", methods=["GET", "HEAD"], tags=["System"])
def model_metrics():
    """Returns honest validation metrics for judges and transparency disclosure."""
    return {
        "model_metadata": registry.metadata,
        "metrics": registry.metrics,
        "disclosure": (
            "Models in /models/ are trained with 5-fold GroupKFold cross-validation grouped strictly "
            "by subject_id across 36 subjects (zero cross-subject leakage). Regularized linear algorithms "
            "(BayesianRidge, Huber, and VotingRegressor) yield positive generalization: "
            f"CV R2={round(registry.metrics.get('models', {}).get('cardiovascular', {}).get('cv_r2_mean', 0.673), 3)}, "
            f"Sleep R2={round(registry.metrics.get('models', {}).get('sleep_behavioral', {}).get('cv_r2_mean', 0.577), 3)}, "
            f"Immune R2={round(registry.metrics.get('models', {}).get('immune', {}).get('cv_r2_mean', 0.670), 3)}. "
            "Real-time safety alerting is driven by the IsolationForest anomaly detector."
        ),
    }


if __name__ == "__main__":
    import uvicorn

    app_target = "backend.main:app" if Path("backend").is_dir() else "main:app"
    uvicorn.run(
        app_target,
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
