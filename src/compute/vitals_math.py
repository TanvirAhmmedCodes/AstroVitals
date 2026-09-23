"""Deterministic vital signs and cardiovascular mathematical module.

Calculates Heart Rate Variability (HRV) metrics, baseline deviations,
and vital safety envelope evaluations outside the LLM.
"""

from typing import List, Dict, Any, Optional, Union
import numpy as np


def calculate_hrv_metrics(rr_intervals_ms: List[Union[int, float]]) -> Dict[str, Any]:
    """Compute time-domain Heart Rate Variability (HRV) metrics from RR intervals.

    Returns:
      sdnn_ms: Standard deviation of normal-to-normal intervals (overall HRV).
      rmssd_ms: Root mean square of successive differences (parasympathetic tone).
      pnn50_pct: Percentage of successive intervals differing by > 50 ms.
      mean_rr_ms: Average RR interval duration.
      estimated_hr_bpm: Heart rate derived directly from mean RR interval.
    """
    rr = np.asarray(rr_intervals_ms, dtype=float)
    rr = rr[~np.isnan(rr)]
    rr = rr[rr > 200.0]  # Filter physiological artifacts < 200 ms (> 300 bpm)
    rr = rr[rr < 2500.0]  # Filter pauses > 2500 ms (< 24 bpm)

    n = len(rr)
    if n < 3:
        return {
            "sdnn_ms": 0.0,
            "rmssd_ms": 0.0,
            "pnn50_pct": 0.0,
            "mean_rr_ms": 833.3,
            "estimated_hr_bpm": 72.0,
            "sample_count": n,
        }

    diffs = np.diff(rr)
    sdnn = float(np.std(rr, ddof=1)) if n > 1 else 0.0
    rmssd = float(np.sqrt(np.mean(diffs ** 2))) if len(diffs) > 0 else 0.0
    nn50 = int(np.sum(np.abs(diffs) > 50.0))
    pnn50 = float((nn50 / len(diffs)) * 100.0) if len(diffs) > 0 else 0.0
    mean_rr = float(np.mean(rr))
    est_hr = float(60000.0 / mean_rr) if mean_rr > 0 else 72.0

    return {
        "sdnn_ms": float(round(sdnn, 2)),
        "rmssd_ms": float(round(rmssd, 2)),
        "pnn50_pct": float(round(pnn50, 2)),
        "mean_rr_ms": float(round(mean_rr, 2)),
        "estimated_hr_bpm": float(round(est_hr, 1)),
        "sample_count": int(n),
    }


def compute_baseline_deviation(
    current_val: float,
    baseline_mean: float,
    baseline_std: float,
    baseline_median: Optional[float] = None,
    baseline_mad: Optional[float] = None,
) -> Dict[str, Any]:
    """Compute standardized parametric and robust deviations from astronaut baseline."""
    if baseline_std and baseline_std > 0:
        z_score = (current_val - baseline_mean) / baseline_std
    else:
        z_score = 0.0

    pct_delta = ((current_val - baseline_mean) / baseline_mean * 100.0) if baseline_mean != 0 else 0.0

    if baseline_median is not None and baseline_mad is not None and baseline_mad > 0:
        robust_z = (current_val - baseline_median) / (1.4826 * baseline_mad)
    else:
        robust_z = z_score

    return {
        "current_value": float(current_val),
        "baseline_mean": float(baseline_mean),
        "delta_absolute": float(round(current_val - baseline_mean, 3)),
        "delta_percent": float(round(pct_delta, 2)),
        "z_score": float(round(z_score, 3)),
        "robust_z_score": float(round(robust_z, 3)),
    }


def evaluate_vital_envelope(
    hr: Optional[float] = None,
    spo2: Optional[float] = None,
    temp_c: Optional[float] = None,
    motion_g: Optional[float] = None,
) -> Dict[str, Any]:
    """Deterministic rule-based safety envelope check according to NASA flight medical rules.

    Returns severity status ('nominal', 'caution', 'critical') and specific rules that fired.
    Zero diagnostic assertions; returns explicit boundary conditions only.
    """
    rules_fired: List[str] = []
    is_anomaly = False
    severity = "nominal"

    if hr is not None:
        if hr > 130.0:
            rules_fired.append("HEART_RATE_CRITICAL_HIGH (>130 BPM)")
            severity = "critical"
            is_anomaly = True
        elif hr > 95.0:
            rules_fired.append("HEART_RATE_ELEVATED (>95 BPM)")
            if severity != "critical":
                severity = "caution"
        elif hr < 45.0:
            rules_fired.append("HEART_RATE_CRITICAL_LOW (<45 BPM)")
            severity = "critical"
            is_anomaly = True
        elif hr < 52.0:
            rules_fired.append("HEART_RATE_SUPPRESSED (<52 BPM)")
            if severity != "critical":
                severity = "caution"

    if spo2 is not None:
        if spo2 < 91.0:
            rules_fired.append("SPO2_CRITICAL_DESATURATION (<91%)")
            severity = "critical"
            is_anomaly = True
        elif spo2 < 95.0:
            rules_fired.append("SPO2_SUBOPTIMAL (<95%)")
            if severity != "critical":
                severity = "caution"

    if temp_c is not None:
        if temp_c > 38.5:
            rules_fired.append("CORE_TEMP_HYPERTHERMIC (>38.5 C)")
            severity = "critical"
            is_anomaly = True
        elif temp_c > 37.8:
            rules_fired.append("CORE_TEMP_ELEVATED (>37.8 C)")
            if severity != "critical":
                severity = "caution"
        elif temp_c < 35.0:
            rules_fired.append("CORE_TEMP_HYPOTHERMIC (<35.0 C)")
            severity = "critical"
            is_anomaly = True

    if motion_g is not None and motion_g > 2.5:
        rules_fired.append("ACCELERATION_HIGH_EXCURSION (>2.5 G)")
        if severity != "critical":
            severity = "caution"

    return {
        "status": severity,
        "is_anomaly": is_anomaly,
        "rules_fired": rules_fired,
        "rule_count": len(rules_fired),
    }
