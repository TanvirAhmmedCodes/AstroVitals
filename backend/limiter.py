"""AstroVitals Neuro-Shield — API Rate Limiter.

Configures request throttling via slowapi for non-admin accounts.
Admin (tanvirahmmed13579@gmail.com) enjoys unlimited throughput.

Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def is_admin_request(request: Request) -> bool:
    """Return True if incoming request bears valid admin credentials."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            try:
                from services.auth_service import decode_token, is_admin
            except ImportError:
                from backend.services.auth_service import decode_token, is_admin
            payload = decode_token(token)
            if payload and is_admin(payload.get("email", "")):
                return True
        except Exception:
            pass
    return False

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"],
    headers_enabled=True,
)
