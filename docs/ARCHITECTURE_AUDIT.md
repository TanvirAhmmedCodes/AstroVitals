# AstroVitals Architecture Audit - NASA Space Apps Challenge 2026

Author: MD Tanvir Ahmmed and Team Orbitrix
Challenge: Challenge 5 (Health Monitoring Software for Astronauts)
Baseline Date: September 2026

## 1. Executive Summary

This audit evaluates the existing AstroVitals repository against the layered spine architecture defined in the NASA Space Apps Shared Architecture framework.

The core principle:
- Frontend: Never touches external APIs directly.
- API: Reads local cache/fixtures only during demos.
- Agents: Retrieve, orchestrate, explain. Never compute numbers.
- MCP: Standard tool interface between agents and scientific data.
- Compute: Pure deterministic science isolated in a tested module.
- Acquire: Runs pre-event or safely falls back (Live -> Cache -> Fixture).

AstroVitals will not be rebuilt from scratch. It is upgraded by establishing physical boundaries, adding the missing offline safety net, harmonizing multi-subject spaceflight datasets, documenting the ESP32 hardware telemetry stack, and publishing governance files.

---

## 2. Layer-by-Layer Architecture Audit

### Layer 1: Frontend (Static, Offline Capable)
- PDF Specification: MapLibre GL / Three.js / dashboard + service worker cache. Zero direct external API calls. Offline capable.
- AstroVitals Status: ALREADY PRESENT with MINOR GAPS.
- Current Implementation:
  - Built with React 19, Vite, Tailwind CSS, Lucide icons, Framer Motion, and Recharts.
  - Deployed on Vercel.
  - Service worker configured in `frontend/public/sw.js`.
  - Local proxying through `frontend/src/lib/api.js` pointing to backend API.
- Gap Analysis:
  - Figures in the UI do not yet display provenance indicators (live vs cache vs fixture).
  - No slide-out drawer exists for judges to inspect the raw tool JSON and dataset citation behind a displayed number.
- Planned Upgrade:
  - Add `ProvenanceBadge` component next to real-time vitals and risk scores.
  - Add `ProvenanceDrawer` modal/slide-over displaying the underlying dataset ID, source URL, fetch timestamp, and raw payload.

### Layer 2: App API (FastAPI)
- PDF Specification: FastAPI application serving REST and real-time streaming endpoints. Reads local cache and committed fixtures during demos.
- AstroVitals Status: ALREADY PRESENT with BOUNDARY GAPS.
- Current Implementation:
  - Robust FastAPI server (`backend/main.py`) with 13 modular routers.
  - SQLite database (`backend/database.py`) and Pydantic schemas.
  - Deployed on Render with CORS, rate limiting, and HTTP HEAD handlers.
- Gap Analysis:
  - External endpoints (`backend/routers/external.py`, `nasa_service.py`, `iss_tracker.py`) make direct HTTP requests without a standardized live-cache-fixture pipeline.
  - When `OFFLINE=1` is passed, the server does not enforce fixture-only operation.
  - Live vitals SSE generator (`backend/services/sse_manager.py`) streams only when wearable or script pushes data; it lacks a deterministic fixture replay mode for offline video recording.
- Planned Upgrade:
  - Integrate `safe_fetch.py` across all external data services.
  - Implement fixture replay loop for `/api/v1/vitals/live` (SSE) and `/api/v1/vitals/stream` (WebSocket) consuming `demo_fixtures/vitals.json`.

### Layer 3: Deterministic Science & Compute Boundary
- PDF Specification: Pure, tested module (`compute/`) outside the LLM. Any function that computes statistics, anomaly scores, slopes, p-values, geometry, or distance lives here. The LLM calls it as a tool and never performs arithmetic.
- AstroVitals Status: PARTIALLY PRESENT (Unseparated).
- Current Implementation:
  - Anomaly scoring and risk calculations were scattered between `backend/services/model_registry.py`, `backend/services/radiation_model.py`, and `backend/routers/risk.py`.
