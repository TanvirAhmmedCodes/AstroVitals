import sys
import os
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("./backend"))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_full_auth_and_admin_flow():
    print("--- 1. TESTING HEALTH & PUBLIC ROUTES ---")
    r_health = client.get("/api/v1/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.text}"
    print("[PASS] GET /api/v1/health ->", r_health.json()["status"])

    print("\n--- 2. TESTING OBSERVER REGISTRATION ---")
    observer_payload = {
        "email": "flight_surgeon_test@orbitrix.space",
        "password": "Password123!",
        "full_name": "Dr. Sarah Mitchell"
    }
    r_reg = client.post("/api/v1/auth/register", json=observer_payload)
    if r_reg.status_code == 400 and "already registered" in r_reg.text:
        print("[INFO] Observer user already registered. Proceeding to login.")
    else:
        assert r_reg.status_code in (200, 201), f"Register failed: {r_reg.text}"
        data = r_reg.json()
        assert data["user"]["role"] == "observer", f"Expected observer role, got {data['user']['role']}"
        assert data["user"]["full_name"] == "Dr. Sarah Mitchell"
        print("[PASS] Registered Dr. Sarah Mitchell with role:", data["user"]["role"])

    print("\n--- 3. TESTING OBSERVER LOGIN ---")
    r_login = client.post("/api/v1/auth/login", json={
        "email": "flight_surgeon_test@orbitrix.space",
        "password": "Password123!"
    })
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    observer_token = r_login.json()["access_token"]
    print("[PASS] Login successful, received JWT token")

    print("\n--- 4. TESTING GET /auth/me WITH OBSERVER TOKEN ---")
    r_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {observer_token}"})
    assert r_me.status_code == 200, f"Me failed: {r_me.text}"
    user_obj = r_me.json().get("user", r_me.json())
    assert user_obj["email"] == "flight_surgeon_test@orbitrix.space"
    assert user_obj["role"] == "observer"
    print("[PASS] GET /api/v1/auth/me ->", user_obj["full_name"], f"({user_obj['role']})")

    print("\n--- 5. TESTING ADMIN PRIVILEGE ENFORCEMENT (403 FOR OBSERVER) ---")
    r_admin_users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {observer_token}"})
    assert r_admin_users.status_code == 403, f"Expected 403 Forbidden, got {r_admin_users.status_code}"
    print("[PASS] Observer correctly denied access to /api/v1/admin/users (HTTP 403)")

    print("\n--- 6. TESTING ADMIN LOGIN (MD Tanvir Ahmmed) ---")
    admin_pwd = os.getenv("ADMIN_INITIAL_PASSWORD", "ChangeMe123!")
    r_admin_login = client.post("/api/v1/auth/login", json={
        "email": "tanvirahmmed13579@gmail.com",
        "password": admin_pwd
    })
    assert r_admin_login.status_code == 200, f"Admin login failed: {r_admin_login.text}"
    admin_token = r_admin_login.json()["access_token"]
    assert r_admin_login.json()["user"]["role"] == "admin"
    print("[PASS] Admin login successful for tanvirahmmed13579@gmail.com (role: admin)")

    print("\n--- 7. TESTING ADMIN ACCESS TO ADMIN METRICS & USERS ---")
    r_users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_users.status_code == 200, f"Admin users failed: {r_users.text}"
    users_data = r_users.json()
    print(f"[PASS] Admin fetched users list: {users_data['total']} registered users")
    user_items = users_data.get("users", users_data.get("items", []))
    for u in user_items:
        print(f"  - {u['full_name']} <{u['email']}> | Role: {u['role']} | IP: {u.get('ip_last_login')}")
        # Verify privacy: no password, no chat content
        assert "password" not in u
        assert "password_hash" not in u

    r_metrics = client.get("/api/v1/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_metrics.status_code == 200, f"Admin metrics failed: {r_metrics.text}"
    metrics = r_metrics.json()
    print(f"[PASS] Admin metrics: Total Users={metrics['total_users']}, Active Now={metrics['active_now']}, DB Size={metrics['database_size_mb']} MB")

    print("\n--- 8. TESTING REAL ASTRONAUT BERTHS & DEMO PURGE ---")
    r_crew = client.get("/api/v1/astronaut/")
    assert r_crew.status_code == 200
    crew_list = r_crew.json()["crew"]
    print(f"[PASS] Active crew slots occupied: {len(crew_list)}")
    for c in crew_list:
        print(f"  - [{c['id']}] {c['name']} ({c['role']}) | Status: {c['status']}")
        # Confirm no fake names
        assert c["name"] not in ["Alex Chen", "Maya Patel", "Yuki Tanaka", "Marcus Vance"]

    print("\n--- 9. TESTING FORGOT PASSWORD FLOW ---")
    r_forgot = client.post("/api/v1/auth/forgot-password", json={"email": "flight_surgeon_test@orbitrix.space"})
    assert r_forgot.status_code == 200
    print("[PASS] POST /api/v1/auth/forgot-password succeeded:", r_forgot.json()["message"])

    print("\n========================================================")
    print("ALL PHASE 5 BACKEND TESTS PASSED CLEANLY & SECURELY!")
    print("========================================================")

if __name__ == "__main__":
    test_full_auth_and_admin_flow()
