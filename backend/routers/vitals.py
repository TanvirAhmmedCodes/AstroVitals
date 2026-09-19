from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

try:
    from database import get_db, Telemetry
    from schemas import VitalsLatestResponse, VitalsHistoryResponse, VitalsHistoryItem
    from services.sse_manager import sse_manager
    from services.model_registry import registry
except ImportError:
    from backend.database import get_db, Telemetry
    from backend.schemas import VitalsLatestResponse, VitalsHistoryResponse, VitalsHistoryItem
    from backend.services.sse_manager import sse_manager
    from backend.services.model_registry import registry

router = APIRouter(prefix="/vitals", tags=["Vitals"])

BASELINE_HR = 72.0
BASELINE_SPO2 = 98.0
BASELINE_TEMP = 36.5


@router.get("/latest", response_model=VitalsLatestResponse)
def get_latest_vitals(
    astronaut_id: str = Query("astronaut-A", description="Astronaut identifier"),
    db: Session = Depends(get_db),
):
    """Retrieve the latest telemetry readout and baseline comparison deltas for an astronaut."""
    record = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id == astronaut_id)
        .order_by(Telemetry.timestamp_utc.desc())
        .first()
    )

    if not record:
        # Default nominal state when mission begins or before wearable connects
        now = datetime.now(timezone.utc)
        return VitalsLatestResponse(
            astronaut_id=astronaut_id,
            timestamp_utc=now,
            heart_rate_bpm=BASELINE_HR,
            spo2_pct=BASELINE_SPO2,
            skin_temp_c=BASELINE_TEMP,
            activity_state="rest",
            motion_g=0.02,
            radiation_dose_uSv_cumulative=12.5,
            battery_pct=95.0,
            wifi_rssi=-42.0,
            hr_delta_pct=0.0,
            spo2_delta_pct=0.0,
            temp_delta_c=0.0,
            status="nominal",
            is_anomaly=False,
        )

    hr = record.heart_rate_bpm or BASELINE_HR
    spo2 = record.spo2_pct or BASELINE_SPO2
    temp = record.skin_temp_c or BASELINE_TEMP

    hr_delta = round(((hr - BASELINE_HR) / BASELINE_HR) * 100.0, 1)
    spo2_delta = round(((spo2 - BASELINE_SPO2) / BASELINE_SPO2) * 100.0, 1)
    temp_delta = round(temp - BASELINE_TEMP, 2)

    # Check anomaly using frozen IsolationForest and physiological bounds
    feat_df = registry.build_feature_dataframe(
        mission_day=42,
        age=38.0,
        hr_bpm=hr,
        spo2_pct=spo2,
        temp_c=temp,
        activity=record.activity_state or "rest",
    )
    vitals_dict = {"heart_rate_bpm": hr, "spo2_pct": spo2, "skin_temp_c": temp}
    is_anomaly = registry.detect_anomaly(feat_df, vitals_dict)

    # Derive glanceable status indicator
    if is_anomaly or hr > 125 or spo2 < 91:
        status = "critical"
    elif hr > 95 or hr < 52 or spo2 < 95 or temp > 37.8:
        status = "caution"
    else:
        status = "nominal"

    motion = round(
        abs((record.accel_x_g or 0.0) ** 2 + (record.accel_y_g or 0.0) ** 2 + ((record.accel_z_g or 1.0) - 1.0) ** 2) ** 0.5,
        3,
    )

    return VitalsLatestResponse(
        astronaut_id=astronaut_id,
        timestamp_utc=record.timestamp_utc,
        heart_rate_bpm=round(hr, 1),
        spo2_pct=round(spo2, 1),
        skin_temp_c=round(temp, 1),
        activity_state=record.activity_state or "rest",
        motion_g=motion,
        radiation_dose_uSv_cumulative=round(record.radiation_dose_uSv_cumulative or 0.0, 2),
        battery_pct=record.battery_pct,
        wifi_rssi=record.wifi_rssi,
        hr_delta_pct=hr_delta,
        spo2_delta_pct=spo2_delta,
        temp_delta_c=temp_delta,
        status=status,
        is_anomaly=is_anomaly,
    )


@router.get("/live")
async def live_vitals_stream(
    request: Request,
    astronaut_id: str = Query("astronaut-A", description="Astronaut identifier to subscribe to"),
):
    """Server-Sent Events (SSE) stream pushing real-time telemetry updates to mission console."""
    generator = sse_manager.event_generator(astronaut_id)
    return EventSourceResponse(generator)


@router.get("/history", response_model=VitalsHistoryResponse)
def get_vitals_history(
    astronaut_id: str = Query("astronaut-A", description="Astronaut identifier"),
    limit: int = Query(60, ge=10, le=1000, description="Number of recent readings"),
    db: Session = Depends(get_db),
):
    """Retrieve historical vitals timeseries for sparklines and telemetry waveforms."""
    records = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id == astronaut_id)
        .order_by(Telemetry.timestamp_utc.desc())
        .limit(limit)
        .all()
    )

    items: List[VitalsHistoryItem] = []
    # Reverse to return in chronological order
    for r in reversed(records):
        motion = round(
            abs((r.accel_x_g or 0.0) ** 2 + (r.accel_y_g or 0.0) ** 2 + ((r.accel_z_g or 1.0) - 1.0) ** 2) ** 0.5,
            3,
        )
        is_anom = False
        if (r.heart_rate_bpm and (r.heart_rate_bpm > 120 or r.heart_rate_bpm < 50)) or (
            r.spo2_pct and r.spo2_pct < 92
        ):
            is_anom = True

        items.append(
            VitalsHistoryItem(
                timestamp_utc=r.timestamp_utc,
                heart_rate_bpm=r.heart_rate_bpm,
                spo2_pct=r.spo2_pct,
                skin_temp_c=r.skin_temp_c,
                motion_g=motion,
                activity_state=r.activity_state,
                radiation_dose_uSv=r.radiation_dose_uSv_cumulative,
                is_anomaly=is_anom,
            )
        )

    # If no records exist, seed a minimal synthetic history for immediate waveform rendering
    if not items:
        now = datetime.now(timezone.utc)
        for i in range(30):
            t = now - timedelta(seconds=(30 - i))
            items.append(
                VitalsHistoryItem(
                    timestamp_utc=t,
                    heart_rate_bpm=72.0 + (i % 3) - 1.0,
                    spo2_pct=98.0,
                    skin_temp_c=36.5,
                    motion_g=0.02,
                    activity_state="rest",
                    radiation_dose_uSv=12.5 + (i * 0.001),
                    is_anomaly=False,
                )
            )

    return VitalsHistoryResponse(
        astronaut_id=astronaut_id,
        time_window=f"Last {len(items)} readings",
        total_records=len(items),
        data=items,
    )
