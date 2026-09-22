# Consolidation Audit

This document records the repository-wide audit of duplicate and near-duplicate files, overlapping documentation, redundant test scripts, and multi-location deployment configs across AstroVitals.

## Consolidation Matrix

| Group | Files | Purpose | Decision | New / Target File |
|---|---|---|---|---|
| **Agent Rules** | `AGENT.md`, `AGENTS.md` | Coding guidelines, project non-negotiables, runtime capabilities, and agent boundaries | **MERGE** | `AGENTS.md` (combines `## Project Rules` and `## Agent Boundaries`; deletes `AGENT.md`) |
| **Render Blueprint** | `render.yaml`, `backend/render.yaml` | Infrastructure blueprint for Render deployment | **CONSOLIDATE** | `render.yaml` (root blueprint with `rootDir: backend` is active; deletes stale `backend/render.yaml`) |
| **Process Procfile** | `Procfile`, `backend/Procfile` | Web process start command | **CONSOLIDATE** | `backend/Procfile` (active for `rootDir: backend`; root `Procfile` delegates via `cd backend`) |
| **Python Requirements** | `requirements.txt`, `backend/requirements.txt` | Python package dependencies for backend API and ML models | **CONSOLIDATE** | `backend/requirements.txt` (canonical package list); root `requirements.txt` uses `-r backend/requirements.txt` |
| **Frontend Boilerplate** | `frontend/README.md`, `README.md` | Project and workspace documentation | **DELETE STALE** | `README.md` (canonical root docs; deletes unneeded Vite boilerplate `frontend/README.md`) |
| **Radiation Limits Doc** | `docs/RADIATION_LIMITS.md`, `docs/HRP_REFERENCE.md`, `backend/compute/radiation_math.py` | Space radiation career and acute thresholds | **MERGE** | `docs/HRP_REFERENCE.md` & `backend/compute/radiation_math.py` (deletes 5-line stub `docs/RADIATION_LIMITS.md`) |
| **Legacy Phase Tests** | `backend/test_phase1.py`, `backend/test_phase2.py`, `backend/test_phase5_auth.py`, `backend/test_phase5_fixes.py`, `backend/test_all_fixes.py`, `backend/test_sim.py` | Ad-hoc phase verification scripts with redundant endpoint and auth checks | **MERGE** | `backend/test_suite.py` (unified test suite grouped by section; deletes the 6 ad-hoc test files) |
| **Production Unit Tests** | `backend/tests/test_compute_and_provenance.py`, `backend/tests/test_model_inference_and_split.py` | Formal pytest/unittest verification for deterministic math, provenance, and ML models | **KEEP BOTH** | Kept intact in `backend/tests/` (distinct test domains) |
| **Hardware Documentation** | `docs/HARDWARE.md`, `README.md` (hardware section) | ESP32 schematic, sensor pinout, I2C bus wiring, and BOM | **SINGLE SOURCE** | `docs/HARDWARE.md` (single source of truth for pin map; README summarizes and links) |
| **Model Metrics & CV** | `docs/MODEL_README.md`, `README.md` (model section) | Machine learning methodology, GroupKFold validation, and evaluation metrics | **SINGLE SOURCE** | `docs/MODEL_README.md` (single source of truth for benchmark metrics; README links) |
| **API Endpoints & Env** | `DEPLOYMENT.md`, `README.md` | Deployment environment variables, cloud provisioning, and setup guides | **KEEP BOTH** | Genuinely different audiences (`README.md` for judges/public, `DEPLOYMENT.md` for DevOps/cloud) |
| **Developer Guidelines** | `docs/DEVELOPMENT.md`, `README.md` | Contributor setup, coding standards, and repository workflows | **KEEP BOTH** | Genuinely different audiences (`README.md` for entry/overview, `docs/DEVELOPMENT.md` for developers) |
| **Skill Definitions** | `.agent/skills/astronaut-health-monitoring/SKILL.md` | Agent skill definition for physiological telemetry monitoring | **KEEP** | Single canonical skill file under `.agent/skills/` |
| **License** | `LICENSE` | Apache License 2.0 terms | **KEEP** | Standard legal root file; never merged |
