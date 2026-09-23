"""NASA Open Science Data Repository (OSDR) data acquisition module.
"""

from typing import List, Dict, Any, Tuple
from src.acquire.safe import fetch_json

OSDR_BASE = "https://osdr.nasa.gov/osdr/data"


def fetch_osdr_studies(query: str = "Inspiration4", limit: int = 5) -> Tuple[List[Dict[str, Any]], str]:
    """Retrieve spaceflight biological studies from NASA OSDR with offline fallback."""
    url = f"{OSDR_BASE}/osd/search"
    params = {"term": query, "size": limit}
    try:
        data, mode = fetch_json(url, params=params, name="osdr_studies")
        if isinstance(data, list):
            return data[:limit], mode
        return [], mode
    except Exception:
        data, mode = fetch_json("", name="osdr_studies")
        return data[:limit] if isinstance(data, list) else [], mode
