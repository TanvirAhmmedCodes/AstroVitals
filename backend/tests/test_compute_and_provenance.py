import os
import sys
import unittest
import numpy as np

# Ensure repository root and backend are on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.compute.trend import mann_kendall, theil_sen
from backend.compute.vitals_math import (
    calculate_hrv_metrics,
    compute_baseline_deviation,
    evaluate_vital_envelope,
)
from backend.compute.radiation_math import (
    check_south_atlantic_anomaly,
    calculate_radiation_metrics,
)
from backend.services.provenance import cite_check
from backend.services.safe_fetch import fetch_json
from mcp_server import (
    vitals_anomaly_check,
    trend_test,
    osdr_search,
    ntrs_search,
    cite_check as mcp_cite_check,
)


class TestDeterministicCompute(unittest.TestCase):

    def test_mann_kendall_increasing(self):
        # Monotonically increasing sequence
        values = [10.0, 12.0, 15.0, 18.0, 22.0, 25.0, 29.0, 33.0]
        res = mann_kendall(values)
        self.assertEqual(res["direction"], "increasing")
        self.assertTrue(res["significant_at_0.05"])
        self.assertGreater(res["S"], 0)

    def test_mann_kendall_decreasing(self):
        # Monotonically decreasing sequence
        values = [100.0, 95.0, 90.0, 85.0, 80.0, 75.0, 70.0]
        res = mann_kendall(values)
        self.assertEqual(res["direction"], "decreasing")
        self.assertTrue(res["significant_at_0.05"])
        self.assertLess(res["S"], 0)

    def test_theil_sen_slope(self):
        # Linear progression with slope approx 2.0
        dates_numeric = [0.0, 1.0, 2.0, 3.0, 4.0]
        values = [10.0, 12.0, 14.0, 16.0, 18.0]
        res = theil_sen(dates_numeric, values)
        self.assertAlmostEqual(res["slope_per_unit"], 2.0, places=2)
        self.assertAlmostEqual(res["intercept"], 10.0, places=2)

    def test_hrv_metrics(self):
        rr_intervals = [800, 810, 790, 820, 805, 795, 815]
        metrics = calculate_hrv_metrics(rr_intervals)
        self.assertGreater(metrics["rmssd_ms"], 0.0)
        self.assertGreater(metrics["sdnn_ms"], 0.0)
        self.assertGreater(metrics["estimated_hr_bpm"], 50.0)

    def test_baseline_deviations(self):
        dev = compute_baseline_deviation(current_val=95.0, baseline_mean=70.0, baseline_std=5.0)
        self.assertAlmostEqual(dev["z_score"], 5.0, places=1)
        self.assertAlmostEqual(dev["delta_absolute"], 25.0, places=1)

    def test_physiological_envelope_check(self):
        # Normal vitals
        normal_status = evaluate_vital_envelope(hr=75.0, spo2=98.0, temp_c=36.6, motion_g=0.05)
        self.assertEqual(normal_status["status"], "nominal")
        self.assertFalse(normal_status["is_anomaly"])

        # Hypoxia event (SpO2 below 91%)
        hypoxia_status = evaluate_vital_envelope(hr=75.0, spo2=89.0, temp_c=36.6, motion_g=0.05)
        self.assertEqual(hypoxia_status["status"], "critical")
        self.assertTrue(hypoxia_status["is_anomaly"])
        self.assertTrue(any("SPO2_CRITICAL_DESATURATION" in rule for rule in hypoxia_status["rules_fired"]))

    def test_radiation_math_and_limits(self):
        # Check SAA coordinate detection
        in_saa = check_south_atlantic_anomaly(-25.0, -40.0)
        self.assertTrue(in_saa)
        not_in_saa = check_south_atlantic_anomaly(45.0, 10.0)
        self.assertFalse(not_in_saa)

        # NASA-STD-3001 limits check
        rad_metrics = calculate_radiation_metrics(cumulative_uSv=50000.0, in_saa=False)
        self.assertAlmostEqual(rad_metrics["cumulative_mSv"], 50.0, places=1)
        self.assertAlmostEqual(rad_metrics["career_pct_used"], (50.0 / 600.0) * 100.0, places=2)
        self.assertFalse(rad_metrics["in_south_atlantic_anomaly"])


