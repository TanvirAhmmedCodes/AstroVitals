from typing import Optional, Dict, List

try:
    from services.safe_fetch import fetch_json
except ImportError:
    from backend.services.safe_fetch import fetch_json

LL2_BASE = "https://lldev.thespacedevs.com/2.3.0/"


class SpaceXService:

    @staticmethod
    def get_latest_launch() -> Optional[Dict]:
        fallback = {
            "name": "Falcon 9 Block 5 | Crew-9",
            "net": "2026-09-28T17:17:00Z",
            "status": {"name": "Launch Successful"},
            "pad": {"name": "Space Launch Complex 40", "location": {"name": "Cape Canaveral SFS, FL, USA"}},
            "mission": {"description": "Commercial Crew rotation mission delivering crew to the International Space Station."},
        }
        try:
            data, _ = fetch_json(f"{LL2_BASE}launches/previous/?limit=1", name="latest_launch", timeout=3.0, fallback_data={"results": [fallback]})
            results = data.get("results", [])
            return results[0] if results else fallback
        except Exception:
            return fallback

    @staticmethod
    def get_next_launch() -> Optional[Dict]:
        fallback = {
            "id": "expedition-resupply-mock",
            "name": "Falcon 9 Block 5 | CRS SpX-33",
            "net": "2026-10-15T09:30:00Z",
            "status": {"name": "Go for Launch"},
            "pad": {"name": "LC-39A", "location": {"name": "Kennedy Space Center, FL, USA"}},
            "mission": {"name": "Commercial Resupply Services", "description": "Delivery of cargo, consumables, and scientific hardware to the ISS."},
        }
        try:
            data, _ = fetch_json(f"{LL2_BASE}launches/upcoming/?limit=1", name="launches", timeout=3.0, fallback_data={"results": [fallback]})
            if isinstance(data, list) and data:
                return data[0]
            results = data.get("results", [])
            return results[0] if results else fallback
        except Exception:
            return fallback

    @staticmethod
    def get_recent_launches(limit: int = 5) -> List[Dict]:
        fallback = [
            {"id": "c9", "name": "Falcon 9 Block 5 | Crew-9", "net": "2026-09-28T17:17:00Z", "status": {"name": "Success"}},
            {"id": "spx32", "name": "Falcon 9 Block 5 | CRS SpX-32", "net": "2026-08-14T11:22:00Z", "status": {"name": "Success"}},
            {"id": "ms26", "name": "Soyuz 2.1a | Soyuz MS-26", "net": "2026-09-11T16:23:00Z", "status": {"name": "Success"}},
        ]
        try:
            data, _ = fetch_json(f"{LL2_BASE}launches/previous/?limit={limit}", name="recent_launches", timeout=3.0, fallback_data={"results": fallback})
            results = data.get("results", [])
            return results[:limit] if results else fallback[:limit]
        except Exception:
            return fallback[:limit]

    @staticmethod
    def get_inspiration4_info() -> Optional[Dict]:
        fallback = {
            "name": "Falcon 9 Block 5 | Inspiration4",
            "net": "2021-09-16T00:02:56Z",
            "mission": {"description": "First all-civilian spaceflight to orbit. Provided biological datasets for NASA OSDR (OSD-569, 570, 571, 575)."},
        }
        try:
            data, _ = fetch_json(f"{LL2_BASE}launches/previous/?search=Inspiration4&limit=1", name="inspiration4_launch", timeout=3.0, fallback_data={"results": [fallback]})
            results = data.get("results", [])
            return results[0] if results else fallback
        except Exception:
            return fallback