- Gap Analysis:
  - No isolated `backend/compute/` module.
  - No pure Mann-Kendall or Theil-Sen statistical trend tests for biomarker evolution.
  - No pure Heart Rate Variability (HRV) time-domain mathematical functions (SDNN, RMSSD, pNN50).
- Planned Upgrade:
  - Create `backend/compute/`:
    - `trend.py`: Deterministic Mann-Kendall test and Theil-Sen slope.
    - `vitals_math.py`: Deterministic HRV calculations and personal 30-day baseline deviation scoring.
    - `radiation_math.py`: Cumulative dose summation, SAA geospatial checking, and NASA-STD-3001 threshold comparisons.
  - Add comprehensive automated unit tests in `backend/tests/test_compute.py`.

### Layer 4: Agent Orchestrator & Provenance Guard
- PDF Specification: Plain state machine agent loop. Cap of 6 steps. Calls tools, chains steps, summarizes. Never computes. Provenance gate blocks claims lacking source URL and dataset ID.
- AstroVitals Status: PARTIALLY PRESENT.
- Current Implementation:
  - `backend/services/gemini_service.py` provides mission companion chat with formatted telemetry context.
- Gap Analysis:
  - No formal tool execution loop with function schemas.
  - No strict step cap to prevent runaway token burn.
  - No automated provenance guard (`cite_check`) blocking ungrounded numeric claims.
- Planned Upgrade:
  - Implement `backend/services/agent_orchestrator.py` with a 4-stage pipeline: Retrieve -> Call Deterministic Compute -> Explain -> Provenance Guard.
  - Implement `cite_check` gate rejecting any response containing unverified claims.

### Layer 5: Model Context Protocol (MCP) Server
- PDF Specification: Custom FastMCP server exposing data acquisition, deterministic compute, and citation checking to coding agents and orchestrators.
- AstroVitals Status: MISSING.
- Current Implementation: None.
- Gap Analysis:
  - No MCP server exists in the repository.
- Planned Upgrade:
  - Create `mcp_server.py` exposing 5 standardized tools:
    1. `vitals_anomaly_check`
    2. `osdr_search`
    3. `ntrs_search`
    4. `trend_test`
    5. `cite_check`
  - Write explicit docstrings detailing input schemas, units, and return dictionaries.

### Layer 6: Data Acquisition & Offline Demo Safety Net
- PDF Specification: Safe fetch wrapper (live -> cache -> fixture). Pre-fetched demo inputs in `cache/` and committed `demo_fixtures/`. Support for `OFFLINE=1` environment variable.
- AstroVitals Status: PARTIALLY PRESENT.
- Current Implementation:
  - Ad-hoc in-memory caching in `nasa_service.py` and `iss_tracker.py`.
- Gap Analysis:
  - No committed fixture directory (`demo_fixtures/`).
  - Network failure during a live presentation causes degraded UI.
- Planned Upgrade:
  - Create `backend/services/safe_fetch.py`.
  - Populate `demo_fixtures/` with:
    - `vitals.json`: 600-frame astronaut vital telemetry sequence.
    - `iss_position.json`: Authentic ISS orbital tracking payload.
    - `apod.json`: NASA Astronomy Picture of the Day payload.
    - `osdr_studies.json`: Key NASA OSDR spaceflight accessions.
    - `ntrs_citations.json`: NASA HRP and space medicine reference literature.

### Layer 7: Machine Learning Models & Dataset Generalization
- PDF Specification: Scientifically grounded, honest validation metrics. Prevent data leakage via subject-level splitting.
- AstroVitals Status: PRESENT BUT IMPAIRED (Small sample size n=4, negative R-squared).
- Current Implementation:
  - Models trained strictly on Inspiration4 (4 subjects, 55 timepoints) with random row-level split.
  - Negative R-squared disclosed in `docs/MODEL_README.md`.
