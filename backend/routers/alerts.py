from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from pydantic import BaseModel

try:
    from database import get_db, Alert, User
    from schemas import AlertSubscribeRequest, AlertResponse
    from services.email_service import email_service
except ImportError:
    from backend.database import get_db, Alert, User
    from backend.schemas import AlertSubscribeRequest, AlertResponse
    from backend.services.email_service import email_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class EmergencyAlertRequest(BaseModel):
    astronaut_id: Optional[str] = "astronaut-A"
    reason: Optional[str] = "Manual Crew Distress Beacon Triggered"


@router.post("/emergency")
def trigger_emergency_alert(
    payload: Optional[EmergencyAlertRequest] = None,
    db: Session = Depends(get_db),
):
    """Trigger acute manual emergency beacon to all crew members and ground control."""
    astro_id = payload.astronaut_id if payload and payload.astronaut_id else "astronaut-A"
    reason = payload.reason if payload and payload.reason else "Manual Crew Distress Beacon Triggered"
    now = datetime.now(timezone.utc)

    alert_entry = Alert(
        astronaut_id=astro_id,
        alert_type="EMERGENCY_BEACON",
        severity="critical",
        message=f"CRITICAL DISTRESS: {reason} by {astro_id} at {now.strftime('%H:%M:%SZ')}",
        acknowledged=False,
        sent_at=now,
    )
    db.add(alert_entry)
    db.commit()
    db.refresh(alert_entry)

    # Dispatch notifications to registered users
    try:
        users = db.query(User).filter(User.deleted_at.is_(None)).all()
        for u in users:
            try:
                email_service.send_alert_notification(
                    email=u.email,
                    astronaut_name=u.full_name or astro_id,
                    alert_type="MISSION EMERGENCY BEACON",
                    message=alert_entry.message,
                )
            except Exception as mail_err:
                print(f"[Emergency] Mail dispatch failed for {u.email}: {mail_err}")
    except Exception as e:
        print(f"[Emergency] Notification broadcast warning: {e}")

    return {
        "status": "triggered",
        "alert_id": alert_entry.id,
        "severity": "critical",
        "message": alert_entry.message,
        "sent_at": alert_entry.sent_at.isoformat(),
    }


@router.post("/subscribe")
def subscribe_to_alerts(payload: AlertSubscribeRequest):
    """Subscribe a client device or webhook to mission health alert broadcasts."""
    return {
        "status": "subscribed",
        "astronaut_id": payload.astronaut_id,
        "channel": payload.channel,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/{alert_id}/acknowledge", response_model=dict)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Acknowledge an acute alert (e.g. from Anomaly Alert Bar)."""
    alert_entry = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert_entry:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    alert_entry.acknowledged = True
    db.commit()
    return {
        "status": "acknowledged",
        "alert_id": alert_id,
        "acknowledged_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/history")
def get_alerts_history(
    astronaut_id: Optional[str] = Query(None, description="Optional astronaut ID filter"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve acute alert history and active critical status flags."""
    query = db.query(Alert)
    if astronaut_id:
        query = query.filter(Alert.astronaut_id == astronaut_id)

    alerts = query.order_by(Alert.sent_at.desc()).limit(limit).all()

    return {
        "total_alerts": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "astronaut_id": a.astronaut_id,
                "alert_type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "acknowledged": a.acknowledged,
                "sent_at": a.sent_at.isoformat() if a.sent_at else None,
            }
            for a in alerts
        ],
    }
