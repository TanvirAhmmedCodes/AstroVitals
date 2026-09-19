import math
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

try:
    from database import get_db, CognitiveTest
    from schemas import CognitiveTestRequest, CognitiveTestResponse
    from services.model_registry import registry
    from services.explainer import get_countermeasure
except ImportError:
    from backend.database import get_db, CognitiveTest
    from backend.schemas import CognitiveTestRequest, CognitiveTestResponse
    from backend.services.model_registry import registry
    from backend.services.explainer import get_countermeasure

router = APIRouter(prefix="/cognitive", tags=["Cognitive"])

NORM_RT_MEAN = 320.0  # ESA COGNISPACE norm mean in ms
NORM_RT_STD = 45.0    # ESA COGNISPACE norm std in ms


@router.post("/test", response_model=CognitiveTestResponse)
def submit_cognitive_test(payload: CognitiveTestRequest, db: Session = Depends(get_db)):
    """Submit astronaut cognitive trial results (Psychomotor Vigilance + Mood Survey).

    Evaluates response latencies against ESA COGNISPACE normative benchmarks and computes
    the composite Cognitive Resilience Score (0-100).
    """
    if not payload.reaction_times_ms:
        raise HTTPException(status_code=400, detail="reaction_times_ms array cannot be empty")

    times = payload.reaction_times_ms
    n = len(times)
    rt_mean = round(sum(times) / n, 1)

    if n > 1:
        variance = sum((x - rt_mean) ** 2 for x in times) / (n - 1)
        rt_std = round(math.sqrt(variance), 1)
    else:
        rt_std = 0.0

    # Delta vs normative benchmark: positive delta indicates faster reaction than benchmark
    delta_norm_pct = round(((NORM_RT_MEAN - rt_mean) / NORM_RT_MEAN) * 100.0, 1)

    # Calculate resilience score:
    # 1. Reaction vigilance component (200ms -> 100, 450ms -> 37.5)
    rt_score = max(20.0, min(100.0, 100.0 - (rt_mean - 200.0) * 0.30))
    # 2. Alertness component (1-11 Likert)
    alert_score = (payload.alertness_score / 11.0) * 100.0
    # 3. Mood component (1-11 Likert)
    mood_score = (payload.mood_score / 11.0) * 100.0
    # 4. Stress mitigation (inverted: lower stress = higher resilience)
    stress_mitigation = ((11.0 - payload.stress_score) / 10.0) * 100.0

    resilience = round(
        (rt_score * 0.40)
        + (alert_score * 0.30)
        + (mood_score * 0.15)
        + (stress_mitigation * 0.15),
        1,
    )

    if resilience >= 70.0:
        status = "nominal"
    elif resilience >= 50.0:
        status = "caution"
    else:
        status = "warning"

    now = datetime.now(timezone.utc)
    entry = CognitiveTest(
        astronaut_id=payload.astronaut_id,
        timestamp_utc=now,
        reaction_time_mean=rt_mean,
        reaction_time_std=rt_std,
        mood_score=payload.mood_score,
        alertness_score=payload.alertness_score,
        stress_score=payload.stress_score,
        cognitive_resilience_score=resilience,
        created_at=now,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    cm = get_countermeasure("cognitive")
    if status == "warning":
        cm = "Mandatory 30-min sleep replenishment protocol + sensory quiet before critical mission operations."

    return CognitiveTestResponse(
        id=entry.id,
        astronaut_id=entry.astronaut_id,
        timestamp_utc=entry.timestamp_utc,
        reaction_time_mean=rt_mean,
        reaction_time_std=rt_std,
        mood_score=payload.mood_score,
        alertness_score=payload.alertness_score,
        stress_score=payload.stress_score,
        cognitive_resilience_score=resilience,
        status=status,
        delta_vs_cognispace_pct=delta_norm_pct,
        normative_benchmark=f"ESA COGNISPACE (Mean: {NORM_RT_MEAN:.0f}ms, Std: {NORM_RT_STD:.0f}ms)",
        countermeasure=cm,
    )


@router.get("/norms")
def get_cognitive_norms():
    """Retrieve normative cognitive metrics from ESA COGNISPACE reference."""
    return registry.cognitive_norms or {
        "reaction_time_ms_mean": NORM_RT_MEAN,
        "reaction_time_ms_std": NORM_RT_STD,
        "mood_score_mean": 7.2,
        "mood_score_std": 1.5,
        "source": "ESA COGNISPACE Normative Model",
    }


@router.get("/history")
def get_cognitive_history(
    astronaut_id: str = Query("astronaut-A", description="Astronaut identifier"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve past cognitive test evaluations."""
    records = (
        db.query(CognitiveTest)
        .filter(CognitiveTest.astronaut_id == astronaut_id)
        .order_by(CognitiveTest.timestamp_utc.desc())
        .limit(limit)
        .all()
    )

    return {
        "astronaut_id": astronaut_id,
        "total_records": len(records),
        "history": [
            {
                "id": r.id,
                "timestamp_utc": r.timestamp_utc.isoformat(),
                "reaction_time_mean": r.reaction_time_mean,
                "reaction_time_std": r.reaction_time_std,
                "mood_score": r.mood_score,
                "alertness_score": r.alertness_score,
                "stress_score": r.stress_score,
                "cognitive_resilience_score": r.cognitive_resilience_score,
            }
            for r in records
        ],
    }
