"""Phase 2 Backend Advanced Verification Test Suite."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timezone
from fastapi.testclient import TestClient

from backend.main import app
from backend.database import init_db

init_db()
client = TestClient(app)


def test_cognitive():
    print("\n--- Testing Cognitive Router ---")
    # 1. Norms
    r_norms = client.get("/api/v1/cognitive/norms")
    assert r_norms.status_code == 200
    norms_data = r_norms.json()
    assert "reaction_time_ms_mean" in norms_data
    print("[PASS] GET /api/v1/cognitive/norms:", norms_data)

    # 2. Submit test
    payload = {
        "astronaut_id": "astronaut-A",
        "reaction_times_ms": [280.0, 295.0, 310.0, 285.0, 290.0],
        "mood_score": 8.0,
        "alertness_score": 7.0,
        "stress_score": 3.0,
    }
    r_test = client.post("/api/v1/cognitive/test", json=payload)
    assert r_test.status_code == 200
    test_data = r_test.json()
    assert test_data["astronaut_id"] == "astronaut-A"
    assert test_data["reaction_time_mean"] == 292.0
    assert test_data["cognitive_resilience_score"] > 50.0
    assert test_data["status"] == "nominal"
    assert test_data["delta_vs_cognispace_pct"] > 0
    print("[PASS] POST /api/v1/cognitive/test:", {
        "mean_ms": test_data["reaction_time_mean"],
        "resilience_score": test_data["cognitive_resilience_score"],
        "delta_vs_norm": f"{test_data['delta_vs_cognispace_pct']}%",
        "status": test_data["status"],
    })

    # 3. History
    r_hist = client.get("/api/v1/cognitive/history?astronaut_id=astronaut-A")
    assert r_hist.status_code == 200
    hist_data = r_hist.json()
    assert hist_data["total_records"] >= 1
    print(f"[PASS] GET /api/v1/cognitive/history: {hist_data['total_records']} records")


def test_astronaut():
    print("\n--- Testing Astronaut Router ---")
    # 1. List crew members
    r_list = client.get("/api/v1/astronaut/list")
    assert r_list.status_code == 200
    list_data = r_list.json()
    assert list_data["total_crew"] >= 4
    print(f"[PASS] GET /api/v1/astronaut/list: {list_data['total_crew']} astronauts returned")
    for crew in list_data["crew"]:
        print(f"  - {crew['callsign']} {crew['name']} | Day {crew['mission_day']} | Health: {crew['health_score']}% | Status: {crew['status']}")

    # 2. Get specific astronaut
    r_single = client.get("/api/v1/astronaut/astronaut-A")
    assert r_single.status_code == 200
    single_data = r_single.json()
    assert "name" in single_data and len(single_data["name"]) > 0
    print("[PASS] GET /api/v1/astronaut/astronaut-A:", single_data["name"], single_data["role"])

    # 3. PDF Dossier Report Generation
    r_pdf = client.get("/api/v1/astronaut/astronaut-A/report")
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    pdf_content = r_pdf.content
    assert pdf_content[:4] == b"%PDF"
    assert len(pdf_content) > 3000
    print(f"[PASS] GET /api/v1/astronaut/astronaut-A/report: PDF generated successfully ({len(pdf_content)} bytes, header={pdf_content[:8]})")


def test_chat():
    print("\n--- Testing AI Chat Companion Router ---")
    # 1. Suggestions
    r_sugg = client.get("/api/v1/chat/suggestions")
    assert r_sugg.status_code == 200
    sugg_data = r_sugg.json()
    assert len(sugg_data["suggestions"]) >= 4
    print(f"[PASS] GET /api/v1/chat/suggestions: {len(sugg_data['suggestions'])} suggestions returned")

    # 2. Live Chat Message with Gemini
    chat_payload = {
        "astronaut_id": "astronaut-A",
        "session_id": "test-session-phase2",
        "message": "Good morning. How are my vitals today and should I do the resistance band exercise?",
    }
    r_chat = client.post("/api/v1/chat/message", json=chat_payload)
    assert r_chat.status_code == 200
    chat_data = r_chat.json()
    assert chat_data["role"] == "assistant"
    assert len(chat_data["content"]) > 10
    assert chat_data["vitals_snapshot"] is not None
    print(f"[PASS] POST /api/v1/chat/message (Active Model={chat_data['active_model']}):")
    print(f"  Response Preview: {chat_data['content'][:140]}...")

    # 3. Chat Session History
    r_hist = client.get("/api/v1/chat/history?astronaut_id=astronaut-A&session_id=test-session-phase2")
    assert r_hist.status_code == 200
    hist_data = r_hist.json()
    assert hist_data["total_messages"] >= 2  # user + assistant
    print(f"[PASS] GET /api/v1/chat/history: {hist_data['total_messages']} messages stored in SQLite")


def test_alerts():
    print("\n--- Testing Alerts Router ---")
    # 1. Subscribe
    sub_payload = {"astronaut_id": "astronaut-A", "channel": "push"}
    r_sub = client.post("/api/v1/alerts/subscribe", json=sub_payload)
    assert r_sub.status_code == 200
    print("[PASS] POST /api/v1/alerts/subscribe:", r_sub.json())

    # 2. History
    r_hist = client.get("/api/v1/alerts/history?astronaut_id=astronaut-A")
    assert r_hist.status_code == 200
    hist_data = r_hist.json()
    print(f"[PASS] GET /api/v1/alerts/history: {hist_data['total_alerts']} alerts on record")

    # 3. Acknowledge alert if exists
    if hist_data["alerts"]:
        first_id = hist_data["alerts"][0]["id"]
        r_ack = client.post(f"/api/v1/alerts/{first_id}/acknowledge")
        assert r_ack.status_code == 200
        print(f"[PASS] POST /api/v1/alerts/{first_id}/acknowledge: alert acknowledged")


def test_analytics():
    print("\n--- Testing Analytics & Forecast Router ---")
    r_fc = client.get("/api/v1/analytics/forecast?astronaut_id=astronaut-A&days=7")
    assert r_fc.status_code == 200
    fc_data = r_fc.json()
    assert fc_data["forecast_window_days"] == 7
    assert len(fc_data["daily_forecast"]) == 7
    first_day = fc_data["daily_forecast"][0]
    last_day = fc_data["daily_forecast"][-1]
    print(f"[PASS] GET /api/v1/analytics/forecast: Trajectory '{fc_data['trajectory']}'")
    print(f"  Day +1 ({first_day['date']}): Risk={first_day['composite_risk']}, With Intervention={first_day['with_intervention_risk']}")
    print(f"  Day +7 ({last_day['date']}): Risk={last_day['composite_risk']}, With Intervention={last_day['with_intervention_risk']}")


def test_external():
    print("\n--- Testing External APIs Router ---")
    # 1. ISS Position & SAA
    r_iss = client.get("/api/v1/external/iss")
    assert r_iss.status_code == 200
    iss_data = r_iss.json()
    assert "position" in iss_data
    assert "south_atlantic_anomaly" in iss_data
    print("[PASS] GET /api/v1/external/iss:", {
        "lat": iss_data["position"]["latitude"],
        "lon": iss_data["position"]["longitude"],
        "in_saa": iss_data["south_atlantic_anomaly"]["in_region"],
        "multiplier": iss_data["south_atlantic_anomaly"]["radiation_multiplier"],
    })

    # 2. Next Launch
    r_next = client.get("/api/v1/external/launches/next")
    assert r_next.status_code == 200
    next_data = r_next.json()
    assert "launch" in next_data
    print("[PASS] GET /api/v1/external/launches/next:", next_data["launch"].get("name", "N/A"))

    # 3. Recent Launches
    r_recent = client.get("/api/v1/external/launches/recent?limit=3")
    assert r_recent.status_code == 200
    rec_data = r_recent.json()
    assert "launches" in rec_data
    print(f"[PASS] GET /api/v1/external/launches/recent: {rec_data['count']} launches returned")

    # 4. NASA APOD
    r_apod = client.get("/api/v1/external/apod")
    assert r_apod.status_code == 200
    apod_data = r_apod.json()
    assert "apod" in apod_data
    print("[PASS] GET /api/v1/external/apod:", apod_data["apod"].get("title", "N/A")[:50])


if __name__ == "__main__":
    print("==================================================")
    print("  ASTROVITALS PHASE 2 ADVANCED TEST SUITE")
    print("==================================================")
    test_cognitive()
    test_astronaut()
    test_chat()
    test_alerts()
    test_analytics()
    test_external()
    print("\n==================================================")
    print("  ALL PHASE 2 ADVANCED BACKEND TESTS PASSED!")
    print("==================================================")
