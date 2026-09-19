from typing import Dict, Any

try:
    from services.iss_tracker import ISSTracker
except ImportError:
    from backend.services.iss_tracker import ISSTracker


CAREER_LIMIT_MSV = 600.0   # NASA-STD-3001 universal limit
SPE_LIMIT_MSV = 250.0      # Solar Particle Event mission limit
NOMINAL_RATE_USV_HR = 22.5 # ~0.54 mSv/day baseline LEO cosmic radiation


class RadiationModel:
    """Calculates radiation status, limits, and projections according to NASA-STD-3001."""

    @staticmethod
    def evaluate(cumulative_uSv: float, rate_uSv_hr: float = None) -> Dict[str, Any]:
        # Check ISS current location for South Atlantic Anomaly
        in_saa = False
        multiplier = 1.0
        try:
            pos = ISSTracker.get_iss_position()
            if pos:
                in_saa = ISSTracker.is_over_south_atlantic_anomaly(pos["latitude"], pos["longitude"])
                if in_saa:
                    multiplier = 10.0
        except Exception:
            pass

        current_rate = rate_uSv_hr if rate_uSv_hr is not None else (NOMINAL_RATE_USV_HR * multiplier)
        cumulative_mSv = cumulative_uSv / 1000.0

        career_pct = (cumulative_mSv / CAREER_LIMIT_MSV) * 100.0
        spe_pct = (cumulative_mSv / SPE_LIMIT_MSV) * 100.0

        # Projected days to reach career limit based on current daily burn rate
        daily_mSv = (current_rate * 24.0) / 1000.0
        remaining_mSv = max(0.0, CAREER_LIMIT_MSV - cumulative_mSv)
        projected_days = round(remaining_mSv / daily_mSv, 1) if daily_mSv > 0 else 730.0

        if career_pct >= 85.0 or spe_pct >= 85.0:
            status = "critical"
        elif career_pct >= 60.0 or spe_pct >= 60.0:
            status = "warning"
        elif in_saa or current_rate >= 100.0:
            status = "caution"
        else:
            status = "nominal"

        return {
            "cumulative_dose_uSv": round(cumulative_uSv, 2),
            "cumulative_dose_mSv": round(cumulative_mSv, 4),
            "career_limit_mSv": CAREER_LIMIT_MSV,
            "career_pct_used": round(career_pct, 2),
            "spe_mission_limit_mSv": SPE_LIMIT_MSV,
            "spe_pct_used": round(spe_pct, 2),
            "rate_uSv_per_hour": round(current_rate, 2),
            "in_south_atlantic_anomaly": in_saa,
            "radiation_multiplier": multiplier,
            "projected_days_to_limit": projected_days,
            "status": status,
        }
