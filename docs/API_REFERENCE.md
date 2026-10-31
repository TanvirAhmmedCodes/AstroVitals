# AstroVitals API Gateway Reference

REST Endpoints, Server-Sent Events (SSE), and Payload Specifications.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. Overview & Base URLs

The AstroVitals backend is built with FastAPI and runs on Render in production:
- **Production Gateway**: `https://astrovitals.onrender.com`
- **Interactive Documentation (Swagger UI)**: `https://astrovitals.onrender.com/docs`
- **Local Development URL**: `http://localhost:8080` (or `http://192.168.0.105:8080` on LAN)
- **API Version**: `v1` (Root prefix: `/api/v1`)

---

## 2. Ingestion & Device Hardware Endpoints

### 2.1 Ingest Telemetry Batch
- **Method**: `POST`
- **Path**: `/api/v1/ingest/vitals`
- **Rate Limit**: 1000 requests / hour per IP
- **Description**: Ingests wearable sensor telemetry, evaluates edge anomaly envelopes, saves to SQLite, broadcasts via SSE, and queues Firestore cloud synchronization.

#### Request Headers:
```http
Content-Type: application/json
X-Device-Id: esp32-orbital-hub-01
```

#### Request Payload:
```json
{
  "device_id": "esp32-orbital-hub-01",
  "astronaut_id": "astronaut-A",
  "wifi_ssid": "Anonymous",
  "firmware_version": "2.1.0-universal-wifi",
  "is_hardware": false,
  "sensors": {
    "max30102": false,
    "mlx90614": false,
    "mpu6050": false,
    "ssd1306": false
  },
  "readings": [
    {
      "timestamp_utc": "2026-10-31T15:20:00Z",
      "heart_rate_bpm": 72.4,
      "spo2_pct": 98.2,
      "skin_temp_c": 36.52,
      "accel_x_g": 0.02,
      "accel_y_g": 0.03,
      "accel_z_g": 0.98,
      "activity_state": "rest",
      "radiation_dose_uSv_cumulative": 12500.0,
      "battery_pct": 98.0,
      "wifi_rssi": -56.0,
      "buffered": false,
      "is_hardware_reading": false,
      "sensors": {
        "max30102": false,
        "mlx90614": false,
        "mpu6050": false,
        "ssd1306": false
      }
    }
  ]
}
```

#### Response (200 OK):
```json
{
  "status": "success",
  "inserted_count": 1,
  "anomaly_detected": false,
  "latest_heart_rate": 72.4,
  "latest_spo2": 98.2,
  "latest_radiation_uSv": 12500.0,
  "advisory_alert": null,
  "timestamp": "2026-10-31T15:20:01.120Z"
}
```

---

### 2.2 Retrieve Device Status & Watchdog
- **Method**: `GET`
- **Path**: `/api/v1/devices/{device_id}/status`
- **Description**: Returns real-time connectivity status, Wi-Fi parameters, battery level, and per-sensor detection state. Computes a dynamic 25-second heartbeat freshness watchdog.

#### Response (200 OK):
```json
{
  "device_id": "astronaut-A",
  "status": "online",
  "is_connected": true,
  "last_seen": "2026-10-31T15:20:00Z",
  "battery_pct": 98.0,
  "wifi_rssi": -56.0,
  "wifi_ssid": "Anonymous",
  "firmware_version": "2.1.0-universal-wifi",
  "sensors": {
    "max30102": false,
    "mlx90614": false,
    "mpu6050": false,
    "ssd1306": false
  },
  "is_hardware_reading": false
}
```

---

### 2.3 Dispatch Ground Advisory Alert Command
- **Method**: `POST`
- **Path**: `/api/v1/devices/alert`
- **Description**: Dispatches an advisory tactile haptic and visual alert command to an astronaut wearable device.

#### Request Payload:
```json
{
  "device_id": "esp32-orbital-hub-01",
  "alert_level": "warning",
  "haptic_pattern": "5-pulse",
  "display_message": "MISSION CONTROL TEST ALERT"
}
```

#### Response (200 OK):
```json
{
  "status": "dispatched",
  "device_id": "esp32-orbital-hub-01",
  "alert_level": "warning",
  "haptic_pattern": "5-pulse",
  "display_message": "MISSION CONTROL TEST ALERT",
  "timestamp_utc": "2026-10-31T15:21:00Z"
}
```

---

## 3. Vitals & Telemetry Stream Endpoints

### 3.1 Get Latest Vitals & Baseline Deltas
- **Method**: `GET`
- **Path**: `/api/v1/vitals/latest?astronaut_id=astronaut-A`
- **Description**: Returns the latest physiological reading, comparison deltas against NASA-STD-3001 baselines, and scientific provenance metadata.

### 3.2 Real-Time Server-Sent Events (SSE) Stream
- **Method**: `GET`
- **Path**: `/api/v1/vitals/stream?astronaut_id=astronaut-A`
- **Description**: Sub-second reactive event stream delivering continuous biometric updates to connected browser clients.

---

## 4. Clinical Risk & Radiation Endpoints

### 4.1 Current Multimodal Risk Assessment
- **Method**: `GET`
- **Path**: `/api/v1/risk/current?astronaut_id=astronaut-A`
- **Description**: Evaluates cardiovascular, sleep, immune, cognitive, and radiation risk scores using regularized machine learning and deterministic rules.

### 4.2 Cumulative Radiation Status
- **Method**: `GET`
- **Path**: `/api/v1/radiation/status?astronaut_id=astronaut-A`
- **Description**: Evaluates career effective dose (600 mSv limit), Solar Particle Event (SPE) threshold (250 mSv), and South Atlantic Anomaly (SAA) transit alerts.
