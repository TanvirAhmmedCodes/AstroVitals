"""Deterministic radiation physics and limit compliance module.

Calculates cumulative exposure, SAA status, and NASA-STD-3001 threshold metrics.
Zero LLM arithmetic.
"""

from typing import Dict, Any


def check_south_atlantic_anomaly(latitude: float, longitude: float) -> bool:
    """Evaluate whether satellite/orbital coordinates fall inside the South Atlantic Anomaly."""
    return bool(-50.0 <= latitude <= 0.0 and -90.0 <= longitude <= 40.0)


def calculate_radiation_metrics(
    cumulative_uSv: float,
    career_limit_mSv: float = 600.0,
    spe_limit_mSv: float = 250.0,
    in_saa: bool = False,
) -> Dict[str, Any]:
    """Compute NASA-STD-3001 radiation limits and exposure consumption percentages.

    Limits:
      Career Effective Dose Limit: 600 mSv (universal limit across all astronaut demographics).
      Solar Particle Event (SPE) Acute Limit: 250 mSv (tissue reaction threshold).
    """
    dose_mSv = cumulative_uSv / 1000.0
    career_pct = (dose_mSv / career_limit_mSv) * 100.0 if career_limit_mSv > 0 else 0.0
    spe_pct = (dose_mSv / spe_limit_mSv) * 100.0 if spe_limit_mSv > 0 else 0.0
    multiplier = 10.0 if in_saa else 1.0

    return {
        "cumulative_uSv": float(round(cumulative_uSv, 2)),
        "cumulative_mSv": float(round(dose_mSv, 4)),
        "career_limit_mSv": float(career_limit_mSv),
        "career_pct_used": float(round(career_pct, 4)),
        "spe_limit_mSv": float(spe_limit_mSv),
        "spe_pct_used": float(round(spe_pct, 4)),
        "in_south_atlantic_anomaly": bool(in_saa),
        "radiation_multiplier": float(multiplier),
        "career_margin_remaining_mSv": float(round(career_limit_mSv - dose_mSv, 4)),
    }
