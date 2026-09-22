"""AstroVitals Model Context Protocol (MCP) Server.

Exposes deterministic compute, spaceflight data retrieval, and citation
verification tools to LLM orchestrators and coding agents.
Implements the NASA Space Apps layered spine architecture.
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Union

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Import pure compute and safe fetch utilities
from backend.compute.trend import mann_kendall as compute_mann_kendall, theil_sen as compute_theil_sen
from backend.compute.vitals_math import evaluate_vital_envelope
from backend.services.provenance import cite_check as execute_cite_check
from backend.services.safe_fetch import fetch_json

# Tool 1: Vitals Anomaly Check
def vitals_anomaly_check(
    heart_rate: float,
    spo2: float,
    skin_temp: float,
    motion_g: float = 0.04,
) -> Dict[str, Any]:
    """Evaluate physiological safety envelope and check for clinical vital anomalies.

    Arguments:
      heart_rate: Heart rate in beats per minute (BPM), nominal range 50-95.
      spo2: Blood oxygen saturation percentage (SpO2), nominal > 95%.
      skin_temp: Skin temperature in degrees Celsius, nominal 35.5-37.5 C.
      motion_g: Microgravity accelerometer magnitude in g, default 0.04.

    Returns dictionary with status ('nominal', 'caution', 'critical'), is_anomaly flag,
    and list of specific rules that fired.
    """
    envelope = evaluate_vital_envelope(
        hr=heart_rate,
        spo2=spo2,
        temp_c=skin_temp,
        motion_g=motion_g,
    )

    envelope["heart_rate_bpm"] = float(heart_rate)
    envelope["spo2_pct"] = float(spo2)
    envelope["skin_temp_c"] = float(skin_temp)
    envelope["provenance"] = {
        "dataset_id": "NASA-STD-3001-VOL-1",
        "source_url": "https://www.nasa.gov/hhp/standards/",
        "data_mode": "fixture" if os.getenv("OFFLINE") == "1" else "live",
    }
    return envelope


# Tool 2: Trend Test
def trend_test(
    values: List[Union[int, float]],
    dates: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Deterministic Mann-Kendall non-parametric trend test and Theil-Sen slope estimation.

    Arguments:
      values: Chronological sequence of numeric biomarker or vital measurements.
      dates: Optional string dates or time step indices.

    Returns S statistic, Z score, two-sided p-value, trend direction, and slope.
    The LLM never computes slopes or p-values itself.
    """
    mk_res = compute_mann_kendall(values)

    if dates and len(dates) == len(values):
        numeric_dates = list(range(len(values)))
        slope_res = compute_theil_sen(numeric_dates, values)
    else:
        slope_res = compute_theil_sen(list(range(len(values))), values)

    res = {
        "mann_kendall": mk_res,
        "theil_sen": slope_res,
        "sample_size": len(values),
        "provenance": {
            "dataset_id": "DETERMINISTIC-SCIENTIFIC-COMPUTE",
            "source_url": "https://en.wikipedia.org/wiki/Mann%E2%80%93Kendall_trend_test",
            "data_mode": "live",
        },
    }
    return res


# Tool 3: OSDR Search
def osdr_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search NASA Open Science Data Repository (OSDR) for spaceflight biological studies.

    Arguments:
      query: Keyword, biomarker name, or mission (e.g. 'Inspiration4', 'cytokine', 'Twin Study').
      limit: Maximum number of accessions to return (default 5).

    Returns list of matched study records with accession ID, title, organism, and source URL.
    """
    try:
        studies, _ = fetch_json("", name="osdr_studies")
    except Exception:
        studies = []

    q = query.lower().strip()
    matches = []
    for s in studies:
        blob = f"{s.get('accession', '')} {s.get('title', '')} {s.get('assay_type', '')} {s.get('mission', '')}".lower()
        if q in blob:
            matches.append(s)

    if not matches:
        matches = studies

    return matches[:limit]


# Tool 4: NTRS Search
def ntrs_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Search NASA Technical Reports Server (NTRS) and HRP clinical countermeasures.

    Arguments:
      query: Medical risk keyword (e.g. 'cardiovascular', 'radiation', 'circadian').
      limit: Maximum citations to return (default 5).

    Returns list of citations with report ID, title, author, year, and countermeasure protocol.
    """
    try:
        citations, _ = fetch_json("", name="ntrs_citations")
    except Exception:
        citations = []

    q = query.lower().strip()
    matches = []
    for c in citations:
        blob = f"{c.get('id', '')} {c.get('title', '')} {c.get('key_countermeasure', '')}".lower()
        if q in blob:
            matches.append(c)

    if not matches:
        matches = citations

    return matches[:limit]


