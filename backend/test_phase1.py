"""Phase 1 Backend Verification Test Suite."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timezone
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import init_db

init_db()
client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "OPERATIONAL"
    print("[PASS] Root endpoint passed:", data)


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "nominal"
    assert data["models_loaded"] is True
    print("[PASS] Health check passed (models_loaded=True):", data)


def test_metrics():
    r = client.get("/api/v1/metrics")
    assert r.status_code == 200
    data = r.json()
    assert "metrics" in data
    assert "disclosure" in data
    print("[PASS] Model metrics & negative R2 disclosure passed")


def test_ingest_and_latest():
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "device_id": "esp32-test-01",
        "astronaut_id": "astronaut-A",
        "readings": [
            {
                "timestamp_utc": now_iso,
                "heart_rate_bpm": 74.5,
                "spo2_pct": 98.2,
                "skin_temp_c": 36.55,
                "accel_x_g": 0.01,
                "accel_y_g": -0.02,
                "accel_z_g": 0.99,
                "activity_state": "rest",
                "radiation_dose_uSv_cumulative": 12.55,
                "battery_pct": 94.0,
                "wifi_rssi": -42.0,
                "buffered": False,
            }
        ],
    }

    # Test Ingest
    r_ingest = client.post("/api/v1/ingest/vitals", json=payload)
    assert r_ingest.status_code == 200
    ingest_data = r_ingest.json()
    assert ingest_data["status"] == "success"
    assert ingest_data["inserted_count"] == 1
    print("[PASS] Ingest endpoint passed:", ingest_data)

    # Test Latest Vitals
    r_latest = client.get("/api/v1/vitals/latest?astronaut_id=astronaut-A")
    assert r_latest.status_code == 200
    latest_data = r_latest.json()
    assert latest_data["astronaut_id"] == "astronaut-A"
    assert latest_data["heart_rate_bpm"] == 74.5
    assert latest_data["spo2_pct"] == 98.2
    assert latest_data["status"] == "nominal"
    print("[PASS] Latest vitals passed:", latest_data)

    # Test History
    r_hist = client.get("/api/v1/vitals/history?astronaut_id=astronaut-A&limit=10")
    assert r_hist.status_code == 200
    hist_data = r_hist.json()
    assert hist_data["total_records"] >= 1
    print(f"[PASS] Vitals history passed ({hist_data['total_records']} records)")


def test_risk():
    r = client.get("/api/v1/risk/current?astronaut_id=astronaut-A")
    assert r.status_code == 200
    data = r.json()
    assert "composite_risk" in data
    assert "cardiovascular" in data
    assert "sleep_behavioral" in data
    assert "immune" in data
    assert "honesty_disclosure" in data
    assert data["cardiovascular"]["r2_disclosure"] == -0.43
    print("[PASS] Current risk evaluation passed:", {
        "composite": data["composite_risk"],
        "status": data["overall_status"],
        "cv": data["cardiovascular"]["score"],
        "sleep": data["sleep_behavioral"]["score"],
        "immune": data["immune"]["score"],
    })


def test_radiation():
    r = client.get("/api/v1/radiation/status?astronaut_id=astronaut-A")
    assert r.status_code == 200
    data = r.json()
    assert data["career_limit_mSv"] == 600.0
    assert data["spe_mission_limit_mSv"] == 250.0
    assert "cumulative_dose_uSv" in data
    assert "status" in data
    print("[PASS] Radiation status passed:", {
        "cumulative_uSv": data["cumulative_dose_uSv"],
        "career_pct": data["career_pct_used"],
        "spe_pct": data["spe_pct_used"],
        "status": data["status"],
    })


def test_anomaly_ingest():
    now_iso = datetime.now(timezone.utc).isoformat()
    anomaly_payload = {
        "device_id": "esp32-test-01",
        "astronaut_id": "astronaut-A",
        "readings": [
            {
                "timestamp_utc": now_iso,
                "heart_rate_bpm": 142.0,  # Extreme tachycardia
                "spo2_pct": 87.5,         # Hypoxia
                "skin_temp_c": 38.9,
                "accel_x_g": 0.55,
                "accel_y_g": 0.82,
                "accel_z_g": 1.95,
                "activity_state": "active",
                "radiation_dose_uSv_cumulative": 13.0,
                "battery_pct": 80.0,
                "wifi_rssi": -55.0,
                "buffered": False,
            }
        ],
    }
    r = client.post("/api/v1/ingest/vitals", json=anomaly_payload)
    assert r.status_code == 200
    data = r.json()
    assert data["anomaly_detected"] is True
    print("[PASS] Anomaly detection verified in ingest:", data)


if __name__ == "__main__":
    print("Starting AstroVitals Phase 1 Test Suite...")
    test_root()
    test_health()
    test_metrics()
    test_ingest_and_latest()
    test_risk()
    test_radiation()
    test_anomaly_ingest()
    print("\nALL PHASE 1 BACKEND TESTS PASSED!")
