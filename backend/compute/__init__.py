"""Deterministic Scientific Compute Module for AstroVitals.

All numeric derivations (statistics, trend analysis, anomaly scores, slopes,
p-values, radiation physics, and geometry) are implemented as pure,
deterministic functions in this package. The LLM / Agent calls these functions
as tools and never performs arithmetic directly.
"""

from .trend import mann_kendall, theil_sen
from .vitals_math import calculate_hrv_metrics, compute_baseline_deviation, evaluate_vital_envelope
from .radiation_math import calculate_radiation_metrics, check_south_atlantic_anomaly

__all__ = [
    "mann_kendall",
    "theil_sen",
    "calculate_hrv_metrics",
    "compute_baseline_deviation",
    "evaluate_vital_envelope",
    "calculate_radiation_metrics",
    "check_south_atlantic_anomaly",
]