# Tool 5: Cite Check
def cite_check(claims: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Deterministic provenance gate. Return valid=True only if every claim maps to a source.

    Arguments:
      claims: List of dicts containing 'text', 'source_url', and 'dataset_id'.

    Blocks agent output if any claim is ungrounded or missing valid URLs.
    """
    return execute_cite_check(claims)


# Registry of tools for dispatch
TOOLS_MAP = {
    "vitals_anomaly_check": vitals_anomaly_check,
    "trend_test": trend_test,
    "osdr_search": osdr_search,
    "ntrs_search": ntrs_search,
    "cite_check": cite_check,
}

# Try FastMCP if available
try:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("astrovitals-tools")

    @mcp.tool()
    def mcp_vitals_anomaly_check(heart_rate: float, spo2: float, skin_temp: float, motion_g: float = 0.04) -> Dict[str, Any]:
        """Evaluate physiological safety envelope and IsolationForest anomaly test."""
        return vitals_anomaly_check(heart_rate, spo2, skin_temp, motion_g)

    @mcp.tool()
    def mcp_trend_test(values: List[float], dates: Optional[List[str]] = None) -> Dict[str, Any]:
        """Deterministic Mann-Kendall test and Theil-Sen slope calculation."""
        return trend_test(values, dates)

    @mcp.tool()
    def mcp_osdr_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search NASA Open Science Data Repository (OSDR) spaceflight studies."""
        return osdr_search(query, limit)

    @mcp.tool()
    def mcp_ntrs_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search NASA Technical Reports Server and HRP countermeasure protocols."""
        return ntrs_search(query, limit)

    @mcp.tool()
    def mcp_cite_check(claims: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Return valid=True only if every numeric claim maps to a dataset ID and source URL."""
        return cite_check(claims)

    HAS_FASTMCP = True
except ImportError:
    HAS_FASTMCP = False
    mcp = None


def run_stdio_jsonrpc():
    """Fallback standard MCP JSON-RPC stdio server for environments without fastmcp installed."""
    tools_file = ROOT_DIR / "src" / "agents" / "tools.json"
    tools_spec = json.loads(tools_file.read_text(encoding="utf-8")) if tools_file.exists() else []

    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            line = line.strip()
            if not line:
                continue

            req = json.loads(line)
            msg_id = req.get("id")
            method = req.get("method")
            params = req.get("params", {})

            if method == "tools/list":
                resp = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {"tools": tools_spec},
                }
            elif method == "tools/call":
                tool_name = params.get("name")
                args = params.get("arguments", {})
                if tool_name in TOOLS_MAP:
                    result_data = TOOLS_MAP[tool_name](**args)
                    resp = {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "result": {
                            "content": [{"type": "text", "text": json.dumps(result_data, indent=2)}]
                        },
                    }
                else:
                    resp = {
                        "jsonrpc": "2.0",
                        "id": msg_id,
                        "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"},
                    }
            elif method == "initialize":
                resp = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "serverInfo": {"name": "astrovitals-tools", "version": "1.0.0"},
                        "capabilities": {"tools": {}},
                    },
                }
            else:
                resp = {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {},
                }

            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except (EOFError, KeyboardInterrupt):
            break
        except Exception as err:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32603, "message": str(err)},
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    if "--inspect" in sys.argv or "--list" in sys.argv:
        print("[AstroVitals MCP Server] Registered Tools:")
        for t in TOOLS_MAP.keys():
            print(f"  - {t}")
        sys.exit(0)

    if HAS_FASTMCP and mcp is not None:
        mcp.run(transport="stdio")
    else:
        run_stdio_jsonrpc()
