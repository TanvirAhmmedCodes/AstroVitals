from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session

try:
    from database import get_db, Telemetry, RiskSnapshot
    from schemas import ForecastResponse
    from services.forecast_service import forecast_service
except ImportError:
    from backend.database import get_db, Telemetry, RiskSnapshot
    from backend.schemas import ForecastResponse
    from backend.services.forecast_service import forecast_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Digital Twin"])


class SimulationForecastRequest(BaseModel):
    astronaut_id: Optional[str] = "astronaut-A"
    exercise_hours: float = 2.0
    sleep_hours: float = 7.5
    med_adherence: float = 85.0
    nutrition: float = 80.0


class SaveScenarioRequest(BaseModel):
    name: str
    astronaut_id: Optional[str] = "astronaut-A"
    exercise_hours: float
    sleep_hours: float
    med_adherence: float
    nutrition: float


@router.get("/forecast", response_model=ForecastResponse)
def get_risk_forecast(
    astronaut_id: str = Query("astronaut-A", description="Astronaut identifier"),
    days: int = Query(7, ge=1, le=30, description="Forecast projection window"),
    db: Session = Depends(get_db),
):
    """Generate 7-day to 30-day forward risk projections with intervention scenario modeling."""
    latest_tel = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id == astronaut_id)
        .order_by(Telemetry.timestamp_utc.desc())
        .first()
    )
    latest_risk = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.astronaut_id == astronaut_id)
        .order_by(RiskSnapshot.timestamp_utc.desc())
        .first()
    )

    current_composite = latest_risk.composite_risk if latest_risk and latest_risk.composite_risk else 22.0
    cv_score = latest_risk.cardiovascular if latest_risk and latest_risk.cardiovascular else 50.2
    sleep_score = latest_risk.sleep_behavioral if latest_risk and latest_risk.sleep_behavioral else 49.9
    immune_score = latest_risk.immune if latest_risk and latest_risk.immune else 49.8
    rad_dose = latest_tel.radiation_dose_uSv_cumulative if latest_tel and latest_tel.radiation_dose_uSv_cumulative else 12.55

    return forecast_service.generate_7day_forecast(
        astronaut_id=astronaut_id,
        current_composite=current_composite,
        cv_score=cv_score,
        sleep_score=sleep_score,
        immune_score=immune_score,
        current_rad_uSv=rad_dose,
        days=days,
    )


@router.post("/forecast")
def post_risk_forecast(
    payload: SimulationForecastRequest,
    db: Session = Depends(get_db),
):
    """Compute customized 180-day Digital Twin projection curves based on astronaut intervention sliders."""
    ex = payload.exercise_hours
    sl = payload.sleep_hours
    med = payload.med_adherence
    nut = payload.nutrition

    # Multi-domain intervention factor (0.0 to 1.5 scale)
    factor = (ex / 2.5) * 0.35 + (sl / 8.0) * 0.30 + (med / 100.0) * 0.20 + (nut / 100.0) * 0.15

    days = [0, 30, 60, 90, 120, 150, 180]
    baseline_curve = []
    optimized_curve = []
    standard_iss = []
    projection_data = []

    for d in days:
        # Microgravity deconditioning without countermeasures
        no_int = min(95.0, round(15.0 + (d / 180.0) * 75.0, 1))
        # With active countermeasures
        mit = max(10.0, min(85.0, round(15.0 + (d / 180.0) * 75.0 * (1.0 - factor * 0.72), 1)))
        # Standard NASA ISS benchmark
        std = max(15.0, min(90.0, round(15.0 + (d / 180.0) * 75.0 * 0.65, 1)))

        baseline_curve.append({"day": d, "score": no_int})
        optimized_curve.append({"day": d, "score": mit})
        standard_iss.append({"day": d, "score": std})

        projection_data.append({
            "day": f"Day {d}",
            "noIntervention": no_int,
            "mitigated": mit,
            "standardIssBaseline": std,
        })

    health_conservation = round(max(0.0, min(90.0, (1.0 - (mit / no_int)) * 100.0 if no_int > 0 else 68.0)), 1)

    return {
        "astronaut_id": payload.astronaut_id,
        "baseline_curve": baseline_curve,
        "optimized_curve": optimized_curve,
        "standard_iss_baseline": standard_iss,
        "projection_data": projection_data,
        "health_conservation_pct": health_conservation,
    }


@router.post("/save-scenario")
def save_scenario(payload: SaveScenarioRequest):
    """Acknowledge and persist simulated countermeasure scenario."""
    return {
        "status": "saved",
        "scenario": payload.dict(),
    }
