"""Safe acquisition wrapper implementing the NASA Space Apps layered architecture.

Tries live network fetch first, falls back to disk cache second, and falls back
to a committed demo fixture last. When OFFLINE=1 is set, it immediately uses
local fixtures without attempting network calls.
"""

import json
import os
import pathlib
import hashlib
from typing import Tuple, Dict, Any, Optional
import requests

# Resolve root directory for cache and demo_fixtures
CURRENT_FILE = pathlib.Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent
ROOT_DIR = BACKEND_DIR.parent

CACHE_DIR = ROOT_DIR / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

FIXTURES_DIR = ROOT_DIR / "demo_fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

OFFLINE = os.getenv("OFFLINE", "0").strip() == "1"


def get_cache_key(url: str, params: Optional[Dict[str, Any]] = None, name: Optional[str] = None) -> str:
    """Generate semantic or hashed cache key."""
    if name:
        return name
    clean_params = sorted((params or {}).items(), key=lambda x: str(x[0]))
    raw = f"{url}_{clean_params}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def fetch_json(
    url: str,
    params: Optional[Dict[str, Any]] = None,
    name: Optional[str] = None,
    timeout: float = 10.0,
    headers: Optional[Dict[str, str]] = None,
    fallback_data: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], str]:
    """Fetch JSON with safe fallback chain: Live -> Cache -> Committed Fixture -> Default.

    Returns tuple of (data_dict, mode_string) where mode is 'live', 'cache', or 'fixture'.
    Never raises an uncaught exception during a demonstration.
    """
    key = get_cache_key(url, params, name)
    cached_path = CACHE_DIR / f"{key}.json"
    fixture_path = FIXTURES_DIR / f"{key}.json"

    # Check OFFLINE environment override
    is_offline = OFFLINE or os.getenv("OFFLINE", "0").strip() == "1"

    # 1. Attempt live request if online
    if not is_offline:
        try:
            req_headers = {"User-Agent": "AstroVitals/1.0 (NASA Space Apps 2026)"}
            if headers:
                req_headers.update(headers)
            r = requests.get(url, params=params, headers=req_headers, timeout=timeout)
            if r.status_code == 200:
                data = r.json()
                try:
                    cached_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
                except Exception as write_err:
                    print(f"[SafeFetch] Cache write notice for {key}: {write_err}")
                return data, "live"
        except Exception as live_err:
            print(f"[SafeFetch] Live fetch failed for {url} ({live_err}). Falling back.")

    # 2. Check cached file on disk
    if cached_path.exists():
        try:
            cached_data = json.loads(cached_path.read_text(encoding="utf-8"))
            return cached_data, "cache"
        except Exception as read_err:
            print(f"[SafeFetch] Cache read notice for {key}: {read_err}")

    # 3. Check committed fixture
    if fixture_path.exists():
        try:
            fixture_data = json.loads(fixture_path.read_text(encoding="utf-8"))
            return fixture_data, "fixture"
        except Exception as fix_err:
            print(f"[SafeFetch] Fixture read notice for {key}: {fix_err}")

    # 4. Built-in emergency fallback if provided
    if fallback_data is not None:
        return fallback_data, "fixture"

    raise FileNotFoundError(f"No live, cache, or fixture data available for key: {key}")
