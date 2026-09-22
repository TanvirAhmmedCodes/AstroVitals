import os
import sys
import json
import unittest
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

# Ensure repository root and backend are on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.services.model_registry import ModelRegistry


class TestModelInferenceAndSplit(unittest.TestCase):
    """Rigorous unit tests for AstroVitals ML models, validation split, and inference parity."""

    @classmethod
    def setUpClass(cls):
        cls.models_dir = os.path.join(REPO_ROOT, "models")
        metrics_file = os.path.join(cls.models_dir, "metrics.json")
        with open(metrics_file, "r") as f:
            cls.metrics = json.load(f)

        data_file = os.path.join(REPO_ROOT, "data", "harmonized_training_table.csv")
        cls.data_df = pd.read_csv(data_file)
        cls.registry = ModelRegistry()

    def test_subject_level_group_kfold_split_zero_leakage(self):
        """CRITICAL TEST: Verify that GroupKFold strictly partitions subjects.
        
        No subject ID must EVER appear in both the training and validation sets
        of any cross-validation fold.
        """
        groups = self.data_df["subject_id"]
        unique_subjects = groups.unique()
        self.assertGreaterEqual(len(unique_subjects), 15, "Expected at least 15 subjects in cohort")

        gkf = GroupKFold(n_splits=5)
        for fold, (train_idx, val_idx) in enumerate(gkf.split(self.data_df, groups=groups)):
            train_subs = set(groups.iloc[train_idx])
            val_subs = set(groups.iloc[val_idx])

            overlap = train_subs.intersection(val_subs)
            self.assertEqual(
                len(overlap),
                0,
                f"Subject leakage detected in fold {fold}! Subjects in both folds: {overlap}",
            )

    def test_inference_parity_cardiovascular(self):
        """Verify cardiovascular model inference matches reference prediction in metrics.json within tolerance."""
        ref_sample = pd.DataFrame([self.metrics["reference_test_sample"]])
        expected = self.metrics["reference_expected_predictions"]["cardiovascular"]
        score = self.registry.score("cv", ref_sample)
        self.assertAlmostEqual(
            score,
            expected,
            places=2,
            msg=f"Cardiovascular prediction {score} diverged from reference {expected}",
        )

    def test_inference_parity_sleep_behavioral(self):
        """Verify sleep and behavioral model inference matches reference prediction in metrics.json within tolerance."""
        ref_sample = pd.DataFrame([self.metrics["reference_test_sample"]])
        expected = self.metrics["reference_expected_predictions"]["sleep_behavioral"]
        score = self.registry.score("sleep", ref_sample)
        self.assertAlmostEqual(
            score,
            expected,
            places=2,
            msg=f"Sleep and behavioral prediction {score} diverged from reference {expected}",
        )

    def test_inference_parity_immune(self):
        """Verify immune model inference matches reference prediction in metrics.json within tolerance."""
        ref_sample = pd.DataFrame([self.metrics["reference_test_sample"]])
        expected = self.metrics["reference_expected_predictions"]["immune"]
        score = self.registry.score("immune", ref_sample)
        self.assertAlmostEqual(
            score,
            expected,
            places=2,
            msg=f"Immune prediction {score} diverged from reference {expected}",
        )

    def test_anomaly_detector_inlier(self):
        """Verify anomaly detector does not flag a healthy physiological baseline row."""
        ref_sample = pd.DataFrame([self.metrics["reference_test_sample"]])
        is_anomaly = self.registry.detect_anomaly(ref_sample)
        self.assertFalse(is_anomaly, "Baseline physiological profile falsely flagged as anomaly")

    def test_anomaly_detector_feature_space_outlier(self):
        """Verify anomaly detector flags severe multi-biomarker deviations in feature space."""
        ref_sample = pd.DataFrame([self.metrics["reference_test_sample"]])
        outlier = ref_sample.copy()
        for col in self.registry.anomaly["feature_columns"]:
            outlier[col] = outlier[col] * 3.5

        is_anomaly = self.registry.detect_anomaly(outlier)
        self.assertTrue(is_anomaly, "Severe feature space outlier was not flagged by anomaly detector")

    def test_anomaly_detector_vital_envelope_outlier(self):
        """Verify real-time physiological vital envelope flags critical tachycardia and hypoxia."""
        ref_sample = pd.DataFrame([self.metrics["reference_test_sample"]])
        is_hr_anomaly = self.registry.detect_anomaly(ref_sample, vitals={"heart_rate_bpm": 155.0})
        self.assertTrue(is_hr_anomaly, "Critical tachycardia (155 bpm) was not flagged as anomaly")

        is_spo2_anomaly = self.registry.detect_anomaly(ref_sample, vitals={"spo2_pct": 86.0})
        self.assertTrue(is_spo2_anomaly, "Critical hypoxia (SpO2 86%) was not flagged as anomaly")

    def test_honest_r_squared_validation_scores(self):
        """Verify model validation scores are scientifically honest and positive under GroupKFold."""
        cv_r2 = self.metrics["models"]["cardiovascular"]["cv_r2_mean"]
        sleep_r2 = self.metrics["models"]["sleep_behavioral"]["cv_r2_mean"]
        immune_r2 = self.metrics["models"]["immune"]["cv_r2_mean"]

        self.assertGreater(cv_r2, 0.40, f"Cardiovascular R2 too low: {cv_r2}")
        self.assertLess(cv_r2, 0.85, f"Cardiovascular R2 suspiciously high (possible leakage): {cv_r2}")

        self.assertGreater(sleep_r2, 0.40, f"Sleep R2 too low: {sleep_r2}")
        self.assertLess(sleep_r2, 0.85, f"Sleep R2 suspiciously high (possible leakage): {sleep_r2}")

        self.assertGreater(immune_r2, 0.40, f"Immune R2 too low: {immune_r2}")
        self.assertLess(immune_r2, 0.85, f"Immune R2 suspiciously high (possible leakage): {immune_r2}")


if __name__ == "__main__":
    unittest.main()
