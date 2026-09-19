"""AstroVitals Neuro-Shield — Authentication & Token Service.

Provides secure password hashing via bcrypt, JWT token generation & verification,
single-admin role verification, and crypto-random security tokens.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

from datetime import datetime, timezone, timedelta
import logging
import secrets
from typing import Optional, Dict, Any
import bcrypt as bcrypt_lib
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

try:
    from config import settings
except ImportError:
    from backend.config import settings

ADMIN_EMAIL = settings.ADMIN_EMAIL.lower()


def is_admin(email: str) -> bool:
    """Check if the given email corresponds to the single verified mission administrator."""
    if not email:
        return False
    return email.strip().lower() == ADMIN_EMAIL


def hash_password(password: str) -> str:
    """Hash a plaintext password using native bcrypt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt_lib.gensalt(rounds=12)
    return bcrypt_lib.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        result = bcrypt_lib.checkpw(pw_bytes, hash_bytes)
        return result
    except Exception as e:
        logger.error(f"[AUTH] verify_password failed: {type(e).__name__}: {e}")
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": "astrovitals.app",
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_verification_token() -> str:
    """Generate a crypto-secure URL-safe token for email address verification."""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a crypto-secure URL-safe token for password resets."""
    return secrets.token_urlsafe(32)
