"""AstroVitals Neuro-Shield — Authentication & Identity Router.

Manages registration, login, JWT token issuance, email verification,
password recovery, and profile configuration.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

try:
    from config import settings
    from database import get_db, User, LoginHistory, AstronautProfile
    from services.auth_service import (
        hash_password,
        verify_password,
        create_access_token,
        is_admin,
        generate_verification_token,
        generate_reset_token,
    )
    from services.email_service import email_service
    from services.firebase_service import sync_user_to_firestore, sync_mission_crew
    from middleware.auth import get_current_user
except ImportError:
    from backend.config import settings
    from backend.database import get_db, User, LoginHistory, AstronautProfile
    from backend.services.auth_service import (
        hash_password,
        verify_password,
        create_access_token,
        is_admin,
        generate_verification_token,
        generate_reset_token,
    )
    from backend.services.email_service import email_service
    from backend.services.firebase_service import sync_user_to_firestore, sync_mission_crew
    from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# --- Schemas ---

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=64, description="Full legal or astronaut name")
    join_crew: Optional[bool] = Field(False, description="Register as active crew member")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=64)
    timezone: Optional[str] = None
    language: Optional[str] = None
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


def _serialize_user(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "astronaut_id": user.astronaut_id,
        "email_verified": user.email_verified,
        "avatar_url": user.avatar_url,
        "timezone": user.timezone,
        "language": user.language,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "password_change_required": bool(getattr(user, "password_change_required", False)),
        "is_admin": is_admin(user.email),
    }


def _validate_full_name(name: str):
    name = name.strip()
    if not re.match(r"^[A-Za-z\s\-'.]+$", name):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name can only contain letters, spaces, hyphens, and apostrophes.",
        )


# --- Endpoints ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    data: RegisterRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Open public registration.

    Single admin rule: tanvirahmmed13579@gmail.com is auto-assigned 'admin'.
    All other users receive the 'observer' role.
    """
    _validate_full_name(data.full_name)
    clean_email = data.email.strip().lower()

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account is already registered with this email address.",
        )

    # Automatic role assignment
    assigned_role = "admin" if is_admin(clean_email) else "observer"
    verify_token = generate_verification_token()
    user_id = str(uuid.uuid4())

    new_user = User(
        id=user_id,
        email=clean_email,
        password_hash=hash_password(data.password),
        full_name=data.full_name.strip(),
        role=assigned_role,
        email_verified=True if is_admin(clean_email) else False,
        verification_token=verify_token if not is_admin(clean_email) else None,
        password_change_required=False,
        created_at=datetime.now(timezone.utc),
        last_login=datetime.now(timezone.utc),
    )

    # Dynamically create astronaut profile for every registered user
    existing_profile = db.query(AstronautProfile).filter(AstronautProfile.id == user_id).first()
    if not existing_profile:
        crew_count = db.query(AstronautProfile).count()
        role_map = [
            ("Commander", "CDR"),
            ("Flight Engineer", "MS1"),
            ("Science Officer", "MS2"),
            ("Mission Specialist", "MS3"),
        ]
        if assigned_role == "admin":
            role_title, callsign = "Commander", "CDR"
        elif crew_count < len(role_map):
            role_title, callsign = role_map[crew_count]
        else:
            role_title, callsign = "Mission Specialist", f"MS{crew_count}"

        profile = AstronautProfile(
            id=user_id,
            name=data.full_name.strip(),
            role=role_title,
            callsign=callsign,
            mission_day_0=datetime.now(timezone.utc),
            user_id=user_id,
        )
        db.add(profile)
        new_user.astronaut_id = user_id

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Sync user and crew to Firestore real-time layer
    try:
        user_dict = _serialize_user(new_user)
        background_tasks.add_task(sync_user_to_firestore, user_dict)
        all_crew = [
            {
                "astronaut_id": p.id,
                "full_name": p.name,
                "role": p.role,
                "callsign": p.callsign,
                "health_score": 98.0,
            }
            for p in db.query(AstronautProfile).all()
        ]
        background_tasks.add_task(sync_mission_crew, all_crew)
    except Exception as e:
        print(f"[Auth] Enqueue Firestore sync warning: {e}")

    # Dispatch welcome & verification email
    base_url = str(request.base_url).rstrip("/")
    verify_link = f"{base_url}/verify-email/{verify_token}"
    email_service.send_welcome_email(new_user.email, new_user.full_name, verify_link)

    # Generate JWT token
    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    first_name = new_user.full_name.split()[0] if new_user.full_name else "Explorer"
    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": _serialize_user(new_user),
        "message": "Registration successful. Welcome to AstroVitals Neuro-Shield.",
        "welcome_message": f"Hi {first_name}! I'm Ori — your mission companion. Welcome aboard AstroVitals. I'll be right here whenever you need me. Tap the button to chat.",
        "is_new_user": True,
    }


