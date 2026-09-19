# AstroVitals Neuro-Shield — Firebase Real-Time Architecture

> **Dual-Layer Architecture**: Robust SQLite persistence and JWT security paired with Google Cloud Firestore for sub-second reactive synchronization and hardware telemetry dispatch.

---

## 1. System Philosophy & Coexistence Model

AstroVitals utilizes Firebase strictly as a **real-time synchronization layer**, not a monolithic backend replacement. The system maintains an offline-first, high-reliability operational profile suitable for deep space missions:

```
                  ┌──────────────────────────────────────────────────────────┐
                  │                   ASTRONAUT & GROUND CREW                │
                  └────────────┬─────────────────────────────▲───────────────┘
                               │ (1) User Actions            │ (6) Real-Time
                               │     JWT Authenticated       │     Reactive Sync
                               ▼                             │
               ┌───────────────────────────────┐             │
               │   AstroVitals FastAPI Server  │             │
               │  (Port 8080 / Render Cloud)   │             │
               └───────┬───────────────┬───────┘             │
                       │               │                     │
      (2) Persistent   │               │ (4) Background Task │
          ACID Storage │               │     Async Enqueue   │
                       ▼               ▼                     │
               ┌──────────────┐ ┌──────────────────────┐     │
               │ SQLite / DB  │ │ Firebase Admin SDK   │     │
               │ (Primary)    │ │ (Service Account)    │     │
               └──────────────┘ └──────────┬───────────┘     │
                                           │                 │
                                           │ (5) Set / Add   │
                                           ▼                 │
                              ┌────────────────────────┐     │
                              │ Cloud Firestore        ├─────┘
                              │ (asia-southeast1)      │
                              │ Project: astrovitals   │
                              └───────────▲────────────┘
                                          │
                                          │ (Future Telemetry)
                                          │ 1-Year Device Token
                                          │
                              ┌───────────┴────────────┐
                              │ ESP32 Biometric Unit   │
                              │ MAX30102 / MPU6050     │
                              └────────────────────────┘
```

### Separation of Responsibilities

| Subsystem | Primary Role | Implementation |
|:---|:---|:---|
| **User Authentication** | Identity, Role-Based Access Control, Session lifecycle | JWT Tokens (`auth_service.py`), Single Admin policy |
| **Data Persistence** | Time-series telemetry, user records, ML risk snapshots | SQLite Database (`database.py`) with SQLAlchemy ORM |
| **Real-Time Synchronization** | Sub-second multi-client dashboard updates, fleet coordination | Google Cloud Firestore (`asia-southeast1`) |
| **Embedded Hardware** | Wearable telemetry ingestion, future physical sensor pairing | ESP32 Wearable Device Registration (`devices.py`) |
| **Continuous Fallback** | Live streaming when Firestore is unavailable or offline | FastAPI Server-Sent Events (SSE) stream (`/vitals/stream`) |

---

## 2. End-to-End Data Flows

### A. User Registration & Fleet Enrollment
1. User submits credentials via `/api/v1/auth/register`.
2. FastAPI validates input, enforces Single Admin policy (`tanvirahmmed13579@gmail.com` as admin, all others as observer), hashes password, and creates both `User` and `AstronautProfile` records in SQLite.
3. A non-blocking `BackgroundTask` dispatches `sync_user_to_firestore()` and `sync_mission_crew()`.
4. The user profile is replicated to `users/{userId}` and crew roster to `mission/current` in Cloud Firestore without delaying the HTTP response.

### B. Wearable Telemetry Ingestion
1. Wearable hardware or telemetry simulator sends biometric packets to `POST /api/v1/ingest/vitals`.
2. Telemetry is committed to the local SQLite database.
3. Frozen ML models evaluate anomaly signatures and physiological safety thresholds.
4. Broadcast is sent over SSE (`sse_manager.broadcast()`).
5. A `BackgroundTask` invokes `sync_reading_to_firestore()`, updating device heartbeat in `devices/{astronaut_id}` and adding the reading to the `devices/{astronaut_id}/readings` subcollection.
6. All active browsers subscribed via `useDeviceReadings` render updated charts instantly.

### C. Future ESP32 Hardware Direct Channel
1. Physical device requests registration via `POST /api/v1/devices/register` with its unique hardware MAC/serial.
2. Server issues a dedicated 1-year cryptographic device JWT (`role: "device"`).
3. Device uses the token or Firebase Anonymous Authentication to publish readings directly to Firestore or via the FastAPI ingest gateway.

---

## 3. Firestore Schema Specification

