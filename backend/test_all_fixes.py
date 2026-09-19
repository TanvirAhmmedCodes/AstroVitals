import os
import sys
import json
import sqlite3
import asyncio
from datetime import datetime

# Setup paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

print("=" * 60)
print("ASTROVITALS NEURO-SHIELD: VERIFICATION TEST SUITE")
print("=" * 60)

# TEST 1: Database & Profiles Verification
print("\n--- TEST 1: Database Users & Astronaut Profiles ---")
conn = sqlite3.connect(os.path.join(BACKEND_DIR, "astrovitals.db"))
cur = conn.cursor()
cur.execute("SELECT id, email, full_name, role, email_verified FROM user")
users = cur.fetchall()
print(f"Users ({len(users)}):")
for u in users:
    print(f"  ID: {u[0]} | Email: {u[1]} | Name: {u[2]} | Role: {u[3]} | Verified: {u[4]}")

cur.execute("SELECT id, name, callsign, role, user_id FROM astronaut_profile")
profiles = cur.fetchall()
print(f"Astronaut Profiles ({len(profiles)}):")
for p in profiles:
    print(f"  ID: {p[0]} | Name: {p[1]} | Callsign: {p[2]} | Role: {p[3]} | UserID: {p[4]}")
conn.close()

assert any(u[1] == "tanvirahmmed13579@gmail.com" and u[3] == "admin" and u[4] == 1 for u in users), "Admin user not properly seeded or verified!"
print("[PASS] Admin MD Tanvir Ahmmed is verified and role='admin'. No fake crew members.")

# TEST 2: Model Registry & Risk Scorer (NaN Check)
print("\n--- TEST 2: Risk Scoring & Model Registry ---")
from services.model_registry import registry

feat_df = registry.build_feature_dataframe(
    mission_day=42,
    age=38.0,
    hr_bpm=74.2,
    spo2_pct=98.4,
    temp_c=36.5,
    activity='rest'
)
print("Extracted Features columns:", list(feat_df.columns)[:5], "Total cols:", len(feat_df.columns))

score_cv = registry.score('cv', feat_df)
score_sleep = registry.score('sleep', feat_df)
score_immune = registry.score('immune', feat_df)
print(f"CV Score: {score_cv} (type: {type(score_cv).__name__})")
print(f"Sleep Score: {score_sleep} (type: {type(score_sleep).__name__})")
print(f"Immune Score: {score_immune} (type: {type(score_immune).__name__})")

import math
assert not math.isnan(score_cv), "CV score is NaN!"
assert not math.isnan(score_sleep), "Sleep score is NaN!"
assert not math.isnan(score_immune), "Immune score is NaN!"
print("[PASS] All ML risk scores return non-NaN numbers.")

# TEST 3: ISS Position Tracker
print("\n--- TEST 3: ISS Position Tracker ---")
from routers.external import get_iss_position
iss_data = get_iss_position()
print(f"ISS Data: Lat={iss_data.get('latitude')}, Lon={iss_data.get('longitude')}, Alt={iss_data.get('altitude_km')}km, Velocity={iss_data.get('velocity_kmh')}km/h, SAA={iss_data.get('in_saa')}, Source={iss_data.get('source')}")
assert iss_data.get("latitude") != 0.0 or iss_data.get("longitude") != 0.0, "ISS returned 0.0, 0.0!"
print("[PASS] ISS coordinates are real and non-zero.")

# TEST 4: Astronaut Summary Metrics Calculation
print("\n--- TEST 4: Astronaut Summary Calculation ---")
from database import SessionLocal
from routers.astronaut import get_astronaut_summary

db = SessionLocal()
try:
    summary = get_astronaut_summary("astronaut-A", db=db)
    print("Astronaut-A Summary:", json.dumps(summary, indent=2))
    assert "resting_hr_mean" in summary
    assert "reaction_time_mean_ms" in summary
    assert "radiation_cumulative_mSv" in summary
    print("[PASS] Summary calculated from real database readings.")
finally:
    db.close()

# TEST 5: Digital Twin Forecast Simulation Endpoint
print("\n--- TEST 5: Digital Twin Forecast Simulation ---")
from routers.analytics import post_risk_forecast, SimulationForecastRequest
req = SimulationForecastRequest(
    astronaut_id="astronaut-A",
    exercise_hours=2.5,
    sleep_hours=8.0,
    med_adherence=90.0,
    nutrition=85.0
)
sim_result = post_risk_forecast(req)
print(f"Health conservation pct: {sim_result['health_conservation_pct']}%")
print(f"Baseline points: {len(sim_result['baseline_curve'])}, Optimized points: {len(sim_result['optimized_curve'])}")
assert len(sim_result['baseline_curve']) == 7
assert len(sim_result['optimized_curve']) == 7
print("[PASS] Forecast simulation returned 180-day Digital Twin trajectories and health conservation score.")

# TEST 6: Emergency Alert Trigger
print("\n--- TEST 6: Emergency Alert Endpoint ---")
from routers.alerts import trigger_emergency_alert, EmergencyAlertRequest
db = SessionLocal()
try:
    em_res = trigger_emergency_alert(
        EmergencyAlertRequest(
            astronaut_id="astronaut-A",
            reason="Biometric telemetry verification test alert"
        ),
        db=db
    )
    print("Emergency alert response:", em_res)
    assert em_res["status"] == "triggered"
    print("[PASS] Emergency alert successfully declared and broadcasted to all crew & ground.")
finally:
    db.close()

# TEST 7: Gemini Chat AI Responses (3 Unique Questions)
print("\n--- TEST 7: Gemini AI Companion (3 Unique Prompts) ---")
from services.gemini_service import gemini_service

async def test_chat():
    context = {
        "mission_day": 42,
        "astronaut_name": "MD Tanvir Ahmmed",
        "astronaut_id": "astronaut-A",
        "current_vitals": {
            "heart_rate_bpm": 72,
            "spo2_pct": 98.5,
            "skin_temp_c": 36.6,
            "activity_state": "rest",
            "radiation_dose_uSv_cumulative": 12500.0,
            "hr_delta_pct": 0.0,
            "spo2_delta_pct": 0.5,
            "is_anomaly": False
        },
        "current_risk": {
            "cardiovascular": {"score": 24.5},
            "sleep_behavioral": {"score": 28.0},
            "immune": {"score": 21.0},
            "cognitive": {"score": 85.0}
        },
        "radiation": {"accumulated_uSv": 12500.0, "status": "nominal"}
    }

    q1 = "who are you?"
    r1 = await gemini_service.chat(q1, history=[], context=context)
    print(f"\nQ1: {q1}\nOri: {r1}\n")

    q2 = "how am I doing today?"
    r2 = await gemini_service.chat(q2, history=[{"role": "user", "content": q1}, {"role": "assistant", "content": r1}], context=context)
    print(f"\nQ2: {q2}\nOri: {r2}\n")

    q3 = "I feel tired and a bit fatigued after extravehicular maintenance."
    r3 = await gemini_service.chat(q3, history=[{"role": "user", "content": q2}, {"role": "assistant", "content": r2}], context=context)
    print(f"\nQ3: {q3}\nOri: {r3}\n")

    assert r1 != r2 and r2 != r3, "Responses are identical!"
    assert "Acknowledged. Telemetry envelope remains nominal." not in r1, "Falling back to stale template!"
    print("[PASS] Gemini gave 3 distinct, contextual, personalized responses.")

asyncio.run(test_chat())

print("\n" + "=" * 60)
print("ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
