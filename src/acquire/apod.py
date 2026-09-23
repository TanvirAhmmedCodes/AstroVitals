"""NASA Astronomy Picture of the Day (APOD) imagery fetcher.
"""

import os
from typing import Dict, Any, Tuple
from src.acquire.safe import fetch_json

APOD_URL = "https://api.nasa.gov/planetary/apod"


def fetch_apod() -> Tuple[Dict[str, Any], str]:
    """Retrieve NASA daily orbital imagery and astronomy metadata."""
    key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    return fetch_json(APOD_URL, params={"api_key": key}, name="apod")
