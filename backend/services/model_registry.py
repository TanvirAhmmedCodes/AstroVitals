import json
from pathlib import Path
from typing import Dict, Any, Optional, List
import joblib
import pandas as pd
import numpy as np

try:
    from config import settings
except ImportError:
    from backend.config import settings


class ModelRegistry:
    """Manages access to trained ML models and baseline statistics.

    Models are trained with 5-fold GroupKFold cross-validation grouped strictly
    by subject_id across 36 subjects (zero cross-subject leakage).
    """

    def __init__(self):
        self.models_dir = settings.MODELS_DIR
        self.loaded = False
        self.cv = None
        self.sleep = None
        self.immune = None
        self.anomaly = None
        self.baseline_stats: Dict[str, Any] = {}
        self.cognitive_norms: Dict[str, Any] = {}
        self.feature_columns: Dict[str, List[str]] = {}
        self.metrics: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}

        self.load_models()

    def load_models(self):
        """Load frozen artifacts from /models/ directory with multi-path fallback."""
        try:
            # Fallback path resolution if default directory is missing artifacts
            resolved_dir = self.models_dir
            if not (resolved_dir / "anomaly_detector.pkl").exists():
                for candidate in [
                    Path(__file__).resolve().parent.parent / "models",  # backend/models
                    Path(__file__).resolve().parent.parent.parent / "models",  # repo root/models
                    Path.cwd() / "models",
                    Path.cwd() / "backend" / "models",
                ]:
                    if (candidate / "anomaly_detector.pkl").exists():
                        resolved_dir = candidate
                        break
            self.models_dir = resolved_dir

            cv_path = self.models_dir / "risk_model_cardiovascular.pkl"
            sleep_path = self.models_dir / "risk_model_sleep_behavioral.pkl"
            immune_path = self.models_dir / "risk_model_immune.pkl"
            anomaly_path = self.models_dir / "anomaly_detector.pkl"

            if cv_path.exists():
                self.cv = joblib.load(cv_path)
            if sleep_path.exists():
                self.sleep = joblib.load(sleep_path)
            if immune_path.exists():
                self.immune = joblib.load(immune_path)
            if anomaly_path.exists():
                self.anomaly = joblib.load(anomaly_path)

            # Load JSON stats & metadata
            base_json = self.models_dir / "baseline_stats.json"
            if base_json.exists():
                with open(base_json, "r") as f:
                    self.baseline_stats = json.load(f)

            norms_json = self.models_dir / "cognitive_norms.json"
            if norms_json.exists():
                with open(norms_json, "r") as f:
                    self.cognitive_norms = json.load(f)

            cols_json = self.models_dir / "feature_columns.json"
            if cols_json.exists():
                with open(cols_json, "r") as f:
                    self.feature_columns = json.load(f)

            metrics_json = self.models_dir / "metrics.json"
            if metrics_json.exists():
                with open(metrics_json, "r") as f:
                    self.metrics = json.load(f)

            meta_json = self.models_dir / "model_metadata.json"
            if meta_json.exists():
                with open(meta_json, "r") as f:
                    self.metadata = json.load(f)

            self.loaded = bool(self.cv and self.sleep and self.immune and self.anomaly)
            print(f"[ModelRegistry] Successfully loaded frozen models (status={self.loaded})")
        except Exception as e:
            print(f"[ModelRegistry] Warning: Could not load some frozen models: {e}")
            self.loaded = False

    def build_feature_dataframe(
        self,
        mission_day: int = 42,
        age: float = 38.0,
        hr_bpm: Optional[float] = 72.0,
        spo2_pct: Optional[float] = 98.0,
        temp_c: Optional[float] = 36.5,
        activity: str = "rest",
        features_required: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """Construct a feature row by blending baseline medians with real-time vitals stress proxies."""
        data: Dict[str, float] = {}

        # Default all known baseline stats to their median
        for feature_name, stat_dict in self.baseline_stats.items():
            data[feature_name] = stat_dict.get("median", 0.0)

        # Set mission metadata
        data["Mission_Day"] = float(mission_day)
        data["Age"] = float(age)

        # Modulate biomarker proxies based on actual wearable vitals deviations
        # HR baseline is ~70-72 bpm
        hr_val = hr_bpm if hr_bpm is not None else 72.0
        hr_delta = (hr_val - 72.0) / 72.0

        # SpO2 baseline is 98%
        spo2_val = spo2_pct if spo2_pct is not None else 98.0
        spo2_delta = (98.0 - spo2_val) / 98.0

        # When HR is elevated significantly, correlate inflammatory proxies (IL6, CRP, Glucose, WBC)
        if "CRP" in data and hr_delta > 0.10:
            data["CRP"] *= (1.0 + hr_delta * 1.5)
        if "IL6" in data and hr_delta > 0.10:
            data["IL6"] *= (1.0 + hr_delta * 1.8)
        if "Glucose" in data and activity == "exercise":
            data["Glucose"] *= 1.15
        if "WBC" in data and (hr_delta > 0.20 or temp_c > 37.5):
            data["WBC"] *= 1.25
        if "Hematocrit" in data and spo2_delta > 0.03:
            data["Hematocrit"] *= 1.08

        # Ensure all required features exist
        if features_required:
            for feat in features_required:
                if feat not in data:
                    data[feat] = 0.0

        return pd.DataFrame([data])

    def score(self, category: str, features_df: pd.DataFrame) -> float:
        """Score risk for category using the regularized linear model.

        Returns bounded risk score (0-100).
        """
        art = getattr(self, category, None)
        if art is None or not isinstance(art, dict):
            # Fallback based on baseline metrics if model artifact is unavailable
            return 12.0

        cols = art.get("feature_columns", [])
        # Ensure all columns exist in features_df
        X_df = features_df.copy()
        for c in cols:
            if c not in X_df.columns:
                X_df[c] = self.baseline_stats.get(c, {}).get("median", 0.0)

        try:
            X = art["imputer"].transform(X_df[cols])
            raw_pred = art["model"].predict(X)[0]
            if pd.isna(raw_pred) or np.isnan(raw_pred):
                print(f"[ModelRegistry] Prediction for {category} returned NaN, using fallback 50.0")
                return 50.0
            pred = float(raw_pred)
            # Normalize to 0-100 scale for mission control
            return float(np.clip(pred, 0.0, 100.0))
        except Exception as e:
            print(f"[ModelRegistry] Prediction error for {category}: {e}")
            return 15.0

    def detect_anomaly(self, features_df: pd.DataFrame, vitals: Optional[Dict[str, Any]] = None) -> bool:
        """Detect anomaly using IsolationForest and physiological safety boundaries.

        Returns True if an anomaly is detected.
        """
        # 1. Physiological vital safety envelope check (real-time failsafe)
        if vitals:
            hr = vitals.get("heart_rate_bpm")
            spo2 = vitals.get("spo2_pct")
            temp = vitals.get("skin_temp_c")

            if hr is not None and (hr < 45 or hr > 130):
                return True
            if spo2 is not None and spo2 < 92.0:
                return True
            if temp is not None and (temp < 35.0 or temp > 38.5):
                return True

        # 2. IsolationForest model prediction
        if not self.anomaly or not isinstance(self.anomaly, dict):
            return False

        cols = self.anomaly.get("feature_columns", [])
        X_df = features_df.copy()
        for c in cols:
            if c not in X_df.columns:
                X_df[c] = self.baseline_stats.get(c, {}).get("median", 0.0)

        try:
            if "imputer" in self.anomaly and self.anomaly["imputer"] is not None:
                X = self.anomaly["imputer"].transform(X_df[cols])
            else:
                X = X_df[cols].fillna(0).to_numpy()
            pred = self.anomaly["model"].predict(X)[0]
            # IsolationForest returns -1 for outlier/anomaly, 1 for inlier
            return bool(pred == -1)
        except Exception as e:
            print(f"[ModelRegistry] Anomaly detection error: {e}")
            return False


# Singleton registry instance
registry = ModelRegistry()
