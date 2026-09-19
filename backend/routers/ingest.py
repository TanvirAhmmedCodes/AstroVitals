from datetime import datetime, timezone
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
    from limiter import limiter
except ImportError:
    from backend.database import get_db, Telemetry, Alert, RiskSnapshot
    from backend.schemas import TelemetryIngestRequest, TelemetryIngestResponse
    from backend.services.model_registry import registry
    from backend.services.sse_manager import sse_manager
    from backend.services.radiation_model import RadiationModel
    from backend.services.explainer import generate_explanation, get_countermeasure
    from backend.services.firebase_service import sync_reading_to_firestore
    from backend.limiter import limiter

router = APIRouter(prefix="/ingest", tags=["Ingest"])


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
        telemetry_entry = Telemetry(
            astronaut_id=payload.astronaut_id,
            device_id=payload.device_id,
            timestamp_utc=r.timestamp_utc,
            heart_rate_bpm=r.heart_rate_bpm,
            spo2_pct=r.spo2_pct,
            skin_temp_c=r.skin_temp_c,
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
    broadcast_data = {
        "astronaut_id": payload.astronaut_id,
        "timestamp_utc": latest_reading.timestamp_utc.isoformat(),
        "heart_rate_bpm": latest_hr,
        "spo2_pct": latest_spo2,
        "skin_temp_c": latest_reading.skin_temp_c,
        "accel_x_g": latest_reading.accel_x_g,
        "accel_y_g": latest_reading.accel_y_g,
        "accel_z_g": latest_reading.accel_z_g,
        "activity_state": latest_reading.activity_state,
        "radiation_dose_uSv_cumulative": latest_rad,
        "radiation_status": rad_status,
        "battery_pct": latest_reading.battery_pct,
        "wifi_rssi": latest_reading.wifi_rssi,
        "is_anomaly": anomaly_detected,
    }

    # Broadcast to SSE clients asynchronously
    await sse_manager.broadcast(payload.astronaut_id, broadcast_data)

    # Sync latest reading to Firestore real-time layer
    try:
        reading_dict = {
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
            "buffered": latest_reading.buffered or False,
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
        timestamp=datetime.now(timezone.utc),
    )
