from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

try:
    from database import get_db, Telemetry
    from schemas import RadiationStatusResponse
    from services.radiation_model import RadiationModel
    from services.safe_fetch import fetch_json
except ImportError:
    from backend.database import get_db, Telemetry
    from backend.schemas import RadiationStatusResponse
    from backend.services.radiation_model import RadiationModel
    from backend.services.safe_fetch import fetch_json

router = APIRouter(prefix="/radiation", tags=["Radiation"])

NOAA_SCALES_URL = "https://services.swpc.noaa.gov/products/noaa-scales.json"


@router.get("/status", response_model=RadiationStatusResponse)
def get_radiation_status(
    astronaut_id: str = Query("astronaut-A", description="Astronaut identifier"),
    db: Session = Depends(get_db),
):
    """Retrieve cumulative radiation dosimetry, limits adherence, and SAA traversal status.

    Grounded in NASA-STD-3001 Vol 1 Rev C: 600 mSv career limit and 250 mSv SPE mission limit.
    Enriched with real-time or cached NOAA SWPC space weather scales (R/S/G).
    """
    now = datetime.now(timezone.utc)
    record = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id == astronaut_id)
        .order_by(Telemetry.timestamp_utc.desc())
        .first()
    )

    dose_uSv = record.radiation_dose_uSv_cumulative if record and record.radiation_dose_uSv_cumulative else 12.5
    eval_result = RadiationModel.evaluate(dose_uSv)

    # Safe acquisition of NOAA space weather data with offline fixture fallback
    data_source = "FIXTURE (SIMULATED)"
    solar_flux_class = "B1.2"
    noaa_storm_scale = "S0"
    provenance = {
        "dataset_id": "NASA-STD-3001 / NOAA-SWPC-GOES",
        "source_url": NOAA_SCALES_URL,
        "data_mode": "fixture",
    }

    try:
        sw_data, mode = fetch_json(
            url=NOAA_SCALES_URL,
            name="radspace_weather",
            timeout=2.0,
        )
        if mode == "live":
            data_source = "LIVE NOAA"
        elif mode == "cache":
            data_source = "CACHE"
        else:
            data_source = "FIXTURE (SIMULATED)"

        provenance["data_mode"] = mode
        if isinstance(sw_data, dict):
            scales = sw_data.get("noaa_space_weather_scale", {})
            s_scale = scales.get("S", {}).get("scale", "S0")
            noaa_storm_scale = s_scale
            solar_flux_class = sw_data.get("solar_flux_class", "B1.2")
    except Exception as err:
        pass

    return RadiationStatusResponse(
        astronaut_id=astronaut_id,
        timestamp_utc=now,
        cumulative_dose_uSv=eval_result["cumulative_dose_uSv"],
        cumulative_dose_mSv=eval_result["cumulative_dose_mSv"],
        career_limit_mSv=eval_result["career_limit_mSv"],
        career_pct_used=eval_result["career_pct_used"],
        spe_mission_limit_mSv=eval_result["spe_mission_limit_mSv"],
        spe_pct_used=eval_result["spe_pct_used"],
        rate_uSv_per_hour=eval_result["rate_uSv_per_hour"],
        in_south_atlantic_anomaly=eval_result["in_south_atlantic_anomaly"],
        radiation_multiplier=eval_result["radiation_multiplier"],
        projected_days_to_limit=eval_result["projected_days_to_limit"],
        status=eval_result["status"],
        data_source=data_source,
        solar_flux_class=solar_flux_class,
        noaa_storm_scale=noaa_storm_scale,
        provenance=provenance,
    )
