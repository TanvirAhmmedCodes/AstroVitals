# AstroVitals Firebase Cloud Architecture & Setup

Real-Time Telemetry Synchronization, Firestore Schema, and Security Rules.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. Firebase Project Identification

All cloud operations in AstroVitals utilize the designated production project:
- **Project Name**: `AstroVitals`
- **Project ID**: `astrovitals`
- **Project Number**: `1049915567750`
- **Firestore Database**: `(default)` in Native Mode
- **Database Location**: `asia-south1` (Mumbai)
- **Primary Astronaut Device Document**: `devices/astronaut-A`

---

## 2. Cloud Firestore Schema Definition

AstroVitals structures telemetry and mission states across four normalized collections:

```
firestore/
├── devices/{deviceId}
│   ├── device_id: string (e.g. "astronaut-A" or "esp32-orbital-hub-01")
│   ├── owner_astronaut_id: string ("astronaut-A")
│   ├── status: string ("online" | "offline" | "standby")
│   ├── last_seen: string (ISO8601 UTC timestamp)
│   ├── wifi_ssid: string ("Anonymous")
│   ├── wifi_rssi: number (-56.0)
│   ├── battery_pct: number (98.0)
│   ├── firmware_version: string ("2.1.0-universal-wifi")
│   ├── ip_address: string ("192.168.0.105")
│   ├── is_hardware_reading: boolean (true | false)
│   ├── sensors: map
│   │   ├── max30102: boolean
│   │   ├── mlx90614: boolean
│   │   ├── mpu6050: boolean
│   │   └── ssd1306: boolean
│   ├── pending_alert: map (optional ground command alert)
│   └── readings/{readingId} [Subcollection: Rolling Telemetry Stream]
│       ├── timestamp: string (ISO8601 UTC timestamp)
│       ├── heart_rate_bpm: number (e.g. 72.4)
│       ├── spo2_pct: number (e.g. 98.2)
│       ├── skin_temp_c: number (e.g. 36.5)
│       ├── accel_x_g: number (0.02)
│       ├── accel_y_g: number (0.03)
│       ├── accel_z_g: number (0.98)
│       ├── activity_state: string ("rest" | "active" | "exercise")
│       ├── radiation_dose_uSv_cumulative: number (12500)
│       └── buffered: boolean (false)
│
├── users/{userId}
│   ├── id: string (User UUID)
│   ├── email: string
│   ├── full_name: string
│   ├── role: string ("admin" | "astronaut" | "flight_surgeon" | "observer")
│   └── created_at: string
│
└── mission/current
    ├── crew: array of crew profiles
    └── updated_at: string
```

---

## 3. Web SDK Configuration & Reactive Listeners

### 3.1 Web SDK Initialization (`frontend/src/lib/firebase.js`)
Configured using environment variables in `frontend/.env`:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "astrovitals",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

### 3.2 Real-Time Reactive Hooks (`frontend/src/hooks/useFirestore.js`)
The frontend subscribes to real-time changes using Firestore `onSnapshot` listeners:
- `useDeviceStatus(astronautId)`: Subscribes directly to `devices/{astronautId}` for instant battery, Wi-Fi RSSI, sensor availability, and pending ground alerts.
- `useDeviceReadings(astronautId, limitCount)`: Subscribes to the subcollection `devices/{astronautId}/readings` ordered by timestamp descending.
- `useMissionCrew()`: Subscribes to `mission/current` for synchronized fleet roster updates.

---

## 4. Backend Admin SDK Synchronization

The FastAPI gateway (`backend/services/firebase_service.py`) synchronizes incoming telemetry to Cloud Firestore asynchronously:
- In local development, the service automatically extracts tokens from `firebase-tools` CLI credentials.
- In production, it loads credentials from `FIREBASE_SERVICE_ACCOUNT_JSON` or a local service account key file.
- If credentials are absent or network is down, the service falls back gracefully without dropping packets or stalling the FastAPI worker thread.

---

## 5. Production Security Rules (`firestore.rules`)

AstroVitals enforces a least-privilege, defense-in-depth security model:
1. **Default Deny**: All unspecified documents reject read and write attempts.
2. **Device Hardware Documents**: Only assigned crew members and flight surgeons can read wearable status. Ground mission controllers can write advisory alert payloads.
3. **Telemetry Subcollections**: Strictly append-only. Telemetry documents can never be altered or deleted once recorded, preserving forensic audit integrity.
4. **Users Collection**: Users may only read and modify their own profile. Privilege escalation to `admin` is prevented at the rule level.

