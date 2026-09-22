"""AstroVitals Neuro-Shield - Firebase Admin Service.

Manages real-time Firestore synchronization for user accounts,
device telemetry, and mission crew state.
Operates strictly as a real-time sync layer alongside SQLite and JWT auth.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

# Lazy initialization state
_firebase_initialized = False
_db = None


def init_firebase() -> bool:
    """Initialize Firebase Admin SDK from env var or service account file.
    
    Returns True if initialized successfully, False otherwise (graceful fallback).
    """
    global _firebase_initialized, _db

    if _firebase_initialized and _db is not None:
        return True

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        service_account_info = None

        # 1. Primary: JSON string from environment variable
        json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        if json_str:
            try:
                service_account_info = json.loads(json_str)
            except Exception as json_err:
                logger.warning(f"[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {json_err}")

        # 2. Fallback: Local service account file if env var not set
        if not service_account_info:
            file_candidates = [
                Path("backend/firebase-service-account.json"),
                Path("firebase-service-account.json"),
                Path(__file__).resolve().parent.parent / "firebase-service-account.json",
            ]
            for file_path in file_candidates:
                if file_path.exists():
                    try:
                        service_account_info = json.loads(file_path.read_text(encoding="utf-8"))
                        logger.info(f"[Firebase] Loaded credentials from file: {file_path.name}")
                        break
                    except Exception as fe:
                        logger.warning(f"[Firebase] Could not read {file_path}: {fe}")

        if not service_account_info:
            logger.warning("[Firebase] No credentials found - Firebase sync disabled (graceful fallback)")
            return False

        cred = credentials.Certificate(service_account_info)

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)

        _db = firestore.client()
        _firebase_initialized = True
        logger.info("[Firebase] Admin SDK initialized successfully with project: %s", service_account_info.get("project_id", "astrovitals"))
        return True
    except Exception as e:
        logger.error(f"[Firebase] Init failed: {e}")
        return False


def get_db():
    """Get Firestore client. Returns None if not initialized."""
    if not _firebase_initialized or _db is None:
        init_firebase()
    return _db


def sync_user_to_firestore(user_data: Dict[str, Any]) -> bool:
    """Sync user data to Firestore users/{userId}."""
    db = get_db()
    if db is None:
        return False
    try:
        user_id = str(user_data.get("id"))
        if not user_id:
            return False

        db.collection("users").document(user_id).set({
            "id": user_id,
            "email": user_data.get("email"),
            "full_name": user_data.get("full_name", ""),
            "role": user_data.get("role", "observer"),
            "created_at": user_data.get("created_at", datetime.now(timezone.utc).isoformat()),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, merge=True)
        return True
    except Exception as e:
        logger.error(f"[Firebase] sync_user failed: {e}")
        return False


def sync_reading_to_firestore(astronaut_id: str, reading: Dict[str, Any]) -> bool:
    """Sync a vitals reading to Firestore devices/{astronaut_id}/readings/."""
    db = get_db()
    if db is None:
        return False
    try:
        device_ref = db.collection("devices").document(astronaut_id)

        # Update device status
        timestamp_str = reading.get("timestamp_utc") or datetime.now(timezone.utc).isoformat()
        device_ref.set({
            "device_id": astronaut_id,
            "owner_astronaut_id": astronaut_id,
            "last_seen": timestamp_str,
            "status": "online",
            "battery_pct": reading.get("battery_pct", 100),
            "wifi_rssi": reading.get("wifi_rssi", -50),
        }, merge=True)

        # Add reading to subcollection
        device_ref.collection("readings").add({
            "timestamp": timestamp_str,
            "heart_rate_bpm": reading.get("heart_rate_bpm"),
            "spo2_pct": reading.get("spo2_pct"),
            "skin_temp_c": reading.get("skin_temp_c"),
            "accel_x_g": reading.get("accel_x_g", 0.0),
            "accel_y_g": reading.get("accel_y_g", 0.0),
            "accel_z_g": reading.get("accel_z_g", 0.98),
            "activity_state": reading.get("activity_state", "rest"),
            "radiation_dose_uSv_cumulative": reading.get("radiation_dose_uSv_cumulative", 0.0),
            "buffered": reading.get("buffered", False),
        })
        return True
    except Exception as e:
        logger.error(f"[Firebase] sync_reading failed: {e}")
        return False


def sync_mission_crew(crew_list: list) -> bool:
    """Update mission/current with the crew list."""
    db = get_db()
    if db is None:
        return False
    try:
        db.collection("mission").document("current").set({
            "crew": crew_list,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, merge=True)
        return True
    except Exception as e:
        logger.error(f"[Firebase] sync_mission_crew failed: {e}")
        return False
