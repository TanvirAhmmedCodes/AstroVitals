from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TelemetryReading(BaseModel):
    timestamp_utc: datetime
    heart_rate_bpm: Optional[float] = Field(None, ge=30, le=250)
    spo2_pct: Optional[float] = Field(None, ge=50, le=100)
    skin_temp_c: Optional[float] = Field(None, ge=25, le=45)
    accel_x_g: Optional[float] = 0.0
    accel_y_g: Optional[float] = 0.0
    accel_z_g: Optional[float] = 1.0
    activity_state: Optional[str] = "rest"
    radiation_dose_uSv_cumulative: Optional[float] = 0.0
    battery_pct: Optional[float] = Field(None, ge=0, le=100)
    wifi_rssi: Optional[float] = None
    buffered: Optional[bool] = False


class TelemetryIngestRequest(BaseModel):
    device_id: Optional[str] = "esp32-001"
    astronaut_id: str = "astronaut-A"
    readings: List[TelemetryReading]


class TelemetryIngestResponse(BaseModel):
    status: str = "success"
    inserted_count: int
    anomaly_detected: bool = False
    latest_heart_rate: Optional[float] = None
    latest_spo2: Optional[float] = None
    latest_radiation_uSv: Optional[float] = None
    advisory_alert: Optional[str] = None
    timestamp: datetime


class VitalsLatestResponse(BaseModel):
    astronaut_id: str
    timestamp_utc: datetime
    heart_rate_bpm: Optional[float] = 72.0
    spo2_pct: Optional[float] = 98.0
    skin_temp_c: Optional[float] = 36.5
    activity_state: str = "rest"
    motion_g: float = 0.02
    radiation_dose_uSv_cumulative: float = 12.5
    battery_pct: Optional[float] = 87.0
    wifi_rssi: Optional[float] = -45.0
    hr_delta_pct: float = 0.0
    spo2_delta_pct: float = 0.0
    temp_delta_c: float = 0.0
    status: str = "nominal"  # nominal, caution, warning, critical
    is_anomaly: bool = False
    provenance: Optional[Dict[str, Any]] = None


class VitalsHistoryItem(BaseModel):
    timestamp_utc: datetime
    heart_rate_bpm: Optional[float]
    spo2_pct: Optional[float]
    skin_temp_c: Optional[float]
    motion_g: Optional[float]
    activity_state: Optional[str]
    radiation_dose_uSv: Optional[float]
    is_anomaly: bool = False


class VitalsHistoryResponse(BaseModel):
    astronaut_id: str
    time_window: str
    total_records: int
    data: List[VitalsHistoryItem]
    provenance: Optional[Dict[str, Any]] = None


class RiskCategoryDetail(BaseModel):
    category: str
    score: float = Field(..., ge=0, le=100)
    status: str = "nominal"  # nominal, caution, warning, critical
    explanation: str
    countermeasure: str
    r2_disclosure: Optional[float] = None
    model_type: str = "Ensemble Regressor (XGB + GBR + RF)"
    provenance: Optional[Dict[str, Any]] = None


class RiskCurrentResponse(BaseModel):
    astronaut_id: str
    timestamp_utc: datetime
    mission_day: int
    composite_risk: float
    overall_status: str
    cardiovascular: RiskCategoryDetail
    sleep_behavioral: RiskCategoryDetail
    immune: RiskCategoryDetail
    cognitive: RiskCategoryDetail
    radiation: RiskCategoryDetail
    anomaly_flag: bool
    provenance: Optional[Dict[str, Any]] = None
    honesty_disclosure: str = (
        "AstroVitals uses wearable sensors as proxy indicators, trained against real clinical "
        "outcomes from NASA open datasets across 36 subjects (OSD-569, OSD-294, OSD-379, ESA Concordia). "
        "Cross-validated R^2 scores under GroupKFold (Cardiovascular: 0.673, Sleep: 0.577, Immune: 0.670) "
        "reflect honest generalization without subject leakage. Always consult flight surgeons for medical decisions."
    )


class RadiationStatusResponse(BaseModel):
    astronaut_id: str
    timestamp_utc: datetime
    cumulative_dose_uSv: float
    cumulative_dose_mSv: float
    career_limit_mSv: float = 600.0
    career_pct_used: float
    spe_mission_limit_mSv: float = 250.0
    spe_pct_used: float
    rate_uSv_per_hour: float
    in_south_atlantic_anomaly: bool
    radiation_multiplier: float
    projected_days_to_limit: float
    status: str  # nominal, caution, warning, critical
    data_source: str = "LIVE NOAA"  # LIVE NOAA, CACHE, FIXTURE, or SIMULATED
    solar_flux_class: Optional[str] = "B1.2"
    noaa_storm_scale: Optional[str] = "S0"
    provenance: Optional[Dict[str, Any]] = None


class AstronautProfileSchema(BaseModel):
    id: str
    name: str
    role: str
    callsign: str
    mission_day: int
    avatar_url: Optional[str] = None
    created_at: datetime


class HealthCheckResponse(BaseModel):
    status: str = "nominal"
    service: str = "AstroVitals Neuro-Shield API"
    version: str = "1.0.0"
    models_loaded: bool = False
    timestamp: datetime


class CognitiveTestRequest(BaseModel):
    astronaut_id: str = "astronaut-A"
    reaction_times_ms: List[float] = Field(..., min_length=1)
    mood_score: float = Field(7.0, ge=1.0, le=11.0, description="Inspiration4 11-point Likert scale")
    alertness_score: float = Field(6.0, ge=1.0, le=11.0, description="Inspiration4 11-point Likert scale")
    stress_score: float = Field(4.0, ge=1.0, le=11.0, description="Inspiration4 11-point Likert scale")


class CognitiveTestResponse(BaseModel):
    id: int
    astronaut_id: str
    timestamp_utc: datetime
    reaction_time_mean: float
    reaction_time_std: float
    mood_score: float
    alertness_score: float
    stress_score: float
    cognitive_resilience_score: float
    status: str  # nominal, caution, warning
    delta_vs_cognispace_pct: float
    normative_benchmark: str = "ESA COGNISPACE (Mean: 320ms, Std: 45ms)"
    countermeasure: str


class ChatMessageRequest(BaseModel):
    astronaut_id: str = "astronaut-A"
    session_id: str = "default-session"
    message: str


class ChatMessageResponse(BaseModel):
    astronaut_id: str
    session_id: str
    role: str = "assistant"
    content: str
    response: Optional[str] = None
    timestamp: datetime
    active_model: Optional[str] = None
    vitals_snapshot: Optional[Dict[str, Any]] = None


class AlertSubscribeRequest(BaseModel):
    astronaut_id: str = "astronaut-A"
    channel: str = "push"
    endpoint: Optional[str] = None


class AlertResponse(BaseModel):
    id: int
    astronaut_id: str
    alert_type: str
    severity: str
    message: str
    acknowledged: bool
    sent_at: datetime


class ForecastDayItem(BaseModel):
    day_offset: int
    mission_day: int
    date: str
    composite_risk: float
    cardiovascular_risk: float
    sleep_risk: float
    immune_risk: float
    cumulative_radiation_uSv: float
    with_intervention_risk: float


class ForecastResponse(BaseModel):
    astronaut_id: str
    forecast_window_days: int
    trajectory: str
    daily_forecast: List[ForecastDayItem]
    recommendation: str
