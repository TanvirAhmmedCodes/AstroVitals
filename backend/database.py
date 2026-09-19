"""AstroVitals Neuro-Shield — Core Database Schema & Session Factory.

Defines tables for AstronautProfile, Telemetry, RiskSnapshot, CognitiveTest,
ChatMessage, Alert, User, LoginHistory, and AuditLog.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
import bcrypt

import os

try:
    from config import settings
except ImportError:
    from backend.config import settings

# Engine setup
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """User account model for authentication, role management, and profile settings."""
    __tablename__ = "user"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="observer")  # 'admin' or 'observer'
    astronaut_id = Column(String, nullable=True)  # Links to AstronautProfile if assigned
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    avatar_url = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    language = Column(String, default="en")
    suspended = Column(Boolean, default=False)
    suspended_reason = Column(String, nullable=True)
    password_change_required = Column(Boolean, default=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)
    last_active = Column(DateTime, nullable=True)
    last_ip = Column(String, nullable=True)

    login_history = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")


class LoginHistory(Base):
    """Tracks login timestamps and partial IP addresses (privacy-preserving)."""
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False, index=True)
    ip_partial = Column(String, nullable=True)  # e.g., '192.168.x.x'
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="login_history")


class AuditLog(Base):
    """Immutable audit trail for all administrative actions."""
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # e.g., 'suspend_user', 'change_role', 'delete_user'
    target_user_id = Column(String, nullable=True, index=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AstronautProfile(Base):
    __tablename__ = "astronaut_profile"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="Mission Specialist")
    callsign = Column(String, default="CDR")
    mission_day_0 = Column(DateTime, nullable=False)
    baseline_window_hours = Column(Integer, default=72)
    avatar_url = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    telemetry_records = relationship("Telemetry", back_populates="astronaut", cascade="all, delete-orphan")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    astronaut_id = Column(String, ForeignKey("astronaut_profile.id"), nullable=False, index=True)
    device_id = Column(String, nullable=True)
    timestamp_utc = Column(DateTime, nullable=False, index=True)
    heart_rate_bpm = Column(Float, nullable=True)
    spo2_pct = Column(Float, nullable=True)
    skin_temp_c = Column(Float, nullable=True)
    accel_x_g = Column(Float, nullable=True)
    accel_y_g = Column(Float, nullable=True)
    accel_z_g = Column(Float, nullable=True)
    activity_state = Column(String, default="rest")  # rest, active, exercise
    radiation_dose_uSv_cumulative = Column(Float, default=0.0)
    battery_pct = Column(Float, nullable=True)
    wifi_rssi = Column(Float, nullable=True)
    buffered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    astronaut = relationship("AstronautProfile", back_populates="telemetry_records")

    __table_args__ = (
        Index("idx_telemetry_astro_ts", "astronaut_id", "timestamp_utc"),
    )


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshot"

    id = Column(Integer, primary_key=True, autoincrement=True)
    astronaut_id = Column(String, nullable=False, index=True)
    timestamp_utc = Column(DateTime, nullable=False, index=True)
    cardiovascular = Column(Float, nullable=True)
    sleep_behavioral = Column(Float, nullable=True)
    immune = Column(Float, nullable=True)
    cognitive = Column(Float, nullable=True)
    radiation = Column(Float, nullable=True)
    composite_risk = Column(Float, nullable=True)
    anomaly_flag = Column(Boolean, default=False)
    explanation_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CognitiveTest(Base):
    __tablename__ = "cognitive_test"

    id = Column(Integer, primary_key=True, autoincrement=True)
    astronaut_id = Column(String, nullable=False, index=True)
    timestamp_utc = Column(DateTime, nullable=False, index=True)
    reaction_time_mean = Column(Float, nullable=True)
    reaction_time_std = Column(Float, nullable=True)
    mood_score = Column(Float, nullable=True)
    alertness_score = Column(Float, nullable=True)
    stress_score = Column(Float, nullable=True)
    cognitive_resilience_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    __tablename__ = "chat_message"

    id = Column(Integer, primary_key=True, autoincrement=True)
    astronaut_id = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_chat_session", "session_id", "created_at"),
    )


class Alert(Base):
    __tablename__ = "alert"

    id = Column(Integer, primary_key=True, autoincrement=True)
    astronaut_id = Column(String, nullable=False, index=True)
    alert_type = Column(String, nullable=False)  # cardiovascular, radiation, anomaly, sleep, immune
    severity = Column(String, nullable=False)    # nominal, caution, warning, critical, emergency
    message = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create tables and seed ONLY the single administrator account (MD Tanvir Ahmmed).

    Strictly does not seed placeholder crew members. Real users dynamically
    populate the crew roster.
    """
    Base.metadata.create_all(bind=engine)

    # Auto-migrate missing columns for SQLite
    try:
        with engine.connect() as conn:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(user)")
            cols = [row[1] for row in cursor.fetchall()]
            if cols and "password_change_required" not in cols:
                cursor.execute("ALTER TABLE user ADD COLUMN password_change_required BOOLEAN DEFAULT 1")
                conn.connection.commit()
                print("[init_db] Added password_change_required column to user table.")
    except Exception as e:
        print(f"[init_db] Column check: {e}")

    db = SessionLocal()
    try:
        # Seed ONLY the single administrator account
        admin_email = settings.ADMIN_EMAIL.strip().lower()
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            import uuid
            admin_initial_pwd = os.getenv("ADMIN_INITIAL_PASSWORD", getattr(settings, "ADMIN_INITIAL_PASSWORD", "ChangeMe123!"))
            pwd_bytes = admin_initial_pwd.encode("utf-8")[:72]
            hashed_pwd = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt(rounds=12)).decode("utf-8")
            admin_user = User(
                id=str(uuid.uuid4()),
                email=admin_email,
                password_hash=hashed_pwd,
                full_name="MD Tanvir Ahmmed",
                role="admin",
                email_verified=True,
                password_change_required=False,
                created_at=datetime.now(timezone.utc),
                last_login=datetime.now(timezone.utc),
            )
            db.add(admin_user)
            db.commit()
            print(f"[init_db] Initialized administrator: {admin_email} (role: admin, change_required: False)")
        else:
            # Ensure admin role, verified status, and astronaut profile are always maintained
            if existing_admin.role != "admin":
                existing_admin.role = "admin"
            if existing_admin.password_change_required is None:
                existing_admin.password_change_required = False
            existing_admin.email_verified = True
            existing_admin.full_name = "MD Tanvir Ahmmed"
            if not existing_admin.astronaut_id:
                existing_admin.astronaut_id = existing_admin.id

            admin_prof = db.query(AstronautProfile).filter(AstronautProfile.id == existing_admin.id).first()
            if not admin_prof:
                admin_prof = AstronautProfile(
                    id=existing_admin.id,
                    name="MD Tanvir Ahmmed",
                    role="Commander",
                    callsign="CDR",
                    mission_day_0=existing_admin.created_at or datetime.now(timezone.utc),
                    user_id=existing_admin.id,
                )
                db.add(admin_prof)
            else:
                admin_prof.name = "MD Tanvir Ahmmed"
                admin_prof.role = "Commander"
                admin_prof.callsign = "CDR"
                admin_prof.user_id = existing_admin.id
            db.commit()

        # Clean fake/orphan astronaut profiles (not linked to real users)
        valid_user_ids = [u.id for u in db.query(User).filter(User.deleted_at.is_(None)).all()]
        orphan_profiles = db.query(AstronautProfile).filter(
            (AstronautProfile.user_id == None) | (~AstronautProfile.user_id.in_(valid_user_ids))
        ).all()
        for op in orphan_profiles:
            db.delete(op)
        if orphan_profiles:
            print(f"[init_db] Removed {len(orphan_profiles)} orphan astronaut profiles.")

        # Update profile names to strictly match user full_names
        for u in db.query(User).filter(User.deleted_at.is_(None)).all():
            p = db.query(AstronautProfile).filter(AstronautProfile.user_id == u.id).first()
            if p and p.name != u.full_name:
                p.name = u.full_name

        db.commit()

        # Sync updated crew to Firestore real-time layer
        try:
            from services.firebase_service import sync_user_to_firestore, sync_mission_crew
            admin_u = db.query(User).filter(User.email == admin_email).first()
            if admin_u:
                sync_user_to_firestore({
                    "id": admin_u.id,
                    "email": admin_u.email,
                    "full_name": admin_u.full_name,
                    "role": admin_u.role,
                    "astronaut_id": admin_u.id,
                    "email_verified": True,
                })
            all_profs = db.query(AstronautProfile).order_by(
                (AstronautProfile.callsign != "CDR"),
                AstronautProfile.created_at.asc()
            ).all()
            crew_list = [
                {
                    "astronaut_id": p.id,
                    "full_name": p.name,
                    "role": p.role,
                    "callsign": p.callsign,
                    "health_score": 98.0,
                }
                for p in all_profs
            ]
            sync_mission_crew(crew_list)
            print(f"[init_db] Synced {len(crew_list)} crew members to Firestore mission/current.")
        except Exception as fe:
            print(f"[init_db] Firestore sync notice: {fe}")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] init_db failed: {e}")
    finally:
        db.close()
