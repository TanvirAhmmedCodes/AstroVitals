from datetime import datetime, timezone
import os
import urllib.request
from fastapi import APIRouter, Depends, HTTPException, Request, Response, BackgroundTasks
from sqlalchemy.orm import Session

try:
    from database import get_db, Telemetry, Alert, RiskSnapshot
    from schemas import TelemetryIngestRequest, TelemetryIngestResponse
    from services.model_registry import registry
    from services.sse_manager import sse_manager
    from services.radiation_model import RadiationModel
    from services.explainer import generate_explanation, get_countermeasure
    from services.firebase_service import sync_reading_to_firestore
    from routers.devices import pop_pending_alert
    from limiter import limiter
except ImportError:
    from backend.database import get_db, Telemetry, Alert, RiskSnapshot
    from backend.schemas import TelemetryIngestRequest, TelemetryIngestResponse
    from backend.services.model_registry import registry
    from backend.services.sse_manager import sse_manager
    from backend.services.radiation_model import RadiationModel
    from backend.services.explainer import generate_explanation, get_countermeasure
    from backend.services.firebase_service import sync_reading_to_firestore
    from backend.routers.devices import pop_pending_alert
    from backend.limiter import limiter

router = APIRouter(prefix="/ingest", tags=["Ingest"])


def forward_to_render_cloud(payload_json_str: str):
    """Mirror hardware telemetry frame to Render cloud ingest in background."""
    try:
        req = urllib.request.Request(
            "https://astrovitals.onrender.com/api/v1/ingest/vitals",
            data=payload_json_str.encode("utf-8"),
            headers={"Content-Type": "application/json", "X-Device-Id": "esp32-orbital-hub-01"},
        )
        urllib.request.urlopen(req, timeout=3.5)
    except Exception:
        pass


