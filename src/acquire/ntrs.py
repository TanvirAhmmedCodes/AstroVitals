"""NASA Technical Reports Server (NTRS) and HRP clinical countermeasures fetcher.
"""

from typing import List, Dict, Any, Tuple
from src.acquire.safe import fetch_json

NTRS_SEARCH_URL = "https://ntrs.nasa.gov/api/citations/search"


def fetch_ntrs_citations(query: str = "cardiovascular", limit: int = 5) -> Tuple[List[Dict[str, Any]], str]:
    """Retrieve peer-reviewed NASA citations and countermeasures with offline fallback."""
    params = {"q": query}
    try:
        data, mode = fetch_json(NTRS_SEARCH_URL, params=params, name="ntrs_citations")
        if isinstance(data, list):
            return data[:limit], mode
        return [], mode
    except Exception:
        data, mode = fetch_json("", name="ntrs_citations")
        return data[:limit] if isinstance(data, list) else [], mode
