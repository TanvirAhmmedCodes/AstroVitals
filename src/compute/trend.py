"""Deterministic trend testing module.

Provides non-parametric statistical trend evaluation using the Mann-Kendall test
and Theil-Sen robust linear slope estimator. Zero LLM arithmetic.
"""

from typing import List, Dict, Any, Union
import numpy as np
from scipy import stats


def mann_kendall(values: List[Union[int, float]]) -> Dict[str, Any]:
    """Execute non-parametric Mann-Kendall trend test on numeric series.

    Returns S statistic, Z score, two-sided p-value, and direction string.
    """
    x = np.asarray(values, dtype=float)
    x = x[~np.isnan(x)]
    n = len(x)

    if n < 3:
        return {
            "S": 0.0,
            "Z": 0.0,
            "p_value": 1.0,
            "direction": "none",
            "significant_at_0.05": False,
            "sample_size": n,
        }

    s = 0.0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diff = x[j] - x[i]
            if diff > 0:
                s += 1.0
            elif diff < 0:
                s -= 1.0

    # Variance calculation with tie correction
    unique_vals, counts = np.unique(x, return_counts=True)
    tie_term = sum(c * (c - 1) * (2 * c + 5) for c in counts if c > 1)
    var_s = (n * (n - 1) * (2 * n + 5) - tie_term) / 18.0

    if var_s > 0:
        if s > 0:
            z = (s - 1.0) / np.sqrt(var_s)
        elif s < 0:
            z = (s + 1.0) / np.sqrt(var_s)
        else:
            z = 0.0
    else:
        z = 0.0

    p = float(2.0 * (1.0 - stats.norm.cdf(abs(z))))
    direction = "increasing" if s > 0 else "decreasing" if s < 0 else "none"

    return {
        "S": float(s),
        "Z": float(round(z, 4)),
        "p_value": float(round(p, 5)),
        "direction": direction,
        "significant_at_0.05": bool(p < 0.05),
        "sample_size": int(n),
    }


def theil_sen(dates_numeric: List[Union[int, float]], values: List[Union[int, float]]) -> Dict[str, Any]:
    """Calculate Theil-Sen robust estimator for linear trend slope and intercept."""
    x = np.asarray(dates_numeric, dtype=float)
    y = np.asarray(values, dtype=float)

    mask = (~np.isnan(x)) & (~np.isnan(y))
    x = x[mask]
    y = y[mask]

    if len(x) < 2 or np.all(x == x[0]):
        return {
            "slope_per_unit": 0.0,
            "intercept": float(y[0]) if len(y) > 0 else 0.0,
            "ci_low": 0.0,
            "ci_high": 0.0,
        }

    res = stats.theilslopes(y, x, alpha=0.95)
    slope, intercept, lo, hi = res

    return {
        "slope_per_unit": float(round(slope, 5)),
        "intercept": float(round(intercept, 4)),
        "ci_low": float(round(lo, 5)),
        "ci_high": float(round(hi, 5)),
    }
