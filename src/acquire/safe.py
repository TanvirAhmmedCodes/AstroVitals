"""Safe data acquisition wrapper implementing the NASA Space Apps layered architecture.

Live first, disk cache second, committed demo fixture last. Never raises during a demo.
Supports OFFLINE=1 to enforce offline fixture replay mode.
"""

import json
import os
import pathlib
import hashlib
from typing import Tuple, Dict, Any, Optional
import requests

# Resolve repository root
ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent.parent
CACHE = ROOT_DIR / "cache"
CACHE.mkdir(exist_ok=True)
FIXTURES = ROOT_DIR / "demo_fixtures"
FIXTURES.mkdir(exist_ok=True)


def fetch_json(
    url: str,
    params: Optional[Dict[str, Any]] = None,
    name: Optional[str] = None,
    timeout: float = 25.0,
    headers: Optional[Dict[str, str]] = None,
) -> Tuple[Any, str]:
    """Live first, cache second, committed fixture last. Never raises during a demo.

    Returns:
        tuple: (data, source_label) where source_label is 'live', 'cache', or 'fixture'.
    """
    key = name or hashlib.md5(f"{url}{sorted((params or {}).items())}".encode("utf-8")).hexdigest()
    cached = CACHE / f"{key}.json"
    fixture = FIXTURES / f"{key}.json"

    is_offline = os.getenv("OFFLINE") == "1"

    # 1. Live network request when online
    if not is_offline and url:
        try:
            req_headers = {"User-Agent": "AstroVitals/1.0 (NASA Space Apps 2026)"}
            if headers:
                req_headers.update(headers)
            r = requests.get(url, params=params, headers=req_headers, timeout=timeout)
            if r.status_code == 200:
                data = r.json()
                try:
                    cached.write_text(json.dumps(data, indent=2), encoding="utf-8")
                except Exception as write_err:
                    print(f"[SafeFetch] Cache write notice for {key}: {write_err}")
                return data, "live"
        except Exception:
            pass

    # 2. Disk cache
    if cached.exists():
        try:
            return json.loads(cached.read_text(encoding="utf-8")), "cache"
        except Exception as read_err:
            print(f"[SafeFetch] Cache read notice for {key}: {read_err}")

    # 3. Committed demo fixture
    if fixture.exists():
        try:
            return json.loads(fixture.read_text(encoding="utf-8")), "fixture"
        except Exception as fix_err:
            print(f"[SafeFetch] Fixture read notice for {key}: {fix_err}")

    raise FileNotFoundError(f"No live, cache or fixture data for {key}")
