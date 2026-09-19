import requests
from datetime import datetime, timezone
from typing import Optional, Dict


OPEN_NOTIFY_BASE = "http://api.open-notify.org"
WHERETHEISS_BASE = "https://api.wheretheiss.at/v1/satellites/25544"
HTTP_HEADERS = {"User-Agent": "AstroVitals/1.0 (NASA Space Apps Challenge 2026)"}

_cached_pos = None
_last_fetch_time = 0.0
CACHE_DURATION_SEC = 10.0


class ISSTracker:

    @staticmethod
    def get_iss_position() -> Dict:
        global _cached_pos, _last_fetch_time
        import time
        import math

        now = time.time()
        if _cached_pos and (now - _last_fetch_time < CACHE_DURATION_SEC):
            return _cached_pos

        # 1. Primary Live Endpoint: Open-Notify
        try:
            r = requests.get(f"{OPEN_NOTIFY_BASE}/iss-now.json", headers=HTTP_HEADERS, timeout=8.0)
            if r.status_code == 200:
                data = r.json()
                _cached_pos = {
                    "latitude": round(float(data["iss_position"]["latitude"]), 4),
                    "longitude": round(float(data["iss_position"]["longitude"]), 4),
                    "altitude_km": 418.5,
                    "velocity_kmh": 27600,
                    "timestamp": datetime.fromtimestamp(
                        data["timestamp"], tz=timezone.utc
                    ).isoformat(),
                    "source": "open-notify",
                    "mode": "LIVE",
                }
                _last_fetch_time = now
                return _cached_pos
        except Exception as err:
            print(f"[ISSTracker] Open-Notify live fetch notice: {err}")

        # 2. Secondary Live Endpoint: WhereTheISS
        try:
            r2 = requests.get(WHERETHEISS_BASE, headers=HTTP_HEADERS, timeout=8.0)
            if r2.status_code == 200:
                data2 = r2.json()
                _cached_pos = {
                    "latitude": round(float(data2["latitude"]), 4),
                    "longitude": round(float(data2["longitude"]), 4),
                    "altitude_km": round(float(data2.get("altitude", 418.5)), 1),
                    "velocity_kmh": round(float(data2.get("velocity", 27600.0)), 1),
                    "timestamp": datetime.fromtimestamp(
                        data2["timestamp"], tz=timezone.utc
                    ).isoformat(),
                    "source": "wheretheiss",
                    "mode": "LIVE",
                }
                _last_fetch_time = now
                return _cached_pos
        except Exception as err2:
            print(f"[ISSTracker] WhereTheISS live fetch notice: {err2}")

        # Return last cached position if available
        if _cached_pos:
            return _cached_pos

        # 3. Dynamic orbital mechanics simulation fallback (Keplerian ~90 min orbit, 51.6° inclination)
        sim_lat = round(math.sin(now / 5400.0) * 51.6, 4)
        sim_lon = round(((now / 60.0) % 360.0) - 180.0, 4)
        return {
            "latitude": sim_lat,
            "longitude": sim_lon,
            "altitude_km": 418.5,
            "velocity_kmh": 27600,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "fallback",
            "mode": "SIMULATED",
        }

    @staticmethod
    def get_people_in_space() -> Optional[Dict]:
        try:
            r = requests.get(f"{OPEN_NOTIFY_BASE}/astros.json", timeout=10)
            if r.status_code == 200:
                data = r.json()
                return {
                    "count": data["number"],
                    "people": data["people"],
                }
        except Exception:
            pass
        return None

    @staticmethod
    def is_over_south_atlantic_anomaly(lat: float, lon: float) -> bool:
        return -50 <= lat <= 0 and -90 <= lon <= 40

    @staticmethod
    def get_radiation_multiplier() -> float:
        pos = ISSTracker.get_iss_position()
        if pos and ISSTracker.is_over_south_atlantic_anomaly(
            pos["latitude"], pos["longitude"]
        ):
            return 10.0
        return 1.0