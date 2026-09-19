"""AstroVitals Neuro-Shield — ESP32 Wearable Device Registration Router.

Enables secure registration, token generation, and pairing for hardware
biometric wearables (ESP32/MAX30102). Links devices to astronauts and
syncs status to Firestore.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field

try:
    from database import get_db, User
    from services.auth_service import create_access_token, is_admin
    from services.firebase_service import get_db as get_firestore_db
    from middleware.auth import get_current_user
except ImportError:
    from backend.database import get_db, User
    from backend.services.auth_service import create_access_token, is_admin
    from backend.services.firebase_service import get_db as get_firestore_db
    from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/devices", tags=["Device Hardware"])


# --- Schemas ---

class DeviceRegisterRequest(BaseModel):
    device_id: str = Field(..., min_length=3, max_length=64, description="Unique hardware identifier, e.g. ESP32-BIO-001")
    device_name: str = Field("Bio-Wearable Alpha", min_length=2, max_length=64)
    owner_user_id: Optional[str] = Field(None, description="Assigned astronaut user ID")
    firmware_version: str = Field("1.0.0-esp32", description="Embedded firmware release")


class DevicePairRequest(BaseModel):
    pairing_code: str = Field(..., min_length=4, max_length=12, description="Ephemeral pairing pin displayed on device")


# --- Endpoints ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_device(
    data: DeviceRegisterRequest,
    current_user: User = Depends(get_current_user),
):
    """Register a bio-wearable telemetry device and issue a 1-year device token."""
    target_owner_id = data.owner_user_id or current_user.id

    # Generate 1-year long-lived device JWT
    device_token = create_access_token(
        data={
            "device_id": data.device_id,
            "owner_user_id": target_owner_id,
            "role": "device",
        },
        expires_delta=timedelta(days=365),
    )

    device_record = {
        "device_id": data.device_id,
        "device_name": data.device_name,
        "owner_user_id": target_owner_id,
        "owner_astronaut_name": current_user.full_name,
        "firmware_version": data.firmware_version,
        "status": "online",
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "last_seen": datetime.now(timezone.utc).isoformat(),
        "battery_pct": 100,
        "wifi_rssi": -50,
    }

    # Sync to Firestore if available
    fs_db = get_firestore_db()
    if fs_db is not None:
        try:
            fs_db.collection("devices").document(data.device_id).set(device_record, merge=True)
        except Exception as e:
            # Non-blocking warning for Firestore write
            print(f"[Devices] Warning syncing device doc: {e}")

    return {
        "status": "success",
        "message": "Device registered successfully for telemetry transmission.",
        "device_id": data.device_id,
        "device_token": device_token,
        "expires_in_days": 365,
        "device": device_record,
    }


@router.post("/{device_id}/pair")
def pair_device(
    device_id: str,
    data: DevicePairRequest,
    current_user: User = Depends(get_current_user),
):
    """Pair an unlinked hardware unit to the authenticated astronaut."""
    clean_pin = data.pairing_code.strip().upper()
    if len(clean_pin) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pairing code format.")

    fs_db = get_firestore_db()
    paired_data = {
        "device_id": device_id,
        "owner_user_id": current_user.id,
        "owner_astronaut_name": current_user.full_name,
        "paired_at": datetime.now(timezone.utc).isoformat(),
        "status": "online",
    }

    if fs_db is not None:
        try:
            fs_db.collection("devices").document(device_id).set(paired_data, merge=True)
        except Exception as e:
            print(f"[Devices] Error pairing device: {e}")

    return {
        "status": "success",
        "message": f"Device {device_id} successfully paired with astronaut {current_user.full_name}.",
        "paired": paired_data,
    }


@router.get("/list")
def list_devices(current_user: User = Depends(get_current_user)):
    """List registered telemetry hardware devices for this astronaut or entire fleet if admin."""
    devices = []
    fs_db = get_firestore_db()

    if fs_db is not None:
        try:
            query = fs_db.collection("devices")
            if not is_admin(current_user.email):
                query = query.where("owner_user_id", "==", current_user.id)
            docs = query.stream()
            for doc in docs:
                devices.append(doc.to_dict())
        except Exception as e:
            print(f"[Devices] Error reading devices from Firestore: {e}")

    # Fallback to simulated device info if Firestore query returned empty
    if not devices:
        devices = [
            {
                "device_id": f"ESP32-BIO-{current_user.id[:6].upper()}",
                "device_name": "AstroVitals ESP32 Bio-Wearable",
                "owner_user_id": current_user.id,
                "owner_astronaut_name": current_user.full_name,
                "firmware_version": "1.0.0-esp32",
                "status": "online",
                "last_seen": datetime.now(timezone.utc).isoformat(),
                "battery_pct": 98,
                "wifi_rssi": -48,
            }
        ]

    return {
        "total": len(devices),
        "devices": devices,
    }


@router.delete("/{device_id}")
def unregister_device(device_id: str, current_user: User = Depends(get_current_user)):
    """Unregister and release a bio-telemetry wearable."""
    fs_db = get_firestore_db()
    if fs_db is not None:
        try:
            doc_ref = fs_db.collection("devices").document(device_id)
            doc = doc_ref.get()
            if doc.exists:
                doc_dict = doc.to_dict()
                if doc_dict.get("owner_user_id") != current_user.id and not is_admin(current_user.email):
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to delete this device.")
                doc_ref.update({"status": "offline", "unregistered_at": datetime.now(timezone.utc).isoformat()})
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Devices] Error deleting device: {e}")

    return {
        "status": "success",
        "message": f"Device {device_id} released from astronaut profile.",
    }
