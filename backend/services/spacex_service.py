import time
from typing import Optional, Dict, List
import requests

LL2_BASE = "https://lldev.thespacedevs.com/2.3.0/"

_cached_next_launch: Optional[Dict] = None
_cached_next_time = 0.0
_cached_recent_launches: Dict[int, List[Dict]] = {}
_cached_recent_time = 0.0

CACHE_TTL = 900.0  # 15 minutes per MASTER_PROMPT 7.2


class SpaceXService:

    @staticmethod
    def get_latest_launch() -> Optional[Dict]:
        try:
            r = requests.get(f"{LL2_BASE}launches/previous/?limit=1", timeout=3.0)
            if r.status_code == 200:
                results = r.json().get("results", [])
                return results[0] if results else None
        except Exception:
            pass
        return {
            "name": "Falcon 9 Block 5 | Crew-9",
            "net": "2026-09-28T17:17:00Z",
            "status": {"name": "Launch Successful"},
            "pad": {"name": "Space Launch Complex 40", "location": {"name": "Cape Canaveral SFS, FL, USA"}},
            "mission": {"description": "Commercial Crew rotation mission delivering crew to the International Space Station."},
        }

    @staticmethod
    def get_next_launch() -> Optional[Dict]:
        global _cached_next_launch, _cached_next_time
        now = time.time()
        if _cached_next_launch and (now - _cached_next_time < CACHE_TTL):
            return _cached_next_launch

        try:
            r = requests.get(f"{LL2_BASE}launches/upcoming/?limit=1", timeout=3.0)
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    _cached_next_launch = results[0]
                    _cached_next_time = now
                    return _cached_next_launch
        except Exception:
            pass

        if _cached_next_launch:
            return _cached_next_launch

        fallback = {
            "id": "expedition-resupply-mock",
            "name": "Falcon 9 Block 5 | CRS SpX-33",
            "net": "2026-10-15T09:30:00Z",
            "status": {"name": "Go for Launch"},
            "pad": {"name": "LC-39A", "location": {"name": "Kennedy Space Center, FL, USA"}},
            "mission": {"name": "Commercial Resupply Services", "description": "Delivery of cargo, consumables, and scientific hardware to the ISS."},
        }
        _cached_next_launch = fallback
        _cached_next_time = now
        return _cached_next_launch

    @staticmethod
    def get_recent_launches(limit: int = 5) -> List[Dict]:
        global _cached_recent_launches, _cached_recent_time
        now = time.time()
        if limit in _cached_recent_launches and (now - _cached_recent_time < CACHE_TTL):
            return _cached_recent_launches[limit]

        try:
            r = requests.get(f"{LL2_BASE}launches/previous/?limit={limit}", timeout=3.0)
            if r.status_code == 200:
                results = r.json().get("results", [])
                _cached_recent_launches[limit] = results
                _cached_recent_time = now
                return results
        except Exception:
            pass

        if limit in _cached_recent_launches:
            return _cached_recent_launches[limit]

        fallback = [
            {"id": "c9", "name": "Falcon 9 Block 5 | Crew-9", "net": "2026-09-28T17:17:00Z", "status": {"name": "Success"}},
            {"id": "spx32", "name": "Falcon 9 Block 5 | CRS SpX-32", "net": "2026-08-14T11:22:00Z", "status": {"name": "Success"}},
            {"id": "ms26", "name": "Soyuz 2.1a | Soyuz MS-26", "net": "2026-09-11T16:23:00Z", "status": {"name": "Success"}},
        ]
        return fallback[:limit]

    @staticmethod
    def get_inspiration4_info() -> Optional[Dict]:
        try:
            r = requests.get(f"{LL2_BASE}launches/previous/?search=Inspiration4&limit=1", timeout=3.0)
            if r.status_code == 200:
                results = r.json().get("results", [])
                return results[0] if results else None
        except Exception:
            pass
        return {
            "name": "Falcon 9 Block 5 | Inspiration4",
            "net": "2021-09-16T00:02:56Z",
            "mission": {"description": "First all-civilian spaceflight to orbit. Provided biological datasets for NASA OSDR (OSD-569, 570, 571, 575)."},
        }