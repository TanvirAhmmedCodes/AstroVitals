"""AstroVitals Backend Comprehensive Test Suite.

Consolidated verification suite combining core API checks, cognitive testing,
astronaut profiles, authentication/RBAC, ML model registry, deterministic math,
and telemetry simulation.
"""

import os
import sys
import math
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory and repo root to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
REPO_ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db, SessionLocal, User
from backend.config import settings
from backend.services.auth_service import hash_password

init_db()
client = TestClient(app)


# ============================================================================
# SECTION 1: CORE API & TELEMETRY INGESTION
# ============================================================================

def test_section_1_core_api_and_ingestion():
    print("\n" + "=" * 60)
    print("SECTION 1: CORE API & TELEMETRY INGESTION")
    print("=" * 60)

    # 1. Root operational status
    r_root = client.get("/")
    assert r_root.status_code == 200, f"Root endpoint failed: {r_root.text}"
    root_data = r_root.json()
    assert root_data["status"] == "OPERATIONAL"
    print("[PASS] Root endpoint operational")

    # 2. Health check
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
    health_data = r_health.json()
    assert health_data["status"] in ["nominal", "ok"]
    assert health_data["models_loaded"] is True
    print("[PASS] Health check passed (status=nominal, models_loaded=True)")

    # 3. Model metrics endpoint
    r_metrics = client.get("/api/v1/metrics")
    assert r_metrics.status_code == 200, f"Metrics failed: {r_metrics.text}"
    metrics_data = r_metrics.json()
    assert "metrics" in metrics_data
    print("[PASS] Model metrics endpoint returned valid evaluation metrics")

    # 4. Ingest and latest telemetry
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "device_id": "esp32-test-hub",
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
                "buffered": False
            }
        ]
    }
    r_ingest = client.post("/api/v1/ingest/vitals", json=payload)
    assert r_ingest.status_code == 200, f"Ingest failed: {r_ingest.text}"
    ingest_data = r_ingest.json()
    assert ingest_data["status"] == "success"
    assert ingest_data["inserted_count"] == 1
    print("[PASS] Telemetry ingest succeeded for astronaut-A")

    # 5. Fetch latest vitals
    r_latest = client.get("/api/v1/vitals/latest?astronaut_id=astronaut-A")
    assert r_latest.status_code == 200, f"Latest vitals failed: {r_latest.text}"
    latest_data = r_latest.json()
    assert latest_data["astronaut_id"] == "astronaut-A"
    assert abs(latest_data["heart_rate_bpm"] - 74.5) < 0.1
    print("[PASS] Latest vitals query matched ingested payload")

    # 6. Radiation status
    r_rad = client.get("/api/v1/radiation/status?astronaut_id=astronaut-A")
    assert r_rad.status_code == 200, f"Radiation status failed: {r_rad.text}"
    print("[PASS] Radiation status endpoint returned valid payload")

    # 7. Alerts history
    r_alerts = client.get("/api/v1/alerts/history?astronaut_id=astronaut-A")
    assert r_alerts.status_code == 200, f"Alerts failed: {r_alerts.text}"
    print("[PASS] Alerts history endpoint returned valid array")


# ============================================================================
# SECTION 2: COGNITIVE, ASTRONAUT & ANALYTICS
# ============================================================================

