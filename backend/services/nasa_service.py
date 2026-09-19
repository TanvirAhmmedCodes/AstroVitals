import os
import time
from typing import Optional, Dict, List
import requests

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
NASA_BASE = "https://api.nasa.gov"

_cached_apod: Optional[Dict] = None
_cached_apod_time = 0.0
APOD_CACHE_TTL = 3600.0  # 1 hour cache


class NASAService:

    @staticmethod
    def get_apod() -> Optional[Dict]:
        global _cached_apod, _cached_apod_time
        now = time.time()
        if _cached_apod and (now - _cached_apod_time < APOD_CACHE_TTL):
            return _cached_apod

        try:
            r = requests.get(
                f"{NASA_BASE}/planetary/apod",
                params={"api_key": NASA_API_KEY},
                timeout=3.0,
            )
            if r.status_code == 200:
                _cached_apod = r.json()
                _cached_apod_time = now
                return _cached_apod
        except Exception:
            pass

        if _cached_apod:
            return _cached_apod

        fallback = {
            "title": "Earth and the Aurora from the International Space Station",
            "url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
            "explanation": "Astronauts aboard the International Space Station capture the ethereal glow of Earth's atmosphere and vibrant cosmic auroral curtains.",
            "media_type": "image",
            "date": "2026-09-18",
            "copyright": "NASA / Expedition Crew",
        }
        _cached_apod = fallback
        _cached_apod_time = now
        return _cached_apod

    @staticmethod
    def get_earth_imagery(lat: float, lon: float) -> Optional[Dict]:
        try:
            r = requests.get(
                f"{NASA_BASE}/planetary/earth/imagery",
                params={"lat": lat, "lon": lon, "api_key": NASA_API_KEY},
                timeout=4.0,
            )
            if r.status_code == 200:
                return {"image_url": r.url}
        except Exception:
            pass
        return {"image_url": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200"}