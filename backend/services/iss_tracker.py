import os
import time
import math
from datetime import datetime, timezone
from typing import Optional, Dict

try:
    from services.safe_fetch import fetch_json
    from compute.radiation_math import check_south_atlantic_anomaly
except ImportError:
    from backend.services.safe_fetch import fetch_json
    from backend.compute.radiation_math import check_south_atlantic_anomaly

OPEN_NOTIFY_BASE = "http://api.open-notify.org"
WHERETHEISS_BASE = "https://api.wheretheiss.at/v1/satellites/25544"
HTTP_HEADERS = {"User-Agent": "AstroVitals/1.0 (NASA Space Apps Challenge 2026)"}

_cached_pos = None
_last_fetch_time = 0.0
CACHE_DURATION_SEC = 5.0


class ISSTracker:

    @staticmethod
    def get_iss_position() -> Dict:
        global _cached_pos, _last_fetch_time
        now = time.time()

        if _cached_pos and (now - _last_fetch_time < CACHE_DURATION_SEC):
            return _cached_pos

        # Check offline mode first
        if os.getenv("OFFLINE", "0").strip() == "1":
            try:
                data, mode = fetch_json("", name="iss_position")
                _cached_pos = data
                _last_fetch_time = now
                return _cached_pos
            except Exception:
                pass

        # 1. Primary Live Endpoint: Open-Notify via safe_fetch
        try:
            raw_data, mode = fetch_json(
                f"{OPEN_NOTIFY_BASE}/iss-now.json",
                name="iss_open_notify",
                headers=HTTP_HEADERS,
                timeout=4.0,
            )
            lat = round(float(raw_data["iss_position"]["latitude"]), 4)
            lon = round(float(raw_data["iss_position"]["longitude"]), 4)
            in_saa = check_south_atlantic_anomaly(lat, lon)
            _cached_pos = {
                "latitude": lat,
                "longitude": lon,
                "altitude_km": 418.5,
                "velocity_kmh": 27600.0,
                "in_saa": in_saa,
                "timestamp": datetime.fromtimestamp(raw_data["timestamp"], tz=timezone.utc).isoformat(),
                "source": "open-notify",
                "mode": mode.upper(),
            }
            _last_fetch_time = now
            return _cached_pos
        except Exception as err:
            print(f"[ISSTracker] Open-Notify live fetch notice: {err}")

        # 2. Secondary Live Endpoint: WhereTheISS
        try:
            raw_data2, mode2 = fetch_json(
                WHERETHEISS_BASE,
                name="iss_wheretheiss",
                headers=HTTP_HEADERS,
                timeout=4.0,
            )
            lat2 = round(float(raw_data2["latitude"]), 4)
            lon2 = round(float(raw_data2["longitude"]), 4)
            in_saa2 = check_south_atlantic_anomaly(lat2, lon2)
            _cached_pos = {
                "latitude": lat2,
                "longitude": lon2,
                "altitude_km": round(float(raw_data2.get("altitude", 418.5)), 1),
                "velocity_kmh": round(float(raw_data2.get("velocity", 27600.0)), 1),
                "in_saa": in_saa2,
                "timestamp": datetime.fromtimestamp(raw_data2["timestamp"], tz=timezone.utc).isoformat(),
                "source": "wheretheiss",
                "mode": mode2.upper(),
            }
            _last_fetch_time = now
            return _cached_pos
        except Exception as err2:
            print(f"[ISSTracker] WhereTheISS live fetch notice: {err2}")

        # 3. Fall back to committed fixture
        try:
            data, mode = fetch_json("", name="iss_position")
            _cached_pos = data
            _last_fetch_time = now
            return _cached_pos
        except Exception:
            pass

        # 4. Keplerian orbit simulation fallback
        sim_lat = round(math.sin(now / 5400.0) * 51.6, 4)
        sim_lon = round(((now / 60.0) % 360.0) - 180.0, 4)
        in_saa_sim = check_south_atlantic_anomaly(sim_lat, sim_lon)
        return {
            "latitude": sim_lat,
            "longitude": sim_lon,
            "altitude_km": 418.5,
            "velocity_kmh": 27600.0,
            "in_saa": in_saa_sim,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "simulation",
            "mode": "SIMULATED",
        }

    @staticmethod
    def is_over_south_atlantic_anomaly(lat: float, lon: float) -> bool:
        return check_south_atlantic_anomaly(lat, lon)

    @staticmethod
    def get_radiation_multiplier() -> float:
        pos = ISSTracker.get_iss_position()
        if pos and check_south_atlantic_anomaly(pos["latitude"], pos["longitude"]):
            return 10.0
        return 1.0