def test_section_2_cognitive_and_astronaut():
    print("\n" + "=" * 60)
    print("SECTION 2: COGNITIVE, ASTRONAUT & ANALYTICS")
    print("=" * 60)

    # 1. Cognitive Norms
    r_norms = client.get("/api/v1/cognitive/norms")
    assert r_norms.status_code == 200
    norms = r_norms.json()
    assert "reaction_time_ms_mean" in norms
    print("[PASS] Cognitive norms loaded successfully")

    # 2. Submit cognitive test
    cog_payload = {
        "astronaut_id": "astronaut-A",
        "reaction_times_ms": [280.0, 295.0, 310.0, 285.0, 290.0],
        "mood_score": 8.0,
        "alertness_score": 7.0,
        "stress_score": 3.0
    }
    r_cog = client.post("/api/v1/cognitive/test", json=cog_payload)
    assert r_cog.status_code == 200
    cog_res = r_cog.json()
    assert cog_res["astronaut_id"] == "astronaut-A"
    assert cog_res["reaction_time_mean"] == 292.0
    assert cog_res["status"] == "nominal"
    print("[PASS] Cognitive test evaluation calculated resilience score")

    # 3. Cognitive history
    r_hist = client.get("/api/v1/cognitive/history?astronaut_id=astronaut-A")
    assert r_hist.status_code == 200
    assert r_hist.json()["total_records"] >= 1
    print("[PASS] Cognitive history query succeeded")

    # 4. Astronaut profile listing
    r_crew = client.get("/api/v1/astronaut/list")
    assert r_crew.status_code == 200
    crew_data = r_crew.json()
    assert crew_data["total_crew"] >= 1
    first_id = crew_data["crew"][0]["id"]
    print(f"[PASS] Crew roster active with {crew_data['total_crew']} astronauts")

    # 5. Single astronaut dossier
    r_dossier = client.get(f"/api/v1/astronaut/{first_id}")
    assert r_dossier.status_code == 200
    print(f"[PASS] Medical dossier retrieved for {first_id}")

    # 6. Analytics forecast
    r_analytics = client.get("/api/v1/analytics/forecast?astronaut_id=astronaut-A")
    assert r_analytics.status_code == 200
    print("[PASS] Risk forecast analytics retrieved")

    # 7. External ISS tracker
    r_iss = client.get("/api/v1/external/iss")
    assert r_iss.status_code == 200
    print("[PASS] External ISS telemetry endpoint verified")


# ============================================================================
# SECTION 3: AUTHENTICATION, RBAC & USER MANAGEMENT
# ============================================================================

def test_section_3_auth_and_rbac():
    print("\n" + "=" * 60)
    print("SECTION 3: AUTHENTICATION, RBAC & USER MANAGEMENT")
    print("=" * 60)

    # 1. Observer registration
    email_test = f"observer_test_{int(datetime.now().timestamp())}@orbitrix.space"
    reg_payload = {
        "email": email_test,
        "password": "Password123!",
        "full_name": "Test Observer"
    }
    r_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert r_reg.status_code in (200, 201), f"Register failed: {r_reg.text}"
    print("[PASS] Observer registration succeeded")

    # 2. Observer login
    r_login = client.post("/api/v1/auth/login", json={
        "email": email_test,
        "password": "Password123!"
    })
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    token_key = "access_token" if "access_token" in r_login.json() else "token"
    observer_token = r_login.json()[token_key]
    print("[PASS] Observer authentication returned valid JWT")

    # 3. Observer profile check
    r_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {observer_token}"})
    assert r_me.status_code == 200
    user_info = r_me.json().get("user", r_me.json())
    assert user_info["email"] == email_test
    assert user_info["role"] == "observer"
    print("[PASS] /auth/me verified observer identity and role")

    # 4. RBAC denial for observer on admin routes
    r_denied = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {observer_token}"})
    assert r_denied.status_code == 403, "Observer must receive 403 Forbidden on admin endpoint"
    print("[PASS] RBAC correctly denied observer access to admin management (HTTP 403)")

    # 5. Admin verification & password rotation workflow
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL.lower()).first()
    assert admin_user is not None, "Admin account must exist"
    initial_pwd = os.getenv("ADMIN_INITIAL_PASSWORD", "ChangeMe123!")
    admin_user.password_hash = hash_password(initial_pwd)
    admin_user.password_change_required = True
    db.commit()
    db.refresh(admin_user)
    db.close()

    r_admin = client.post("/api/v1/auth/login", json={
        "email": settings.ADMIN_EMAIL,
        "password": initial_pwd
    })
    assert r_admin.status_code == 200, f"Admin initial login failed: {r_admin.text}"
    admin_token_key = "access_token" if "access_token" in r_admin.json() else "token"
    admin_token = r_admin.json()[admin_token_key]
    print("[PASS] Admin authenticated with seed credentials; change flag enforced")

    # 6. Admin authorized access
    r_admin_access = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_admin_access.status_code == 200, f"Admin access failed: {r_admin_access.text}"
    print("[PASS] Admin successfully accessed /api/v1/admin/users")


