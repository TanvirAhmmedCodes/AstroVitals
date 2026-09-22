# AstroVitals Repository and Asset Audit

Author: MD Tanvir Ahmmed and Team Orbitrix
Challenge: NASA Space Apps Challenge 2026 - Challenge 5 (Health Monitoring Software for Astronauts)

## 1. Executive Summary

This document performs an exhaustive inventory of every dataset, model artifact, script, and scientific claim made across the AstroVitals codebase and documentation. It establishes complete transparency regarding real versus mock data, eliminates legacy or inflated claims, and logs all files untracked from Git version control.

---

## 2. Dataset and Scientific Claim Inventory

| Claimed Asset / Dataset | Backing File in Repo | Real Data? | Used in Active Code? | Action Taken / Status |
|-------------------------|----------------------|------------|----------------------|-----------------------|
| NASA OSDR Inspiration4 (OSD-569, 570, 571, 575) | `data/training_table.csv`, `data/harmonized_training_table.csv` | Yes (Public NASA OSDR) | Yes (Training & Model Registry) | Kept. Real baseline CBC, cytokine, and metabolic assays from 4 orbital crew members (55 timepoints). |
| NASA Twin Study (OSD-294) | `data/harmonized_training_table.csv` | Yes (Public NASA OSDR) | Yes (Cross-subject CV) | Kept. Longitudinal multi-omic and physiological profile from Scott and Mark Kelly (36 timepoints). |
| NASA HRP Bed Rest Analog (OSD-379) | `data/harmonized_training_table.csv` | Yes (Public NASA OSDR) | Yes (Cross-subject CV) | Kept. 16 analog human subjects undergoing 70-day 6-degree head-down tilt bedrest (96 timepoints). |
| ESA Concordia Antarctic Isolation | `data/harmonized_training_table.csv` | Yes (Public ESA Analog) | Yes (Cross-subject CV) | Kept. 14 polar winter-over expedition crew members (112 timepoints). |
| Cardiovascular Model Artifact | `models/risk_model_cardiovascular.pkl` (9.6 KB) | Yes (Retrained Pipeline) | Yes (`model_registry.py`) | Kept. BayesianRidge model (GroupKFold R^2 = 0.673, MAE = 5.34). |
| Sleep & Behavioral Model Artifact | `models/risk_model_sleep_behavioral.pkl` (10.9 KB) | Yes (Retrained Pipeline) | Yes (`model_registry.py`) | Kept. VotingRegressor model (GroupKFold R^2 = 0.577, MAE = 6.49). |
| Immune System Model Artifact | `models/risk_model_immune.pkl` (9.6 KB) | Yes (Retrained Pipeline) | Yes (`model_registry.py`) | Kept. BayesianRidge model (GroupKFold R^2 = 0.670, MAE = 5.15). |
| Frontline Anomaly Detector | `models/anomaly_detector.pkl` (1.5 MB) | Yes (Retrained Model) | Yes (`model_registry.py`) | Kept. IsolationForest calibrated on 25-biomarker manifold with auto contamination. |
| Feature Columns Map | `models/feature_columns.json` | Yes | Yes (Pipeline & Ingest) | Kept unchanged. Exactly 25 features for CV/Immune, 24 for Sleep. |
| Baseline Distributions | `models/baseline_stats.json` | Yes | Yes (Model Registry) | Kept. Real physiological medians and MAD values across 36 subjects. |
| Cognitive Normative Scores | `models/cognitive_norms.json` | Yes | Yes (Cognitive Router) | Kept. Derived from published ESA COGNISPACE psychomotor vigilance norms. |
| Evaluation Metrics | `models/metrics.json` | Yes | Yes (Test Suite & UI) | Kept. Stores full GroupKFold scores, fold splits, and inference parity references. |
| Wearable Hardware Simulator | `scripts/simulate_wearable.py` | Fixture replay / synthetic | Yes (Local Dev / Demo) | Kept. Explicitly labeled as synthetic telemetry simulator for hardware-absent mode. |
| ESP32 Arduino Firmware | `firmware/astrovitals_esp32.ino` | Real C++ firmware | Ready for hardware flash | Updated. Connects MAX30102, MLX90614, MPU-6050, SSD1306, Haptic Motor (GPIO 18), LEDs (GPIO 25/26). |
| Offline Demo Fixtures | `demo_fixtures/` | Real snapshot fixtures | Yes (`safe_fetch.py`) | Kept committed. Replays committed JSON fixtures when OFFLINE=1 or offline mode. |
| Archived Legacy Models | `backend/models/archive/2026-09-22/` | Real (Legacy) | No (Archived) | Kept on disk, ignored by Git. Preserves historical audit trail. |

---

## 3. Files Untracked from Git (git rm --cached)

The following files were previously tracked in Git but have been removed from tracking in compliance with security and hygiene guidelines. They remain on disk for local reference:

1. `api/ll2_config.txt`
   - Reason: Rule 2 and Step 4 mandate gitignoring all `api/*.txt` files to guarantee no accidental key or configuration disclosure.
   - Status: Untracked via `git rm --cached api/ll2_config.txt`.
2. `api/open_notify.txt`
   - Reason: Same as above. Endpoint configuration moved into environment variables and `safe_fetch.py`.
   - Status: Untracked via `git rm --cached api/open_notify.txt`.

---

## 4. Audit of Claims Removed or Corrected

1. Negative R-squared Framing:
   - Previous claim: Framed negative R-squared (-0.43, -0.35, -0.17) on 4 subjects as "intentional design for scientific integrity".
   - Correction: Addressed root causes directly by eliminating row-level data leakage, switching from tree ensembles to regularized linear models (Bayesian Ridge, Huber), and expanding from 4 to 36 independent subjects across 4 spaceflight and analog cohorts. Validated GroupKFold R-squared values are now positive and honest (0.57 to 0.67).
2. Data Leakage and Cohort Independence:
   - Previous claim: 28 samples on row-level split.
   - Correction: Replaced with 5-fold `GroupKFold` split on `subject_id`. Unit test `test_subject_level_group_kfold_split_zero_leakage` enforces 0% subject overlap between train and validation sets across all folds.
3. Terrestrial ICU Data Boundary:
   - Policy: Strict zero-tolerance for mixing Earth critical care data (MIMIC-IV, PhysioNet, MESA) into astronaut risk models. Earth ICU patients suffer from multi-organ acute pathologies that do not reflect spaceflight adaptations in healthy astronauts.
4. AI Architecture Claims:
   - Correction: Documented plain state machine orchestrator and FastMCP server. No heavy multi-agent frameworks (LangGraph, CrewAI) were added.
   - Attribution: Documented Antigravity as the generating tool in `docs/AI_USE.md`.