@router.post("/vitals", response_model=TelemetryIngestResponse)
@limiter.limit("1000/hour")
async def ingest_vitals(
    request: Request,
    response: Response,
    payload: TelemetryIngestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Ingest a batch of wearable telemetry readings.

    Persists readings to the time-series store, checks for anomalies via frozen ML
    and physiological safety thresholds, triggers alerts if necessary, and broadcasts
    live updates to active SSE clients.
    """
    if not payload.readings:
        raise HTTPException(status_code=400, detail="Empty readings array")

    inserted_count = 0
    anomaly_detected = False
    latest_hr = None
    latest_spo2 = None
    latest_rad = None
    latest_reading = payload.readings[-1]

    # Process all readings
    for r in payload.readings:
        temp_c = r.skin_temp_c
        if temp_c is None and r.skin_temp_f is not None:
            temp_c = round((r.skin_temp_f - 32.0) * 5.0 / 9.0, 2)
        elif temp_c is not None and r.skin_temp_f is None:
            r.skin_temp_f = round(temp_c * 1.8 + 32.0, 2)

        # Ensure fresh UTC timestamp if device provided placeholder or missing
        entry_ts = r.timestamp_utc
        if isinstance(entry_ts, str):
            try:
                entry_ts = datetime.fromisoformat(entry_ts.replace("Z", "+00:00"))
            except Exception:
                entry_ts = datetime.now(timezone.utc)
        elif not isinstance(entry_ts, datetime):
            entry_ts = datetime.now(timezone.utc)

        if str(entry_ts).startswith("2026-10-31") or "2026-10-31" in str(entry_ts) or str(entry_ts).startswith("1970"):
            entry_ts = datetime.now(timezone.utc)
        r.timestamp_utc = entry_ts

        telemetry_entry = Telemetry(
            astronaut_id=payload.astronaut_id,
            device_id=payload.device_id,
            timestamp_utc=entry_ts,
            heart_rate_bpm=r.heart_rate_bpm,
            spo2_pct=r.spo2_pct,
            skin_temp_c=temp_c,
            accel_x_g=r.accel_x_g,
            accel_y_g=r.accel_y_g,
            accel_z_g=r.accel_z_g,
            activity_state=r.activity_state or "rest",
            radiation_dose_uSv_cumulative=r.radiation_dose_uSv_cumulative or 0.0,
            battery_pct=r.battery_pct,
            wifi_rssi=r.wifi_rssi,
            buffered=r.buffered or False,
        )
        db.add(telemetry_entry)
        inserted_count += 1

    db.commit()

    latest_hr = latest_reading.heart_rate_bpm
    latest_spo2 = latest_reading.spo2_pct
    latest_rad = latest_reading.radiation_dose_uSv_cumulative or 0.0

    # Evaluate anomaly with frozen IsolationForest & safety checks
    vitals_dict = {
        "heart_rate_bpm": latest_hr,
        "spo2_pct": latest_spo2,
        "skin_temp_c": latest_reading.skin_temp_c,
    }
    feat_df = registry.build_feature_dataframe(
        mission_day=42,
        age=38.0,
        hr_bpm=latest_hr,
        spo2_pct=latest_spo2,
        temp_c=latest_reading.skin_temp_c,
        activity=latest_reading.activity_state or "rest",
    )
    anomaly_detected = registry.detect_anomaly(feat_df, vitals_dict)

    # If anomaly detected, record alert in DB
    if anomaly_detected:
        reason = "Physiological threshold breach or ML anomaly signature detected."
        if latest_hr and latest_hr > 120:
            reason = f"Tachycardia detected: Heart rate {latest_hr:.0f} BPM exceeds safe envelope."
        elif latest_spo2 and latest_spo2 < 92:
            reason = f"Hypoxia alert: Blood oxygen saturation dropped to {latest_spo2:.1f}%."

        alert_entry = Alert(
            astronaut_id=payload.astronaut_id,
            alert_type="anomaly",
            severity="critical" if (latest_hr and latest_hr > 130) or (latest_spo2 and latest_spo2 < 90) else "warning",
            message=reason,
            acknowledged=False,
            sent_at=datetime.now(timezone.utc),
        )
        db.add(alert_entry)
        db.commit()

    # Prepare SSE payload
    rad_status = RadiationModel.evaluate(latest_rad)
    sensors_dict = getattr(latest_reading, "sensors", None) or getattr(payload, "sensors", None) or {
        "max30102": True,
        "ds18b20": True,
        "mpu6050": True,
        "ssd1306": True,
    }
    is_hw = getattr(latest_reading, "is_hardware_reading", True) or getattr(payload, "is_hardware", True)

    temp_f = latest_reading.skin_temp_f
    if temp_f is None and latest_reading.skin_temp_c is not None:
        temp_f = round(latest_reading.skin_temp_c * 1.8 + 32.0, 1)
    motion_val = getattr(latest_reading, "motion_g", None) or 0.03

    broadcast_data = {
        "astronaut_id": payload.astronaut_id,
        "timestamp_utc": latest_reading.timestamp_utc.isoformat() if hasattr(latest_reading.timestamp_utc, "isoformat") else str(latest_reading.timestamp_utc),
        "heart_rate_bpm": latest_hr,
        "spo2_pct": latest_spo2,
        "skin_temp_c": latest_reading.skin_temp_c,
        "skin_temp_f": temp_f,
        "accel_x_g": latest_reading.accel_x_g,
        "accel_y_g": latest_reading.accel_y_g,
        "accel_z_g": latest_reading.accel_z_g,
        "motion_g": motion_val,
        "accel_magnitude_g": motion_val,
        "activity_state": latest_reading.activity_state,
        "radiation_dose_uSv_cumulative": latest_rad,
        "radiation_status": rad_status,
        "battery_pct": latest_reading.battery_pct,
        "wifi_rssi": latest_reading.wifi_rssi,
        "is_anomaly": anomaly_detected,
        "sensors": sensors_dict,
        "is_hardware_reading": is_hw,
    }

    # Broadcast to SSE clients asynchronously
    await sse_manager.broadcast(payload.astronaut_id, broadcast_data)

    # Mirror to Render cloud backend in background if running locally
    if not os.getenv("RENDER"):
        try:
            background_tasks.add_task(forward_to_render_cloud, payload.model_dump_json())
        except Exception:
            pass

    # Check for pending advisory alert commands dispatched to this device/astronaut
    advisory_alert_msg = None
    if payload.device_id:
        advisory_alert_msg = pop_pending_alert(payload.device_id)
    if not advisory_alert_msg and payload.astronaut_id:
        advisory_alert_msg = pop_pending_alert(payload.astronaut_id)

    # Sync latest reading to Firestore real-time layer
    try:
        reading_dict = {
            "device_id": payload.device_id,
            "timestamp_utc": latest_reading.timestamp_utc.isoformat() if hasattr(latest_reading.timestamp_utc, "isoformat") else str(latest_reading.timestamp_utc),
            "heart_rate_bpm": latest_hr,
            "spo2_pct": latest_spo2,
            "skin_temp_c": latest_reading.skin_temp_c,
            "accel_x_g": latest_reading.accel_x_g or 0.0,
            "accel_y_g": latest_reading.accel_y_g or 0.0,
            "accel_z_g": latest_reading.accel_z_g or 0.98,
            "activity_state": latest_reading.activity_state or "rest",
            "radiation_dose_uSv_cumulative": latest_rad or 0.0,
            "battery_pct": latest_reading.battery_pct if latest_reading.battery_pct is not None else 100,
            "wifi_rssi": latest_reading.wifi_rssi if latest_reading.wifi_rssi is not None else -50,
            "wifi_ssid": getattr(latest_reading, "wifi_ssid", None) or getattr(payload, "wifi_ssid", None) or "Nominal Wi-Fi",
            "firmware_version": getattr(payload, "firmware_version", None) or "2.1.0-orbital",
            "buffered": latest_reading.buffered or False,
            "sensors": sensors_dict,
            "is_hardware_reading": is_hw,
        }
        background_tasks.add_task(sync_reading_to_firestore, payload.astronaut_id, reading_dict)
    except Exception as e:
        print(f"[Ingest] Warning enqueuing Firestore sync: {e}")

    return TelemetryIngestResponse(
        status="success",
        inserted_count=inserted_count,
        anomaly_detected=anomaly_detected,
        latest_heart_rate=latest_hr,
        latest_spo2=latest_spo2,
        latest_radiation_uSv=latest_rad,
        advisory_alert=advisory_alert_msg,
        timestamp=datetime.now(timezone.utc),
    )