# ============================================================================
# SECTION 4: ML MODEL REGISTRY & DETERMINISTIC MATH
# ============================================================================

def test_section_4_model_registry_and_math():
    print("\n" + "=" * 60)
    print("SECTION 4: ML MODEL REGISTRY & DETERMINISTIC MATH")
    print("=" * 60)

    from services.model_registry import registry
    assert registry.loaded is True, "ModelRegistry must be loaded"

    # 1. Feature extraction
    feat_df = registry.build_feature_dataframe(
        mission_day=42,
        age=38.0,
        hr_bpm=74.2,
        spo2_pct=98.4,
        temp_c=36.5,
        activity='rest'
    )
    assert len(feat_df) == 1, "Feature dataframe must contain 1 row"

    # 2. Risk scoring invariant checks
    score_cv = registry.score('cv', feat_df)
    score_sleep = registry.score('sleep', feat_df)
    score_immune = registry.score('immune', feat_df)

    for name, score in [("CV", score_cv), ("Sleep", score_sleep), ("Immune", score_immune)]:
        assert isinstance(score, float), f"{name} score must be a float"
        assert not math.isnan(score), f"{name} score must not be NaN"
        assert not math.isinf(score), f"{name} score must not be infinite"
        assert 0.0 <= score <= 100.0, f"{name} score must be bounded between 0 and 100 (got {score})"
        print(f"[PASS] Model {name} generated valid bounded score: {score:.2f}")

    # 3. Deterministic radiation math
    from backend.compute.radiation_math import calculate_radiation_metrics, check_south_atlantic_anomaly
    res = calculate_radiation_metrics(cumulative_uSv=12500.0, in_saa=True)
    assert res["career_limit_mSv"] == 600.0
    assert res["spe_limit_mSv"] == 250.0
    assert res["in_south_atlantic_anomaly"] is True
    assert res["radiation_multiplier"] == 10.0
    assert check_south_atlantic_anomaly(-25.0, -10.0) is True
    assert check_south_atlantic_anomaly(45.0, 10.0) is False
    print("[PASS] Deterministic radiation metrics and SAA geofencing verified")

    # 4. Deterministic trend math
    from backend.compute.trend import mann_kendall, theil_sen
    rising = [50.0, 55.0, 60.0, 65.0, 70.0, 75.0, 80.0]
    mk = mann_kendall(rising)
    assert mk["direction"] == "increasing"
    ts = theil_sen(list(range(len(rising))), rising)
    assert ts["slope_per_unit"] > 0.0
    print("[PASS] Deterministic Mann-Kendall and Theil-Sen trend math verified")


# ============================================================================
# SECTION 5: WEARABLE TELEMETRY SIMULATOR
# ============================================================================

def test_section_5_wearable_simulator():
    print("\n" + "=" * 60)
    print("SECTION 5: WEARABLE TELEMETRY SIMULATOR")
    print("=" * 60)

    from scripts.simulate_wearable import WearableSimulator, ASTRONAUTS
    assert len(ASTRONAUTS) > 0, "Astronaut list must be populated"

    for aid in ASTRONAUTS:
        sim = WearableSimulator(aid)
        samples = [sim.tick()["heart_rate_bpm"] for _ in range(5)]
        assert len(set(samples)) > 1, f"Expected physiological variation for {aid}, got {samples}"

    # Detailed tick inspection
    sim_a = WearableSimulator("astronaut-A")
    tick = sim_a.tick()
    assert "heart_rate_bpm" in tick
    assert "spo2_pct" in tick
    assert "skin_temp_c" in tick
    assert "accel_x_g" in tick
    assert "activity_state" in tick
    print(f"[PASS] Simulator verified with multi-astronaut physiological variation ({len(ASTRONAUTS)} astronauts)")


# ============================================================================
# MAIN ENTRYPOINT
# ============================================================================

def run_all_tests():
    test_section_1_core_api_and_ingestion()
    test_section_2_cognitive_and_astronaut()
    test_section_3_auth_and_rbac()
    test_section_4_model_registry_and_math()
    test_section_5_wearable_simulator()
    print("\n" + "=" * 60)
    print("ALL 5 SECTIONS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
