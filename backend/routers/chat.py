from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Request, Response
from sqlalchemy.orm import Session

try:
    from database import get_db, ChatMessage, Telemetry, RiskSnapshot, AstronautProfile, Alert, User
    from schemas import ChatMessageRequest, ChatMessageResponse
    from services.gemini_service import gemini_service
    from services.radiation_model import RadiationModel
    from middleware.auth import get_current_user
    from limiter import limiter, is_admin_request
except ImportError:
    from backend.database import get_db, ChatMessage, Telemetry, RiskSnapshot, AstronautProfile, Alert, User
    from backend.schemas import ChatMessageRequest, ChatMessageResponse
    from backend.services.gemini_service import gemini_service
    from backend.services.radiation_model import RadiationModel
    from backend.middleware.auth import get_current_user
    from backend.limiter import limiter, is_admin_request

router = APIRouter(prefix="/chat", tags=["AI Chat Companion"])


@router.post("/message", response_model=ChatMessageResponse)
@limiter.limit("20/hour", exempt_when=is_admin_request)
async def send_chat_message(
    request: Request,
    response: Response,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send message to the AI Companion (AstroVitals Neuro-Shield).

    Injects live mission context (vitals, risks, alerts, SAA passage, baselines)
    and persists multi-turn conversation history in SQLite.
    Requires verified email address and obeys 20/hour rate limit for observers.
    """
    if not current_user.email_verified and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Email verification required. Check your inbox.",
        )

    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    now = datetime.now(timezone.utc)

    # 1. Fetch astronaut profile
    profile = db.query(AstronautProfile).filter(AstronautProfile.id == payload.astronaut_id).first()
    astro_name = profile.name if profile else "Astronaut"
    mission_day = 42
    if profile:
        day_0 = profile.mission_day_0.replace(tzinfo=timezone.utc) if profile.mission_day_0.tzinfo is None else profile.mission_day_0
        mission_day = max(1, (now - day_0).days)

    # 2. Fetch latest telemetry
    tel = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id == payload.astronaut_id)
        .order_by(Telemetry.timestamp_utc.desc())
        .first()
    )

    hr = tel.heart_rate_bpm if tel else 72.0
    spo2 = tel.spo2_pct if tel else 98.0
    temp = tel.skin_temp_c if tel else 36.5
    activity = tel.activity_state if tel else "rest"
    rad_dose = tel.radiation_dose_uSv_cumulative if tel else 12.55

    # Check for recent anomalies
    recent_anom = False
    if tel and (hr > 125 or hr < 48 or spo2 < 91):
        recent_anom = True

    # 3. Fetch latest risk snapshot
    risk = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.astronaut_id == payload.astronaut_id)
        .order_by(RiskSnapshot.timestamp_utc.desc())
        .first()
    )

    rad_eval = RadiationModel.evaluate(rad_dose)

    vitals_snapshot = {
        "heart_rate_bpm": hr,
        "spo2_pct": spo2,
        "skin_temp_c": temp,
        "activity_state": activity,
        "radiation_dose_uSv_cumulative": rad_dose,
        "hr_delta_pct": round(((hr - 72.0) / 72.0) * 100.0, 1),
        "spo2_delta_pct": round(((spo2 - 98.0) / 98.0) * 100.0, 1),
        "is_anomaly": recent_anom,
    }

    context = {
        "mission_day": mission_day,
        "astronaut_name": astro_name,
        "astronaut_id": payload.astronaut_id,
        "current_vitals": vitals_snapshot,
        "current_risk": {
            "cardiovascular": {"score": risk.cardiovascular if risk else 50.2},
            "sleep_behavioral": {"score": risk.sleep_behavioral if risk else 49.9},
            "immune": {"score": risk.immune if risk else 49.8},
            "cognitive": {"score": 78.0},
        },
        "radiation": rad_eval,
    }

    # 4. Fetch last 6 messages from DB for history context
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == payload.session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in past_messages]

    # 5. Call Gemini AI Service
    reply_text = await gemini_service.chat(payload.message, history=history, context=context)

    # 6. Persist User Message and Assistant Response to DB
    user_msg_entry = ChatMessage(
        astronaut_id=payload.astronaut_id,
        session_id=payload.session_id,
        role="user",
        content=payload.message,
        tokens_used=len(payload.message.split()),
        created_at=now,
    )
    db.add(user_msg_entry)

    bot_msg_entry = ChatMessage(
        astronaut_id=payload.astronaut_id,
        session_id=payload.session_id,
        role="assistant",
        content=reply_text,
        tokens_used=len(reply_text.split()),
        created_at=now,
    )
    db.add(bot_msg_entry)
    db.commit()

    return ChatMessageResponse(
        astronaut_id=payload.astronaut_id,
        session_id=payload.session_id,
        role="assistant",
        content=reply_text,
        response=reply_text,
        timestamp=now,
        active_model=gemini_service.active_model,
        vitals_snapshot=vitals_snapshot,
    )


@router.get("/suggestions")
def get_chat_suggestions():
    """Return contextual suggestion chips for the astronaut chat console."""
    return {
        "suggestions": [
            "How are my vitals trending today?",
            "Explain my cardiovascular risk score and evidence base",
            "Guide me through 10-minute 4-7-8 breathing",
            "What is my cumulative radiation dose vs NASA limits?",
            "How does microgravity affect my immune system?",
            "Give me a quick cognitive relaxation exercise",
        ]
    }


@router.get("/history")
def get_chat_history(
    astronaut_id: str = Query("astronaut-A"),
    session_id: str = Query("default-session"),
    db: Session = Depends(get_db),
):
    """Retrieve session conversation history."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id, ChatMessage.astronaut_id == astronaut_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return {
        "astronaut_id": astronaut_id,
        "session_id": session_id,
        "total_messages": len(messages),
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }
