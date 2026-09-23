"""Deterministic scientific compute layer for AstroVitals.
All mathematical and statistical operations are isolated here. Zero LLM arithmetic.
"""

from src.compute.trend import mann_kendall, theil_sen
from src.compute.vitals_math import (
    calculate_hrv_metrics,
    compute_baseline_deviation,
    evaluate_vital_envelope,
)
from src.compute.radiation_math import (
    check_south_atlantic_anomaly,
    calculate_radiation_metrics,
)

__all__ = [
    "mann_kendall",
    "theil_sen",
    "calculate_hrv_metrics",
    "compute_baseline_deviation",
    "evaluate_vital_envelope",
    "check_south_atlantic_anomaly",
    "calculate_radiation_metrics",
]
