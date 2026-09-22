import os
from typing import Optional, Dict
try:
    from services.safe_fetch import fetch_json
except ImportError:
    from backend.services.safe_fetch import fetch_json

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
NASA_BASE = "https://api.nasa.gov"


class NASAService:

    @staticmethod
    def get_apod() -> Optional[Dict]:
        fallback = {
            "title": "Earth and Aurora from the International Space Station",
            "url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
            "explanation": "Astronauts aboard the International Space Station captured this vista of Earth and the vibrant cosmic auroral curtains.",
            "media_type": "image",
            "date": "2026-10-04",
            "copyright": "NASA / Expedition Crew",
            "provenance": {
                "dataset_id": "NASA-APOD",
                "source_url": "https://api.nasa.gov/planetary/apod",
                "data_mode": "fixture",
            },
        }

        try:
            data, mode = fetch_json(
                url=f"{NASA_BASE}/planetary/apod",
                params={"api_key": NASA_API_KEY},
                name="apod",
                timeout=4.0,
                fallback_data=fallback,
            )
            data["mode"] = mode
            return data
        except Exception as e:
            print(f"[NASAService] Safe fetch exception: {e}")
            return fallback

    @staticmethod
    def get_earth_imagery(lat: float, lon: float) -> Optional[Dict]:
        try:
            data, mode = fetch_json(
                url=f"{NASA_BASE}/planetary/earth/imagery",
                params={"lat": lat, "lon": lon, "api_key": NASA_API_KEY},
                name=f"earth_img_{lat}_{lon}",
                timeout=4.0,
                fallback_data={"image_url": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200"},
            )
            data["mode"] = mode
            return data
        except Exception:
            return {"image_url": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200", "mode": "fixture"}