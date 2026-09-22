from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from database import get_db, AstronautProfile, Telemetry, RiskSnapshot, CognitiveTest, User
    from services.pdf_service import PDFReportService
    from services.radiation_model import RadiationModel
    from services.model_registry import registry
    from services.firebase_service import sync_mission_crew
except ImportError:
    from backend.database import get_db, AstronautProfile, Telemetry, RiskSnapshot, CognitiveTest, User
    from backend.services.pdf_service import PDFReportService
    from backend.services.radiation_model import RadiationModel
    from backend.services.model_registry import registry
    from backend.services.firebase_service import sync_mission_crew

router = APIRouter(prefix="/astronaut", tags=["Astronaut"])


class AstronautCreateRequest(BaseModel):
    id: str
    name: str
    role: str = "Mission Specialist"
    callsign: str = "MS"
    avatar_url: Optional[str] = None
    baseline_window_hours: int = 72


@router.post("", response_model=dict)
def create_or_update_astronaut(
    payload: AstronautCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create or update an astronaut crew profile."""
    profile = db.query(AstronautProfile).filter(AstronautProfile.id == payload.id).first()
    now = datetime.now(timezone.utc)
    if profile:
        profile.name = payload.name
        profile.role = payload.role
        profile.callsign = payload.callsign
        if payload.avatar_url:
            profile.avatar_url = payload.avatar_url
        profile.baseline_window_hours = payload.baseline_window_hours
    else:
        profile = AstronautProfile(
            id=payload.id,
            name=payload.name,
            role=payload.role,
            callsign=payload.callsign,
            mission_day_0=now,
            avatar_url=payload.avatar_url,
            baseline_window_hours=payload.baseline_window_hours,
        )
        db.add(profile)
    db.commit()

    # Sync crew list to Firestore in background
    try:
        all_profiles = db.query(AstronautProfile).all()
        crew_list = [
            {
                "astronaut_id": p.id,
                "full_name": p.name,
                "role": p.role,
                "callsign": p.callsign,
                "health_score": 98.0,
            }
            for p in all_profiles
        ]
        background_tasks.add_task(sync_mission_crew, crew_list)
    except Exception as e:
        print(f"[Astronaut] Firestore sync error: {e}")

    return {"status": "success", "astronaut_id": profile.id, "name": profile.name}


@router.get("", tags=["Astronaut"])
@router.get("/list", tags=["Astronaut"])
def list_astronauts(db: Session = Depends(get_db)):
    """List all crew members with real-time status and health score for Mission Control."""
    crew = db.query(AstronautProfile).order_by(
        (AstronautProfile.callsign != "CDR"),
        AstronautProfile.created_at.asc(),
    ).all()

    if not crew:
        demo_crew = [
            {
                "id": "astronaut-A",
                "name": "Crew Member 1",
                "role": "Commander (CDR)",
                "callsign": "CDR",
                "mission_day": 42,
                "avatar_url": None,
                "status": "nominal",
                "health_score": 98,
                "is_demo": True,
                "latest_vitals": {
                    "heart_rate_bpm": 72.0,
                    "spo2_pct": 98.5,
                    "skin_temp_c": 36.5,
                    "activity_state": "rest",
                    "radiation_dose_uSv": 12.5,
                },
            },
            {
                "id": "astronaut-B",
                "name": "Crew Member 2",
                "role": "Flight Engineer (MS1)",
                "callsign": "MS1",
                "mission_day": 42,
                "avatar_url": None,
                "status": "caution",
                "health_score": 82,
                "is_demo": True,
                "latest_vitals": {
                    "heart_rate_bpm": 78.0,
                    "spo2_pct": 97.8,
                    "skin_temp_c": 36.7,
                    "activity_state": "rest",
                    "radiation_dose_uSv": 12.5,
                },
            },
            {
                "id": "astronaut-C",
                "name": "Crew Member 3",
                "role": "Science Officer (MS2)",
                "callsign": "MS2",
                "mission_day": 42,
                "avatar_url": None,
                "status": "nominal",
                "health_score": 95,
                "is_demo": True,
                "latest_vitals": {
                    "heart_rate_bpm": 68.0,
                    "spo2_pct": 99.0,
                    "skin_temp_c": 36.3,
                    "activity_state": "rest",
                    "radiation_dose_uSv": 12.5,
                },
            },
            {
                "id": "astronaut-D",
                "name": "Crew Member 4",
                "role": "Mission Specialist (MS3)",
                "callsign": "MS3",
                "mission_day": 42,
                "avatar_url": None,
                "status": "nominal",
                "health_score": 96,
                "is_demo": True,
                "latest_vitals": {
                    "heart_rate_bpm": 74.0,
                    "spo2_pct": 98.2,
                    "skin_temp_c": 36.6,
                    "activity_state": "rest",
                    "radiation_dose_uSv": 12.5,
                },
            },
        ]
        return {
            "total_crew": 4,
            "crew": demo_crew,
            "is_demo": True,
            "demo_label": "Demo Crew - Register to see real data",
        }

    results = []
    now = datetime.now(timezone.utc)
    for member in crew:
        # Calculate mission day
        day_0 = member.mission_day_0.replace(tzinfo=timezone.utc) if member.mission_day_0.tzinfo is None else member.mission_day_0
        mission_day = max(1, (now - day_0).days)

        # Get latest telemetry
        tel = (
            db.query(Telemetry)
            .filter(Telemetry.astronaut_id == member.id)
            .order_by(Telemetry.timestamp_utc.desc())
            .first()
        )

        hr = tel.heart_rate_bpm if tel else 72.0
        spo2 = tel.spo2_pct if tel else 98.0
        temp = tel.skin_temp_c if tel else 36.5
        activity = tel.activity_state if tel else "rest"
        rad_dose = tel.radiation_dose_uSv_cumulative if tel else 12.5

        # Get latest risk snapshot or compute default
        latest_risk = (
            db.query(RiskSnapshot)
            .filter(RiskSnapshot.astronaut_id == member.id)
            .order_by(RiskSnapshot.timestamp_utc.desc())
            .first()
        )
        comp_risk = latest_risk.composite_risk if latest_risk and latest_risk.composite_risk else 12.0
        health_score = round(max(0.0, min(100.0, 100.0 - comp_risk)), 0)

        # Derive status
        if tel and (hr > 125 or spo2 < 91):
            status = "critical"
        elif comp_risk > 40.0 or (tel and (hr > 95 or spo2 < 95)):
            status = "caution"
        else:
            status = "nominal"

        results.append({
            "id": member.id,
            "name": member.name,
            "role": member.role,
            "callsign": member.callsign,
            "mission_day": mission_day,
            "avatar_url": member.avatar_url,
            "status": status,
            "health_score": int(health_score),
            "is_demo": False,
            "latest_vitals": {
                "heart_rate_bpm": round(hr, 1),
                "spo2_pct": round(spo2, 1),
                "skin_temp_c": round(temp, 1),
                "activity_state": activity,
                "radiation_dose_uSv": round(rad_dose, 2),
            },
        })

    return {"total_crew": len(results), "crew": results, "is_demo": False}


def _find_profile(astronaut_id: str, db: Session) -> Optional[AstronautProfile]:
    p = db.query(AstronautProfile).filter(AstronautProfile.id == astronaut_id).first()
    if p:
        return p
    p = db.query(AstronautProfile).filter(AstronautProfile.callsign.ilike(astronaut_id)).first()
    if p:
        return p
    p = db.query(AstronautProfile).filter(AstronautProfile.user_id == astronaut_id).first()
    if p:
        return p
    if astronaut_id.lower() in ("astronaut-a", "cadet-1", "cdr", "commander"):
        return db.query(AstronautProfile).order_by(AstronautProfile.created_at.asc()).first()
    elif astronaut_id.lower() in ("astronaut-b", "ms1"):
        return db.query(AstronautProfile).filter(AstronautProfile.callsign.ilike("MS1")).first()
    return None


@router.get("/{astronaut_id}")
def get_astronaut(astronaut_id: str, db: Session = Depends(get_db)):
    """Retrieve specific astronaut profile."""
    profile = _find_profile(astronaut_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found")

    now = datetime.now(timezone.utc)
    day_0 = profile.mission_day_0.replace(tzinfo=timezone.utc) if profile.mission_day_0.tzinfo is None else profile.mission_day_0
    mission_day = max(1, (now - day_0).days)

    return {
        "id": profile.id,
        "name": profile.name,
        "role": profile.role,
        "callsign": profile.callsign,
        "mission_day": mission_day,
        "baseline_window_hours": profile.baseline_window_hours,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
    }


@router.get("/{astronaut_id}/summary")
def get_astronaut_summary(astronaut_id: str, db: Session = Depends(get_db)):
    """Retrieve 24-hour physiological and cognitive summary metrics for Medical Dossier."""
    profile = _find_profile(astronaut_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found")

    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)

    # 1. 24h Telemetry records matching profile.id or simulator ID aliases
    id_candidates = [profile.id, astronaut_id]
    if profile.callsign == "CDR" or astronaut_id.lower() in ("astronaut-a", "cdr"):
        id_candidates.append("astronaut-A")
    elif profile.callsign == "MS1" or astronaut_id.lower() in ("astronaut-b", "ms1"):
        id_candidates.append("astronaut-B")

    tel_records = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id.in_(id_candidates), Telemetry.timestamp_utc >= since_24h)
        .all()
    )
    if not tel_records:
        tel_records = (
            db.query(Telemetry)
            .filter(Telemetry.astronaut_id.in_(id_candidates))
            .order_by(Telemetry.timestamp_utc.desc())
            .limit(60)
            .all()
        )

    if tel_records:
        hr_values = [r.heart_rate_bpm for r in tel_records if r.heart_rate_bpm is not None]
        spo2_values = [r.spo2_pct for r in tel_records if r.spo2_pct is not None]
        temp_values = [r.skin_temp_c for r in tel_records if r.skin_temp_c is not None]
        hr_mean = round(sum(hr_values) / len(hr_values), 1) if hr_values else 72.4
        spo2_mean = round(sum(spo2_values) / len(spo2_values), 1) if spo2_values else 98.2
        temp_mean = round(sum(temp_values) / len(temp_values), 2) if temp_values else 36.5
        latest_tel = max(tel_records, key=lambda r: r.timestamp_utc)
        rad_cumulative = latest_tel.radiation_dose_uSv_cumulative or 12500.0
    else:
        hr_mean = 72.4
        spo2_mean = 98.2
        temp_mean = 36.5
        rad_cumulative = 12500.0

    # 2. Cognitive metrics (last 5 tests)
    cog_tests = (
        db.query(CognitiveTest)
        .filter(CognitiveTest.astronaut_id == astronaut_id)
        .order_by(CognitiveTest.timestamp_utc.desc())
        .limit(5)
        .all()
    )
    if cog_tests:
        rt_values = [c.reaction_time_mean for c in cog_tests if c.reaction_time_mean is not None]
        mood_values = [c.mood_score for c in cog_tests if c.mood_score is not None]
        rt_mean = round(sum(rt_values) / len(rt_values), 1) if rt_values else 268.0
        mood_score = round(sum(mood_values) / len(mood_values), 1) if mood_values else 8.2
    else:
        rt_mean = 268.0
        mood_score = 8.2

    rad_mSv = round(rad_cumulative / 1000.0, 2)
    career_limit_mSv = 600.0
    career_pct = round((rad_mSv / career_limit_mSv) * 100.0, 2)

    day_0 = profile.mission_day_0.replace(tzinfo=timezone.utc) if profile.mission_day_0.tzinfo is None else profile.mission_day_0
    mission_day = max(1, (now - day_0).days)

    return {
        "astronaut_id": profile.id,
        "name": profile.name,
        "role": profile.role,
        "callsign": profile.callsign,
        "mission_day": mission_day,
        "resting_hr_mean": hr_mean,
        "spo2_mean": spo2_mean,
        "temp_mean": temp_mean,
        "reaction_time_mean_ms": rt_mean,
        "circadian_mood_score": mood_score,
        "radiation_cumulative_mSv": rad_mSv,
        "career_limit_mSv": career_limit_mSv,
        "career_limit_pct": career_pct,
        "data_sufficiency": "sufficient" if len(tel_records) >= 5 else "insufficient",
    }


@router.get("/{astronaut_id}/report")
def download_astronaut_medical_report(astronaut_id: str, db: Session = Depends(get_db)):
    """Generate and stream a cinematic PDF medical dossier for the astronaut."""
    profile = _find_profile(astronaut_id, db)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found")

    tel = (
        db.query(Telemetry)
        .filter(Telemetry.astronaut_id == astronaut_id)
        .order_by(Telemetry.timestamp_utc.desc())
        .first()
    )

    now = datetime.now(timezone.utc)
    day_0 = profile.mission_day_0.replace(tzinfo=timezone.utc) if profile.mission_day_0.tzinfo is None else profile.mission_day_0
    mission_day = max(1, (now - day_0).days)

    astronaut_info = {
        "id": profile.id,
        "name": profile.name,
        "role": profile.role,
        "callsign": profile.callsign,
        "mission_day": mission_day,
    }

    hr = tel.heart_rate_bpm if tel else 72.0
    spo2 = tel.spo2_pct if tel else 98.0
    temp = tel.skin_temp_c if tel else 36.5
    motion = round(abs((tel.accel_x_g or 0.0)**2 + (tel.accel_y_g or 0.0)**2 + ((tel.accel_z_g or 1.0) - 1.0)**2)**0.5, 3) if tel else 0.02
    activity = tel.activity_state if tel else "rest"
    rad_dose = tel.radiation_dose_uSv_cumulative if tel else 12.55

    vitals_info = {
        "heart_rate_bpm": hr,
        "spo2_pct": spo2,
        "skin_temp_c": temp,
        "motion_g": motion,
        "activity_state": activity,
        "hr_delta_pct": round(((hr - 72.0) / 72.0) * 100.0, 1),
        "spo2_delta_pct": round(((spo2 - 98.0) / 98.0) * 100.0, 1),
        "temp_delta_c": round(temp - 36.5, 2),
        "status": "nominal" if hr <= 95 and spo2 >= 95 else "caution",
    }

    # Synthesize risk info
    feat_df = registry.build_feature_dataframe(
        mission_day=mission_day,
        age=38.0,
        hr_bpm=hr,
        spo2_pct=spo2,
        temp_c=temp,
        activity=activity,
    )
    cv_score = registry.score("cv", feat_df)
    sleep_score = registry.score("sleep", feat_df)
    immune_score = registry.score("immune", feat_df)

    risk_info = {
        "cardiovascular": {"score": cv_score},
        "sleep_behavioral": {"score": sleep_score},
        "immune": {"score": immune_score},
        "cognitive": {"score": 78.0},
    }

    rad_eval = RadiationModel.evaluate(rad_dose)

    pdf_bytes = PDFReportService.generate_astronaut_report(
        astronaut_info=astronaut_info,
        vitals_info=vitals_info,
        risk_info=risk_info,
        rad_info=rad_eval,
    )

    filename = f"AstroVitals_Dossier_{astronaut_id}_{now.strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf",
        },
    )
