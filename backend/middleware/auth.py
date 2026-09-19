"""AstroVitals Neuro-Shield — Authentication & Role Middleware.

Enforces JWT bearer authentication and restricts admin endpoints
exclusively to MD Tanvir Ahmmed (tanvirahmmed13579@gmail.com).

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

try:
    from database import get_db, User
    from services.auth_service import decode_token, is_admin, ADMIN_EMAIL
except ImportError:
    from backend.database import get_db, User
    from backend.services.auth_service import decode_token, is_admin, ADMIN_EMAIL

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT bearer token and return active authenticated user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mission access credentials missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mission access token expired or signature invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
        )

    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active",
        )

    if user.suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Mission console access suspended: {user.suspended_reason or 'Contact mission control.'}",
        )

    # Update last active timestamp
    try:
        user.last_active = datetime.now(timezone.utc)
        # Store partial IP if available from client request
        client_ip = request.client.host if request.client else "127.0.0.1"
        parts = client_ip.split(".")
        if len(parts) == 4:
            user.last_ip = f"{parts[0]}.{parts[1]}.x.x"
        else:
            user.last_ip = client_ip
        db.commit()
    except Exception:
        db.rollback()

    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Strictly ensure the authenticated user is the designated mission administrator."""
    if not is_admin(current_user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Restricted to Mission Administrator (MD Tanvir Ahmmed)",
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Retrieve user if token present and valid, without throwing on anonymous requests."""
    if not credentials or not credentials.credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