- Gap Analysis:
  - 4 subjects cannot support statistical generalization across diverse spaceflight stressors.
  - Row-level train-test split allows subject data leakage across train and test folds.
- Planned Upgrade:
  - Ingest and harmonize multi-subject spaceflight and ground analog datasets:
    - NASA OSDR Inspiration4 (OSD-569, OSD-570, OSD-571, OSD-575: 4 crew members).
    - NASA Twin Study (OSD-294: longitudinal flight subject Scott Kelly and ground control Mark Kelly).
    - NASA HRP Bed Rest 70-Day Head-Down Tilt Analog (16 analog subjects).
    - ESA Concordia Antarctic Isolation Analog (14 analog subjects).
  - Document harmonization in `docs/DATASET_HARMONIZATION.md`.
  - Enforce subject-level `GroupKFold` cross-validation.
  - Engineer physiological interaction features (NLR, inflammatory indices, baseline deltas).
  - Retrain models and record honest metrics in `models/metrics.json` and `docs/MODEL_README.md`.

### Layer 8: Hardware Telemetry Stack
- PDF & Challenge Specification: Full documentation of sensor physics, pinouts, firmware, and telemetry ingestion.
- AstroVitals Status: PARTIALLY PRESENT.
- Current Implementation:
  - `backend/routers/devices.py` and `backend/routers/ingest.py` accept telemetry.
- Gap Analysis:
  - Missing standalone Arduino/ESP32 firmware file in the repo.
  - Missing ASCII wiring schematic and pinout guide.
  - Sensor physics (MAX30102 motion artifacts, MLX90614 field of view, MPU-6050 motion rejection, haptic alert driver) not documented.
- Planned Upgrade:
  - Create `firmware/astrovitals_esp32.ino`.
  - Create `docs/HARDWARE.md` and update `README.md` with complete wiring, power budget, and sensor physics.

### Layer 9: Governance and Submission Files
- PDF Specification: Apache-2.0 license, coding agent instructions (`AGENTS.md`), AI use disclosure (`docs/AI_USE.md`), and judging checklist alignment.
- AstroVitals Status: PARTIALLY PRESENT.
- Current Implementation:
  - MIT License in root.
  - No agent governance files.
- Planned Upgrade:
  - Update `LICENSE` to Apache-2.0.
  - Create `AGENTS.md` (consolidating project non-negotiables and agent boundaries).
  - Create `docs/AI_USE.md` documenting Antigravity, model family, prompts, and team human engineering.
  - Map each NASA judging criterion in `README.md` with one clear sentence.

---

## 3. Summary of Decisions: What to Build vs What to Leave Alone

### What We Will Build
1. `backend/compute/` package with deterministic math and statistical tests.
2. `backend/services/safe_fetch.py` and committed `demo_fixtures/`.
3. Provenance validation engine in backend and `ProvenanceBadge`/`ProvenanceDrawer` in React frontend.
4. Harmonized multi-subject training pipeline with subject-level splitting (`GroupKFold`).
5. Standalone MCP server `mcp_server.py` and agent state machine orchestrator.
6. ESP32 Arduino firmware `firmware/astrovitals_esp32.ino` and hardware guide `docs/HARDWARE.md`.
7. Governance rulebook (`AGENTS.md`), AI disclosure (`docs/AI_USE.md`), and Apache-2.0 license.
8. Complete removal of all em-dashes and en-dashes across the repository.

### What We Will Leave Alone
1. Deployment configurations: `Procfile`, `render.yaml`, `frontend/vercel.json`, `vite.config.js` build rules, and `package.json` scripts remain completely intact.
2. Core backend architecture: The 13 existing FastAPI routers remain active and functional; new features plug cleanly into existing services.
3. Core frontend visual design: The cinematic space UI, navigation, PWA service worker, audio design, and page layouts are preserved and enhanced with provenance drawers.
4. Database schema: SQLite database model integrity is maintained for backwards compatibility.
