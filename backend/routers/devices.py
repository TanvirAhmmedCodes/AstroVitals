"""AstroVitals Neuro-Shield - ESP32 Wearable Device Registration Router.

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


class DeviceAlertCommand(BaseModel):
    device_id: str = Field(..., description="Target wearable identifier, e.g. esp32-orbital-hub-01")
    alert_level: str = Field("warning", description="nominal, caution, warning, or critical")
    haptic_pattern: str = Field("5-pulse", description="5-pulse, double-tap, or off")
    display_message: str = Field("GROUND COMMAND ALERT", description="HUD alert text to render on SSD1306")


# In-memory alert dispatch buffer for low-latency delivery to ESP32 wearables
_pending_device_alerts: Dict[str, Dict[str, Any]] = {}


def queue_device_alert(device_id: str, alert_data: Dict[str, Any]):
    """Queue an alert command for an ESP32 hardware device."""
    _pending_device_alerts[device_id] = alert_data


def pop_pending_alert(device_id: str) -> Optional[str]:
    """Retrieve and clear any pending advisory alert for the device."""
    alert = _pending_device_alerts.pop(device_id, None)
    if alert:
        return alert.get("display_message") or "GROUND COMMAND ALERT"
    return None


@router.post("/alert")
def send_device_alert(
    command: DeviceAlertCommand,
    current_user: User = Depends(get_current_user),
):
    """Dispatch an advisory haptic and LED alert command to an astronaut wearable device."""
    alert_data = {
        "device_id": command.device_id,
        "alert_level": command.alert_level,
        "haptic_pattern": command.haptic_pattern,
        "display_message": command.display_message,
        "dispatched_by": current_user.email,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }
    queue_device_alert(command.device_id, alert_data)

    # Also notify via Firestore if available
    fs_db = get_firestore_db()
    if fs_db is not None:
        try:
            fs_db.collection("devices").document(command.device_id).set({
                "pending_alert": alert_data,
                "last_alert_at": alert_data["timestamp_utc"],
            }, merge=True)
        except Exception as e:
            print(f"[Devices] Warning updating pending alert in Firestore: {e}")

    return {
        "status": "dispatched",
        **alert_data,
    }


@router.get("/{device_id}/pending-alert")
def get_pending_alert(device_id: str):
    """Endpoint for ESP32 devices to poll for pending ground command alerts."""
    msg = pop_pending_alert(device_id)
    return {
        "device_id": device_id,
        "has_alert": msg is not None,
        "advisory_alert": msg,
    }


@router.get("/{device_id}/status")
def get_device_status(device_id: str):
    """Retrieve status, battery, and Wi-Fi telemetry for an ESP32 wearable unit."""
    fs_db = get_firestore_db()
    if fs_db is not None:
        try:
            doc = fs_db.collection("devices").document(device_id).get()
            if doc.exists:
                data = doc.to_dict()
                # Compute live heartbeat freshness watchdog (within last 25 seconds)
                is_connected = False
                last_seen_str = data.get("last_seen")
                if last_seen_str:
                    try:
                        last_seen_dt = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
                        now_dt = datetime.now(timezone.utc)
                        delta_sec = (now_dt - last_seen_dt).total_seconds()
                        is_connected = (delta_sec <= 25.0)
                    except Exception:
                        pass

                data["is_connected"] = is_connected
                if not is_connected and data.get("status") == "online":
                    data["status"] = "offline"

                if "sensors" not in data:
                    data["sensors"] = {
                        "max30102": False,
                        "ds18b20": False,
                        "mpu6050": False,
                        "ssd1306": False,
                    }
                return data
        except Exception as e:
            print(f"[Devices] Error reading status from Firestore: {e}")

    # Fallback status
    return {
        "device_id": device_id,
        "status": "standby",
        "is_connected": False,
        "last_seen": datetime.now(timezone.utc).isoformat(),
        "battery_pct": 98.0,
        "wifi_rssi": -48.0,
        "wifi_ssid": "Nominal Wi-Fi",
        "firmware_version": "2.3.0-ds18b20-wifi",
        "sensors": {
            "max30102": False,
            "ds18b20": False,
            "mpu6050": False,
            "ssd1306": False,
        },
        "is_hardware_reading": False,
    }