```text
users/{userId}
├── id: string (UUID)
├── email: string
├── full_name: string
├── role: "admin" | "flight_surgeon" | "astronaut" | "observer"
├── created_at: ISO-8601 string
├── updated_at: ISO-8601 string
└── /profile/{docId}
    ├── avatar_url: string
    ├── bio: string
    ├── timezone: string
    └── language: string

devices/{deviceId}
├── device_id: string (e.g. "astronaut-A" or "ESP32-BIO-001")
├── owner_astronaut_id: string
├── owner_user_id: string
├── owner_astronaut_name: string
├── firmware_version: string
├── status: "online" | "offline" | "buffering"
├── last_seen: ISO-8601 string
├── battery_pct: number (0-100)
├── wifi_rssi: number (dBm)
└── /readings/{readingId}
    ├── timestamp: ISO-8601 string
    ├── heart_rate_bpm: number
    ├── spo2_pct: number
    ├── skin_temp_c: number
    ├── accel_x_g: number
    ├── accel_y_g: number
    ├── accel_z_g: number
    ├── activity_state: "rest" | "exercise" | "eva" | "sleep"
    ├── radiation_dose_uSv_cumulative: number
    └── buffered: boolean

mission/current
├── crew: [
│     {
│       astronaut_id: string,
│       full_name: string,
│       role: string,
│       callsign: string,
│       health_score: number
│     }
│   ]
└── updated_at: ISO-8601 string
```

---

## 4. Security Architecture

1. **Service Account Isolation**:
   - The backend `FIREBASE_SERVICE_ACCOUNT_JSON` provides privileged admin access.
   - It is stored solely as an environment variable on Render (or local `.env` which is strictly gitignored).
   - It is never committed, bundled, or exposed to the frontend.
2. **Public Client Scope**:
   - The frontend uses `VITE_FIREBASE_*` configuration variables.
   - These client IDs are safe for public web distribution as governed by Firebase Security Rules.
3. **No Firebase Storage**:
   - Firebase Storage is completely omitted (saving infrastructure costs and eliminating unauthorized blob uploads).
   - Profile images and documents are processed locally or via base64 data URIs.
4. **Resilient Fallback**:
   - If Firebase credentials are missing or Cloud Firestore is unreachable, backend and frontend continue uninterrupted via SQLite and Server-Sent Events (SSE).

---

## 5. ESP32 Hardware Integration Guide (For Physical Deployment)

When physical ESP32 and MAX30102 sensor boards arrive, follow this procedure:

### Hardware Setup
- **Microcontroller**: ESP32-WROOM-32
- **Biometric Sensor**: MAX30102 (I2C: SDA $\rightarrow$ GPIO 21, SCL $\rightarrow$ GPIO 22)
- **IMU Sensor**: MPU6050 (I2C)

### Device Onboarding
1. Send registration payload from Mission Control or CLI:
   ```bash
   curl -X POST https://your-backend.onrender.com/api/v1/devices/register \
     -H "Authorization: Bearer <ADMIN_OR_USER_JWT>" \
     -H "Content-Type: application/json" \
     -d '{
       "device_id": "ESP32-BIO-001",
       "device_name": "Flight Unit Alpha",
       "firmware_version": "1.0.0-esp32"
     }'
   ```
2. Save the returned `device_token` (valid for 365 days) into ESP32 Non-Volatile Storage (NVS).
3. The ESP32 flashes its telemetry directly to `POST /api/v1/ingest/vitals` with header:
   ```text
   Authorization: Bearer <device_token>
   ```

---

## 6. Implementation Status Matrix

| Capability | Status | Notes |
|:---|:---:|:---|
| **Firebase Admin SDK (Backend)** | ✅ Complete | Initialized via `FIREBASE_SERVICE_ACCOUNT_JSON` or local file |
| **Graceful Backend Fallback** | ✅ Complete | Automatically downgrades to local SQLite if Firebase is absent |
| **Real-time User Synchronization** | ✅ Complete | Async background task on registration |
| **Real-time Telemetry Ingestion** | ✅ Complete | Background task writes to `devices/{id}/readings` |
| **Mission Crew Live Sync** | ✅ Complete | Real-time `mission/current` document updates |
| **ESP32 Device Endpoints** | ✅ Complete | Register, pair, list, and unregister endpoints ready |
| **Frontend Firebase Web SDK** | ✅ Complete | Installed `firebase@12.19.0`, client in `lib/firebase.js` |
| **Real-time React Hooks** | ✅ Complete | `useDeviceReadings`, `useDeviceStatus`, `useMissionCrew` |
| **LiveVitals UI Enhancement** | ✅ Complete | "Live via Firestore" badge + SSE dual-stream fallback |
| **MissionControl UI Enhancement** | ✅ Complete | Dynamic crew sync indicator |
| **Physical ESP32 Board** | ⏳ Pending Hardware | Software architecture and device token endpoints are 100% prepared |

---

*Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026*
