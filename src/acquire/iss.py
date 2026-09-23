"""International Space Station (ISS) ephemeris and orbital telemetry fetcher.
"""

from typing import Dict, Any, Tuple
from src.acquire.safe import fetch_json

ISS_POSITION_URL = "http://api.open-notify.org/iss-now.json"


def fetch_iss_position() -> Tuple[Dict[str, Any], str]:
    """Retrieve current ISS coordinates and South Atlantic Anomaly crossing telemetry."""
    return fetch_json(ISS_POSITION_URL, name="iss_position")
