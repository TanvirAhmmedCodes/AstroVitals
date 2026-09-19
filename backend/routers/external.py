from typing import Optional, List
from fastapi import APIRouter, Query

try:
    from services.iss_tracker import ISSTracker
    from services.spacex_service import SpaceXService
    from services.nasa_service import NASAService
except ImportError:
    from backend.services.iss_tracker import ISSTracker
    from backend.services.spacex_service import SpaceXService
    from backend.services.nasa_service import NASAService

router = APIRouter(prefix="/external", tags=["External APIs"])


@router.get("/iss")
def get_iss_position():
    """Retrieve real-time ISS orbital coordinates, velocity, and South Atlantic Anomaly status."""
    pos = ISSTracker.get_iss_position()
    lat = pos["latitude"] if pos else -12.4
    lon = pos["longitude"] if pos else -45.2
    in_saa = ISSTracker.is_over_south_atlantic_anomaly(lat, lon)
    multiplier = 10.0 if in_saa else 1.0

    source = pos.get("source", "open-notify") if pos else "fallback"
    mode = pos.get("mode", "LIVE" if source != "fallback" else "SIMULATED")

    return {
        "latitude": lat,
        "longitude": lon,
        "altitude_km": pos.get("altitude_km", 418.5) if pos else 418.5,
        "velocity_kmh": pos.get("velocity_kmh", 27600) if pos else 27600,
        "in_saa": in_saa,
        "timestamp": pos.get("timestamp") if pos else None,
        "source": source,
        "mode": mode,
        "position": {
            "latitude": lat,
            "longitude": lon,
            "timestamp": pos.get("timestamp") if pos else None,
            "altitude_km": 418.5,
            "velocity_kms": 7.66,
        },
        "south_atlantic_anomaly": {
            "in_region": in_saa,
            "radiation_multiplier": multiplier,
            "warning": in_saa,
            "boundary": "Lat [-50, 0], Lon [-90, 40]",
        },
    }


@router.get("/launches/next")
def get_next_launch():
    """Retrieve upcoming orbital launch info from Launch Library 2."""
    launch = SpaceXService.get_next_launch()
    return {"launch": launch}


@router.get("/launches/recent")
def get_recent_launches(limit: int = Query(5, ge=1, le=20)):
    """Retrieve recently completed orbital missions."""
    launches = SpaceXService.get_recent_launches(limit=limit)
    return {"count": len(launches), "launches": launches}


@router.get("/apod")
def get_astronomy_picture_of_the_day():
    """Retrieve NASA Astronomy Picture of the Day (APOD) for ambient console displays."""
    apod = NASAService.get_apod()
    return {"apod": apod}