class TestProvenanceGate(unittest.TestCase):

    def test_cite_check_valid(self):
        claims = [
            {
                "text": "Cardiovascular risk score is 34.2",
                "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/OSD-569",
                "dataset_id": "NASA-OSDR-OSD-569",
            },
            {
                "text": "HRV RMSSD declined to 22.4 ms",
                "source_url": "https://www.nature.com/articles/s41467-024-49875-z",
                "dataset_id": "OSD-575",
            },
        ]
        res = cite_check(claims)
        self.assertTrue(res["valid"])
        self.assertEqual(len(res["failed_claims"]), 0)

    def test_cite_check_blocked_when_missing_source(self):
        claims = [
            {
                "text": "Cardiovascular risk score is 99.9",
                "source_url": "",
                "dataset_id": "NASA-OSDR-OSD-569",
            }
        ]
        res = cite_check(claims)
        self.assertFalse(res["valid"])
        self.assertEqual(len(res["failed_claims"]), 1)


class TestSafeFetchAndFixtures(unittest.TestCase):

    def test_safe_fetch_offline_fixture(self):
        # Force OFFLINE mode
        os.environ["OFFLINE"] = "1"
        data, mode = fetch_json(
            "https://api.nasa.gov/planetary/apod", name="apod"
        )
        self.assertEqual(mode, "fixture")
        self.assertIn("title", data)
        del os.environ["OFFLINE"]

    def test_vitals_fixture_content(self):
        data, mode = fetch_json("http://dummy.url", name="vitals")
        self.assertIn(mode, ["fixture", "cache"])
        self.assertEqual(len(data), 600)
        self.assertIn("heart_rate_bpm", data[0])


class TestAnomalyDetector(unittest.TestCase):

    def test_isolation_forest_flags_outlier(self):
        import joblib
        model_path = os.path.join(REPO_ROOT, "models", "anomaly_detector.pkl")
        self.assertTrue(os.path.exists(model_path))
        obj = joblib.load(model_path)
        detector = obj["model"] if isinstance(obj, dict) else obj

        # An extreme physiological vector with 619 features
        n_features = detector.n_features_in_
        outlier_pt = np.full((1, n_features), 100.0)
        pred_outlier = detector.predict(outlier_pt)

        # IsolationForest returns 1 for inlier, -1 for outlier
        self.assertEqual(pred_outlier[0], -1)


class TestMCPTools(unittest.TestCase):

    def test_vitals_anomaly_check_tool(self):
        res = vitals_anomaly_check(heart_rate=145.0, spo2=98.0, skin_temp=36.5)
        self.assertEqual(res["status"], "critical")
        self.assertTrue(res["is_anomaly"])
        self.assertIn("provenance", res)
        self.assertEqual(res["provenance"]["dataset_id"], "NASA-STD-3001-VOL-1")

    def test_trend_test_tool(self):
        values = [50.0, 55.0, 60.0, 65.0, 70.0, 75.0]
        res = trend_test(values)
        self.assertEqual(res["mann_kendall"]["direction"], "increasing")
        self.assertIn("theil_sen", res)
        self.assertIn("provenance", res)

    def test_osdr_search_tool(self):
        res = osdr_search(query="Inspiration4", limit=2)
        self.assertIsInstance(res, list)
        self.assertGreaterEqual(len(res), 1)
        self.assertIn("accession", res[0])

    def test_ntrs_search_tool(self):
        res = ntrs_search(query="microgravity cardiovascular", limit=2)
        self.assertIsInstance(res, list)
        self.assertGreaterEqual(len(res), 1)
        self.assertIn("title", res[0])

    def test_cite_check_tool(self):
        claims = [{"text": "Test metric", "source_url": "https://nasa.gov", "dataset_id": "TEST-01"}]
        res = mcp_cite_check(claims)
        self.assertTrue(res["valid"])


if __name__ == "__main__":
    unittest.main()
