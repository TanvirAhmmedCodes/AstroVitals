# AstroVitals Neuro-Shield

### Autonomous Clinical Decision Support and Physiological Health Guardian for Astronauts
**NASA Space Apps Challenge 2026** - Challenge 5: Health Monitoring Software for Astronauts  
**Team:** Team Orbitrix, Dhaka, Bangladesh  
**Live Web Application:** [https://astrovitals.vercel.app](https://astrovitals.vercel.app)  
**Production API Gateway:** [https://astrovitals.onrender.com](https://astrovitals.onrender.com)  
**API Documentation (Swagger UI):** [https://astrovitals.onrender.com/docs](https://astrovitals.onrender.com/docs)  

> "A wearable that reads the body. An AI that understands the mind."

---

## 1. Executive Summary & What It Does

On deep-space exploration missions to the Moon or Mars, communications latency of up to 22 minutes each way prevents real-time medical consultations with terrestrial flight surgeons. If an astronaut experiences an acute arrhythmia, severe hypoxia, carbon monoxide buildup, or accelerated cardiovascular deconditioning, immediate diagnostic and clinical autonomy is required aboard the spacecraft.

**AstroVitals** is a closed-loop astronaut health monitoring and clinical decision support system built to solve deep-space medical autonomy. It integrates:
- **Physical Wearable Telemetry Hub**: An ESP32-WROOM-32 biometric unit capturing continuous photoplethysmography (MAX30102), infrared core temperature (MLX90614), and 6-axis inertial motion dynamics (MPU-6050) with tactile haptic and visual alert indicators.
- **Deterministic Scientific Engine (`backend/compute/`)**: Zero-hallucination, pure mathematical evaluation of Heart Rate Variability (HRV RMSSD, SDNN), baseline deviations, non-parametric Theil-Sen trend slopes, and NASA-STD-3001 cumulative radiation limits.
- **Harmonized Spaceflight ML Models**: Regularized clinical risk predictors trained across 36 human subjects and 299 longitudinal biological samples from four spaceflight and ground analog cohorts, validated with subject-level GroupKFold cross-validation.
- **Unsupervised Anomaly Sentinel**: An IsolationForest boundary detector and real-time vital threshold envelope providing frontline edge alerting on both physical wearable and cloud dashboard.
- **Autonomous Clinical AI Companion (Ori)**: A grounded agent that retrieves verified NASA OSDR studies and NTRS aerospace medicine literature to narrate trends and prescribe NASA Human Research Program (HRP) countermeasures without performing direct arithmetic.
- **Offline-First Resilience**: Full operational capability under complete loss of signal (`OFFLINE=1`), powered by committed demo fixtures and continuous Server-Sent Events (SSE) telemetry replay.

---

## 2. NASA Space Apps 2026 Challenge Context

**Challenge 5: Health Monitoring Software for Astronauts**

Deep-space long-duration missions subject crew members to the five fundamental hazards of human spaceflight:
1. **Space Radiation**: Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE) damaging DNA, cardiovascular tissue, and central nervous system function.
2. **Isolation and Confinement**: Disrupted circadian rhythms, sleep debt, cognitive fatigue, and psychological stress in extreme environments.
3. **Distance from Earth**: Complete absence of real-time telemedicine or emergency evacuation capabilities.
4. **Gravity Fields**: Microgravity fluid shifts inducing cephalic congestion, plasma volume contraction, spaceflight-associated neuro-ocular syndrome (SANS), and cardiovascular deconditioning.
5. **Hostile Closed Environments**: Toxic trace contaminants, acoustic noise, elevated carbon dioxide levels, and microbial shifts.

AstroVitals addresses these hazards by fusing physical telemetry with evidence-based space medicine protocols to deliver actionable, autonomous countermeasures.

---

## 3. Layered Spine Architecture & The Layer Rule

AstroVitals follows a strict layered spine pattern where every layer has exactly one responsibility and never bypasses adjacent boundaries:

```
+-------------------------------------------------------------------+
|               Hardware Layer (ESP32-WROOM-32)                     |
|  PPG (MAX30102), IR Temp (MLX90614), 6-Axis Motion (MPU-6050)     |
+---------------------------------┬---------------------------------+
                                  | HTTP POST /api/v1/ingest/vitals
                                  v
+-------------------------------------------------------------------+
|               Presentation Layer (React 19 / Vite)                |
|  Sub-second HUD, Telemetry Waves, Provenance Drawers (Vercel CDN) |
+---------------------------------┬---------------------------------+
                                  | REST API / SSE / Firestore
                                  v
+-------------------------------------------------------------------+
|               Application API Layer (FastAPI)                     |
|  JWT Authentication, SQLite / Firestore Sync, Safe-Fetch Caching  |
+---------------------------------┬---------------------------------+
                                  | Plain State Machine Orchestrator
                                  v
+-------------------------------------------------------------------+
|               AI Agent Layer (Ori / Gemini 1.5)                   |
|  6-step tool loop, literature retrieval, countermeasure advice    |
+---------------------------------┬---------------------------------+
                                  | FastMCP Tool Server (stdio)
                                  v
+-------------------------------------------------------------------+
|               Deterministic Science (backend/compute/)            |
|  Pure Python: vitals_math.py, trend.py, radiation_math.py         |
|  Zero model math: HRV RMSSD, Theil-Sen slopes, NASA-STD-3001      |
+-------------------------------------------------------------------+
```

### The Layer Rule: The LLM Never Computes Arithmetic
To ensure uncompromising scientific and medical validity:
- **Zero In-Prompt Arithmetic**: All statistics, anomaly scores, baseline deviation ratios, p-values, trend slopes, and radiation dosages are computed in [`backend/compute/`](backend/compute/) using pure, deterministic Python, NumPy, and SciPy functions.
- **Agent Role Boundary**: The AI companion (Ori) retrieves, orchestrates, narrates, and contextualizes pre-calculated numbers. It never generates or estimates numbers in prompts.
- **Fallback Integrity**: If an external API or network link fails, cached numbers with explicit timestamps or committed fixtures are returned. The agent is blocked by code from hallucinating missing telemetry.

For a detailed audit of the architecture and boundary guarantees, see [`docs/ARCHITECTURE_AUDIT.md`](docs/ARCHITECTURE_AUDIT.md).

---

## 4. Multi-Subject Machine Learning Models

### The Small-N Problem in Space Medicine
Training machine learning models on spaceflight datasets presents severe small-sample challenges. Training exclusively on a single mission like Inspiration4 (4 subjects) yields overfitted models that memorize individual crew baselines. Adding multiple assays across the same four astronauts (e.g., OSD-570, OSD-571, OSD-575) adds features, not independent subjects.

### Harmonized Human Cohort (36 Subjects, 299 Longitudinal Samples)
To establish generalizable physiological distributions, AstroVitals created a harmonized multi-cohort dataset:
1. **NASA OSDR Inspiration4 (`OSD-569`, `OSD-570`, `OSD-571`, `OSD-575`)**: 4 orbital commercial astronauts (55 samples).
2. **NASA Twin Study (`OSD-294`)**: 2 subjects, Scott Kelly and Mark Kelly (36 samples).
3. **NASA HRP 70-Day Head-Down Tilt Bed Rest (`OSD-379`)**: 16 analog subjects (96 samples).
4. **ESA Concordia Antarctic Station (`ESA-ICE-CONCORDIA`)**: 14 winter-over analog subjects (112 samples).

**Clinical Integrity Guard**: Zero Earth intensive care data (such as PhysioNet, MIMIC-IV, or MESA) was mixed into the astronaut models. Terrestrial critical care patients have acute multi-organ pathologies that do not reflect microgravity adaptation in healthy astronauts.

### GroupKFold Cross-Validation and Honest Benchmarks
To guarantee zero cross-subject data leakage, all models are validated using 5-fold `GroupKFold` cross-validation partitioned strictly by `subject_id`. Automated unit test `test_subject_level_group_kfold_split_zero_leakage` verifies that no subject appears in both training and validation folds.

| Clinical Risk Target | Selected Algorithm | Apparent R2 | GroupKFold Subject CV R2 | CV MAE (0-100 scale) | CV RMSE | Operational Status |
|:---|:---|:---:|:---:|:---:|:---:|:---|
| **Cardiovascular Deconditioning** | BayesianRidge Pipeline | 0.941 | **0.673 (+/- 0.209)** | 5.34 | 8.40 | Validated Generalization |
| **Sleep & Circadian Disruption** | VotingRegressor (Ridge+Bayes+Huber) | 0.898 | **0.577 (+/- 0.248)** | 6.49 | 9.08 | Validated Generalization |
| **Immune Dysregulation** | BayesianRidge Pipeline | 0.922 | **0.670 (+/- 0.308)** | 5.15 | 7.05 | Validated Generalization |
| **Real-time Vital Anomaly** | IsolationForest (`contamination="auto"`) | Unsupervised | Dynamic Outlier Envelope | N/A | N/A | Frontline Safety Sentinel |

### Why Regularized Linear Models Outperform Tree Ensembles on Small N
Unregularized tree ensembles (XGBoost, Random Forests) memorize training subjects on small cohorts, collapsing to near-zero or negative cross-validation R^2 on unseen subjects. In contrast, regularized linear algorithms (Bayesian Ridge, Huber Regressor, Ridge) leverage Gaussian priors and L2 penalties that stabilize coefficients, producing robust generalization on unseen human subjects.

For the complete dataset harmonization pipeline and benchmark details, see [`docs/DATASET_HARMONIZATION.md`](docs/DATASET_HARMONIZATION.md) and [`docs/MODEL_README.md`](docs/MODEL_README.md).

---

## 5. Hardware Architecture & Firmware Summary

AstroVitals is integrated with a physical wearable hardware hub based on the Espressif ESP32-WROOM-32 microcontroller.

### Hardware Suite Summary
- **Microcontroller**: ESP32-WROOM-32 (240 MHz dual-core Tensilica LX6, 4MB Flash, station Wi-Fi).
- **Shared I2C Bus (GPIO 21 SDA / GPIO 22 SCL)**:
  - **MAX30102**: Photoplethysmography pulse oximeter and heart rate sensor (I2C 0x57, INT on GPIO 19).
  - **MLX90614**: Non-contact infrared core body temperature sensor (I2C 0x5A).
  - **MPU-6050**: 6-axis MEMS accelerometer and gyroscope for microgravity motion tracking (I2C 0x68).
  - **SSD1306**: 128x64 monochrome OLED local HUD display (I2C 0x3C).
- **Actuators and Visual Indicators**:
  - **Haptic Vibration Motor**: Driven via 2N2222/S8050 NPN transistor base on GPIO 18 (1k resistor, 1N4148 flyback diode).
  - **Red Anomaly LED**: GPIO 25 with 220 ohm current-limiting resistor.
  - **Green Nominal LED**: GPIO 26 with 220 ohm current-limiting resistor.
- **Edge Alerting**: Local-first safety thresholds (HR < 40 or > 180 BPM, SpO2 < 90%, Temp < 35.0 C or > 39.0 C, Motion > 4.0 g) trigger an immediate 5-pulse tactile alarm (200 ms ON / 200 ms OFF) with a 30-second debounce refractory window, operating even during complete station Wi-Fi blackout.
- **Motion Artifact Rejection**: The firmware uses MPU-6050 vector acceleration magnitude to freeze photodiode baseline tracking during dynamic motion frames (> 0.25 g).
- **Hybrid Radiation Monitoring**: Combines real-time NOAA SWPC solar X-ray flux and storm scales with committed spaceflight analog fixtures (`demo_fixtures/radspace_weather.json`) and NASA-STD-3001 cumulative career limits (600 mSv career, 250 mSv SPE).

Complete schematic, circuit protection, and pin mapping are documented in [`docs/HARDWARE.md`](docs/HARDWARE.md).  
Firmware source code: [`firmware/astrovitals_esp32.ino`](firmware/astrovitals_esp32.ino).

---

## 6. Offline-First Operation & Demo Replay Mode

AstroVitals guarantees 100% functionality when completely severed from Earth communication:
- **Safe Fetch Wrapper (`backend/services/safe_fetch.py`)**: Resolves all data requests along a resilient path: `Live API -> Local Cache -> Committed Fixture`.
- **Zero-Crash Demos (`OFFLINE=1`)**: Setting `OFFLINE=1` forces the application to bypass external network calls and read directly from verified fixtures in `demo_fixtures/`.
- **Deterministic Stream Replay**: Server-Sent Events (`/api/v1/vitals/stream`) stream 600 seconds of pre-recorded multi-astronaut telemetry featuring calibrated physiological stress events and clinical recovery curves.

---

## 7. Model Context Protocol (MCP) Integration

AstroVitals exposes a Model Context Protocol (MCP) server in [`mcp_server.py`](mcp_server.py) operating over stdio JSON-RPC. It equips autonomous agents with five deterministic tools:
1. `vitals_anomaly_check`: Evaluates vital signs against population baseline norms and Median Absolute Deviation (MAD) envelopes.
2. `trend_test`: Executes deterministic Mann-Kendall trend tests and Theil-Sen robust slope calculations.
3. `osdr_search`: Searches the NASA Open Science Data Repository catalogue for relevant spaceflight omics studies.
4. `ntrs_search`: Queries the NASA Technical Reports Server for aerospace medicine publications.
5. `cite_check`: Validates dataset IDs and URLs before allowing numeric statements to reach the user.

Inspect registered MCP tools via:
```bash
python mcp_server.py --list
```

---

## 8. Data Provenance & Verification Gate

Every numeric claim rendered in AstroVitals carries verifiable provenance:
- **UI Provenance Badges**: Color-coded badges indicate data origin (`LIVE NOAA`, `CACHE`, or `FIXTURE`).
- **Interactive Provenance Drawer**: Clicking any badge opens a drawer revealing the source dataset ID, tool execution record, calculation timestamp, and official NASA archive URL.
- **Provenance Verification Gate**: The `cite_check()` guard in `backend/services/provenance.py` validates that all clinical assertions link to verified records before rendering.

---

## 9. NASA & International Space Datasets Used

| Dataset / Scientific Source | Identifier / Accession | Purpose in AstroVitals | Subject Count |
|:---|:---|:---|:---:|
| [NASA OSDR Inspiration4](https://osdr.nasa.gov/osdr/data/osd/files/569) | `OSD-569`, `OSD-570`, `OSD-571`, `OSD-575` | Complete blood counts, cytokines, plasma cfRNA, and inflight telemetry | 4 subjects (55 samples) |
| [NASA Twin Study](https://osdr.nasa.gov/osdr/data/osd/files/294) | `OSD-294` | Longitudinal genomics, cardiovascular telomere dynamics, and spaceflight adaptation | 2 subjects (36 samples) |
| [NASA HRP Bed Rest Study](https://osdr.nasa.gov/osdr/data/osd/files/379) | `OSD-379` | 70-day head-down tilt bedrest cardiovascular deconditioning and fluid shift modeling | 16 subjects (96 samples) |
| [ESA Concordia Antarctic Station](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Concordia) | `ESA-ICE-CONCORDIA` | Extreme isolation cognitive performance, sleep debt, and circadian disruption | 14 subjects (112 samples) |
| [NASA Human Research Roadmap](https://humanresearchroadmap.nasa.gov/evidence/) | NASA/SP-2009-3405 | Clinical countermeasure protocols for cardiovascular and neurobehavioral risks | Reference Standard |
| [NASA-STD-3001 Vol 1 Rev C](https://www.nasa.gov/hhp/standards/) | NASA Technical Standard | Physiological safety envelope and career radiation exposure limits (600 mSv) | Reference Standard |
| [NASA NTRS](https://ntrs.nasa.gov/) | Technical Reports Server | Peer-reviewed space medicine and countermeasure literature for autonomous citations | Reference Catalogue |

---

## 10. Earth Observation & Planetary Mission Status Notes

In accordance with NASA challenge guidelines, AstroVitals monitors upstream mission data product statuses:
- **NISAR**: Spacecraft and SAR radar products remain provisional during ongoing commissioning and calibration phases.
- **SPHEREx**: Public Quick Release 2 (QR2) catalog accessible under DOI 10.26131/IRSA652.
- **Suomi-NPP**: Mission operations conclude 1 November 2026. Data pipelines are configured to prioritize VIIRS data streams from NOAA-20 and NOAA-21.

---

## 11. NASA Space Apps 2026 Judging Criteria Mapping

| Criterion | Evaluation Score | AstroVitals Implementation |
|:---|:---:|:---|
| **Impact** | 1-20 | Solves critical healthcare autonomy for Mars transit where 22-minute latency makes live Earth-directed diagnosis and triage impossible. |
| **Creativity** | 1-20 | Bridges physical ESP32 wearable sensing with regularized machine learning, pure deterministic compute, and an empathetic AI companion. |
| **Validity** | 1-20 | Strict architectural separation: LLM never computes arithmetic. 5-fold GroupKFold validation on subject ID eliminates cross-subject leakage. Real CV scores published honestly. |
| **Relevance** | 1-20 | Directly addresses Challenge 5 (Health Monitoring Software for Astronauts) using NASA OSDR, NASA HRP, and NASA-STD-3001 standards. |
| **Presentation** | 1-20 | Cinematic dark-mode cockpit interface with glassmorphism, responsive telemetry waveforms, and interactive provenance drawers. |
| **Teamwork** | 1-5 | Multidisciplinary collaboration across full-stack development, ML engineering, embedded hardware design, clinical research, and QA testing. |
| **User Experience** | 1-5 | Intuitive astronaut HUD with visual status badges, one-click countermeasure activation, and full provenance transparency. |
| **NASA Data Usage** | 1-5 | Fuses NASA open science data (OSDR omics, NTRS literature, NASA standards) with international partner datasets (ESA Concordia). |
| **Category Named** | 0 or 1 | Formally submitted under Challenge 5: Health Monitoring Software for Astronauts. |
| **Repository Access** | 0 or 1 | Public GitHub repository licensed under the open-source Apache License 2.0. |
| **Project Page Complete** | 0 or 1 | Complete documentation, hardware schematics, training pipelines, test suites, and demonstration recordings provided. |

---

## 12. Local Installation & Deployment Guide

### Local Development Setup

1. **Clone Repository & Set Up Virtual Environment**:
   ```bash
   git clone https://github.com/TanvirAhmmedCodes/AstroVitals.git
   cd AstroVitals
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. **Install Python Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Pre-generate Offline Fixtures**:
   ```bash
   python scripts/generate_fixtures.py
   ```

5. **Run Backend Server**:
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8080 --reload
   ```

6. **Run Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```

7. **Run Offline Demo Mode (`OFFLINE=1`)**:
   ```bash
   # Windows PowerShell:
   $env:OFFLINE="1"; cd backend; uvicorn main:app --host 0.0.0.0 --port 8080
   # Linux/macOS:
   OFFLINE=1 uvicorn backend.main:app --host 0.0.0.0 --port 8080
   ```

8. **Execute Full Test Suite**:
   ```bash
   # Formal deterministic compute and model inference unit tests:
   python -m unittest discover -s backend/tests

   # Unified 5-phase end-to-end integration and API test suite:
   python backend/test_suite.py
   ```

### Production Deployment
- **Backend**: Hosted on Render (FastAPI Web Service). Production deployment configurations (`Procfile`, `render.yaml`) are frozen and maintained.
- **Frontend**: Hosted on Vercel (React 19 Edge CDN). Routing configurations (`frontend/vercel.json`) are frozen and maintained.
- Full step-by-step production setup instructions are provided in [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 13. Documentation Directory Index

Detailed technical, clinical, and architectural references are maintained in the [`docs/`](docs/) directory:
- [`docs/HARDWARE.md`](docs/HARDWARE.md): Physical ESP32 schematic, sensor physics, I2C bus wiring, haptic driver, and edge alert debounce specifications.
- [`docs/MODEL_README.md`](docs/MODEL_README.md): Machine learning methodology, GroupKFold cross-validation matrices, and regularized linear model benchmarks.
- [`docs/DATASET_HARMONIZATION.md`](docs/DATASET_HARMONIZATION.md): Multi-cohort harmonization pipeline uniting Inspiration4, Twin Study, HRP Bed Rest, and Concordia cohorts.
- [`docs/ARCHITECTURE_AUDIT.md`](docs/ARCHITECTURE_AUDIT.md): Architectural spine analysis, layer boundary enforcement, and mathematical verification guarantees.
- [`docs/AI_USE.md`](docs/AI_USE.md): Formal NASA Space Apps Challenge AI disclosure detailing development tools, in-app agent models, and human-engineered boundaries.
- [`docs/HRP_REFERENCE.md`](docs/HRP_REFERENCE.md): NASA Human Research Program clinical risk countermeasure protocols and evidence base.
- [`docs/REPO_AUDIT.md`](docs/REPO_AUDIT.md): Repository data provenance audit, synthetic data boundary isolation, and secret isolation verification.
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md): Local environment setup, test workflows, and contribution standards.
- [`docs/FIREBASE_ARCHITECTURE.md`](docs/FIREBASE_ARCHITECTURE.md): Real-time synchronization, Firestore schema, and authentication architecture.
- [`docs/CONSOLIDATION_AUDIT.md`](docs/CONSOLIDATION_AUDIT.md): Repository audit matrix of consolidated files, deduplicated scripts, and single-source documentation.

---

## 14. AI Use Disclosure

In compliance with NASA Space Apps Challenge rules, all AI tools utilized during development are formally disclosed in [`docs/AI_USE.md`](docs/AI_USE.md):
- **Development Tooling**: Google Antigravity IDE (powered by Gemini reasoning models) assisted with code scaffolding, test generation, and documentation drafting.
- **In-App Agent (Ori)**: Google Gemini 1.5 Flash powers the in-app conversational companion, strictly bound to narrative explanation, countermeasure recommendations, and literature retrieval without performing arithmetic.
- **Human Engineering**: Team Orbitrix conceived the clinical architecture, designed the hardware schematics and circuit protection, programmed the sensor physics and DSP firmware, constructed the multi-subject data harmonization pipeline, and validated all mathematical models.

---

## 15. License

AstroVitals is licensed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for complete terms.

---

## 16. Team Orbitrix

Built with dedication for the **NASA Space Apps Challenge 2026 (Dhaka, Bangladesh)**:

| Team Member | Role | Primary Responsibilities |
|:---|:---|:---|
| **MD Tanvir Ahmmed** | **Team Lead · Full Stack · AI/ML** | System Architecture, ML Pipelines, Backend API, UI/UX |
| **Ishraq Ahmmed** | **Hardware Engineer** | ESP32 Firmware, Sensor Integration, DSP Filtering |
| **Suvajit Kumar Arja** | **Hardware Engineer** | Circuit Schematic, Power Budget, Hardware Assembly |
| **Suborna Akter** | **Documentation Lead** | Scientific Research, Literature Review, Compliance |
| **Fatima Jahan Hitu** | **Videography & Storyboard** | Video Production, Storyboarding, Media Visuals |
| **Md. Afzal Hossain** | **QA & System Testing** | System Validation, Test Execution, Reliability Testing |

---

*Team Orbitrix · NASA Space Apps Challenge 2026*