@router.post("/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email, User.deleted_at.is_(None)).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or mission security key.",
        )

    if user.suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account suspended: {user.suspended_reason or 'Contact mission control.'}",
        )

    # Record login history (sanitized partial IP)
    client_ip = request.client.host if request.client else "127.0.0.1"
    parts = client_ip.split(".")
    partial_ip = f"{parts[0]}.{parts[1]}.x.x" if len(parts) == 4 else client_ip

    user.last_login = datetime.now(timezone.utc)
    user.last_ip = partial_ip

    history_entry = LoginHistory(
        user_id=user.id,
        ip_partial=partial_ip,
        user_agent=request.headers.get("user-agent", "Mission Console"),
        timestamp=datetime.now(timezone.utc),
    )
    db.add(history_entry)
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    return {
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "user": _serialize_user(user),
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Client clears token; server acknowledges session termination."""
    return {"status": "success", "message": "Mission session closed successfully."}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of current authenticated user."""
    return {"user": _serialize_user(current_user)}


@router.post("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user transmission channel via security token."""
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is invalid or has already been used.",
        )

    user.email_verified = True
    user.verification_token = None
    db.commit()

    return {"status": "verified", "message": "Mission email channel verified successfully."}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Generate and dispatch password reset security link."""
    user = db.query(User).filter(User.email == data.email.strip().lower(), User.deleted_at.is_(None)).first()
    if user:
        token = generate_reset_token()
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()

        # Determine client origin: prioritize Origin header, referer, or default to production Vercel frontend
        origin = request.headers.get("origin")
        if not origin and request.headers.get("referer"):
            from urllib.parse import urlparse
            ref = urlparse(request.headers.get("referer"))
            if ref.scheme and ref.netloc:
                origin = f"{ref.scheme}://{ref.netloc}"

        # If no client origin or caller is backend itself, default to production Vercel frontend
        if not origin or "8080" in origin or "8000" in origin or "onrender.com" in origin:
            origin = "https://astrovitals.vercel.app"

        origin = origin.rstrip("/")
        reset_link = f"{origin}/reset-password/{token}"
        print(f"[AUTH:RESET-LINK] Password reset requested for {user.email}: {reset_link}")
        email_service.send_password_reset(user.email, reset_link)
        return {
            "status": "dispatched",
            "message": "If this email is registered, recovery instructions have been sent.",
            "reset_link": reset_link,
            "token": token,
        }

    return {
        "status": "dispatched",
        "message": "If this email is registered, recovery instructions have been sent.",
        "reset_link": None,
        "token": None,
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset account password using valid reset token."""
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.reset_token == data.token).first()

    expires = user.reset_token_expires if user else None
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if not user or not expires or expires < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired or is invalid.",
        )

    user.password_hash = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"status": "success", "message": "Security key successfully updated. Please log in."}


@router.post("/resend-verification")
def resend_verification(data: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    """Resend email verification token."""
    user = db.query(User).filter(User.email == data.email.strip().lower(), User.deleted_at.is_(None)).first()
    if user and not user.email_verified:
        token = generate_verification_token()
        user.verification_token = token
        db.commit()

        base_url = str(request.base_url).rstrip("/")
        verify_link = f"{base_url}/verify-email/{token}"
        email_service.send_verification_email(user.email, verify_link)

    return {"status": "dispatched", "message": "Verification instructions have been resent."}


@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile information (name, timezone, language, avatar)."""
    if data.full_name:
        _validate_full_name(data.full_name)
        current_user.full_name = data.full_name.strip()
        # Also update linked astronaut profile name if exists
        if current_user.astronaut_id:
            profile = db.query(AstronautProfile).filter(AstronautProfile.id == current_user.astronaut_id).first()
            if profile:
                profile.name = current_user.full_name

    if data.timezone:
        current_user.timezone = data.timezone
    if data.language:
        current_user.language = data.language
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
        if current_user.astronaut_id:
            profile = db.query(AstronautProfile).filter(AstronautProfile.id == current_user.astronaut_id).first()
            if profile:
                profile.avatar_url = data.avatar_url

    db.commit()
    return {"status": "success", "user": _serialize_user(current_user)}


@router.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password after verifying existing password."""
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Existing password does not match records.",
        )

    current_user.password_hash = hash_password(data.new_password)
    current_user.password_change_required = False
    db.commit()
    return {"status": "success", "message": "Security key changed successfully.", "user": _serialize_user(current_user)}
