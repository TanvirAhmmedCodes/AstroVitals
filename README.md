# AstroVitals Neuro-Shield

### Autonomous AI Health Guardian for Astronauts
**NASA Space Apps Challenge 2026** - Challenge 5: Health Monitoring Software for Astronauts  
**Team:** Team Orbitrix, Dhaka, Bangladesh

> "A wearable that reads the body. An AI that understands the mind."

---

## 1. What It Does

AstroVitals is an autonomous, closed-loop physiological monitoring and clinical decision support system engineered for deep-space astronaut health autonomy. On long-duration exploration missions to Mars or deep space habitats, communication latency of up to 22 minutes each way prevents real-time telemedicine with terrestrial flight surgeons. 

AstroVitals solves this through:
- An ESP32 wearable biometric hub acquiring continuous heart rate, SpO2, skin temperature, and 6-axis motion dynamics with tactile haptic and visual alert indicators.
- Pure deterministic scientific mathematics in `backend/compute/` for real-time Heart Rate Variability (RMSSD, SDNN), baseline deviations, Theil-Sen trend slope calculations, and NASA-STD-3001 cumulative dosimetry limits.
- Regularized linear machine learning models trained across 36 subjects (299 longitudinal biological samples) from four spaceflight and ground analog cohorts to predict cardiovascular deconditioning, sleep/circadian disruption, and immune dysregulation.
- An unsupervised IsolationForest anomaly detector and real-time vital safety envelope serving as frontline alert sentinels.
- An autonomous, telemetry-aware AI companion (Ori) that retrieves spaceflight literature, orchestrates workflows, explains physiological deviations, and recommends NASA HRP countermeasures without performing direct arithmetic.
- Full offline-first operation (`OFFLINE=1`) with committed fixtures and Server-Sent Events (SSE) telemetry stream replay.

---

## 2. NASA Space Apps 2026 Challenge

**Challenge 5: Health Monitoring Software for Astronauts**

Deep-space exploration confronts astronauts with the five hazards of human spaceflight:
1. Space Radiation (Galactic Cosmic Rays and Solar Particle Events)
2. Isolation and Confinement
3. Distance from Earth (No real-time evacuation or live surgical consultations)
4. Gravity Fields (Microgravity-induced cephalic fluid shift, cardiovascular deconditioning, bone loss)
5. Hostile Closed Environments (Cabin atmosphere, toxic trace gases, acoustic stress)

AstroVitals maps directly to these five hazards by ingesting multi-modal physiological telemetry and delivering autonomous, evidence-grounded countermeasures.

---

## 3. Layered Spine Architecture & The Layer Rule

AstroVitals implements a physical layered spine where each layer has exactly one responsibility and no layer reaches past its neighbor:

```
[ Hardware Layer (ESP32 Wearable) ]
       | (HTTP POST /ingest/vitals - Batching + Ring Buffer)
       v
[ Presentation Layer (React 19 / Vite 8) ]
       | (REST / SSE / WebSocket - Never calls external APIs directly)
       v
[ Application API Layer (FastAPI) ]
       | (Enforces auth, database logging, and safe_fetch caching)
       v
[ AI Agent Orchestrator (Plain State Machine, Max 6 Steps) ]
       | (Orchestrates, explains, and narrates - NEVER computes numbers)
       v
[ MCP Tool Server (mcp_server.py / FastMCP stdio) ]
       | (Exposes tools: vitals_anomaly_check, trend_test, osdr_search, cite_check)
       v
[ Deterministic Science (backend/compute/) ]
       (Pure Python / NumPy / SciPy: Mann-Kendall, Theil-Sen, HRV, NASA-STD-3001)
```

### The Layer Rule: The LLM Never Computes Arithmetic
Judges evaluate scientific validity under strict criteria: **The model never computes a number**.
- Deterministic science lives in [`backend/compute/`](backend/compute/):
  * `vitals_math.py`: HRV time-domain metrics (RMSSD, SDNN), baseline deviation ratios, and physiological vital safety boundaries.
  * `trend.py`: Non-parametric Mann-Kendall trend tests and Theil-Sen robust median slopes.
  * `radiation_math.py`: Career radiation limits (600 mSv), Solar Particle Event limits (250 mSv), and South Atlantic Anomaly (SAA) coordinate checks.
- The LLM receives pre-computed numbers as tool results. It explains, narrates, contextualizes, and retrieves relevant spaceflight literature. It never does arithmetic.
- If a tool or network call fails, cached numbers with timestamps are returned rather than hallucinated estimates.

---

## 4. Multi-Subject Machine Learning Models

AstroVitals addresses the challenge of small spaceflight sample sizes through multi-cohort harmonization. Training exclusively on the Inspiration4 dataset (4 subjects) causes severe overfitting; measuring the same four astronauts across multiple assays (OSD-570, 571, 575) adds features, not subjects.

### Harmonized Human Cohort (36 Subjects, 299 Samples)
1. NASA OSDR Inspiration4 (`OSD-569`, `OSD-570`, `OSD-571`, `OSD-575`): 4 orbital crew members (55 samples).
2. NASA Twin Study (`OSD-294`): 2 subjects (Scott Kelly and Mark Kelly, 36 samples).
3. NASA HRP 70-Day Head-Down Tilt Bed Rest (`OSD-379`): 16 analog subjects (96 samples).
4. ESA Concordia Antarctic Winter-Over Station: 14 analog crew members (112 samples).

Important Clinical Integrity Constraint: Zero Earth ICU data (PhysioNet, MIMIC-IV, MESA) was mixed into the astronaut risk models. Terrestrial critical care patients have acute multi-organ pathologies that do not reflect microgravity adaptation in healthy astronauts.

### GroupKFold Validation and Algorithm Benchmark
To guarantee zero cross-subject data leakage, all models are evaluated with 5-fold `GroupKFold` cross-validation partitioned strictly by `subject_id`. Unit test `test_subject_level_group_kfold_split_zero_leakage` validates that no subject ever appears in both training and validation folds.

| Target System | Selected Algorithm | Apparent R2 | GroupKFold Subject CV R2 | CV MAE (0-100) | CV RMSE | Operational Status |
|---|---|---|---|---|---|---|
| **Cardiovascular Risk** | BayesianRidge (Pipeline) | 0.941 | **0.673 (+/- 0.209)** | 5.34 | 8.40 | Validated Generalization |
| **Sleep & Behavioral** | VotingRegressor (Ridge+Bayes+Huber) | 0.898 | **0.577 (+/- 0.248)** | 6.49 | 9.08 | Validated Generalization |
| **Immune Dysregulation** | BayesianRidge (Pipeline) | 0.922 | **0.670 (+/- 0.308)** | 5.15 | 7.05 | Validated Generalization |
| **Real-time Anomaly** | IsolationForest (contamination="auto") | Unsupervised | Dynamic Outlier Envelope | N/A | N/A | Frontline Safety Sentinel |

### Why Regularized Linear Models Outperform Tree Ensembles on Small N
Initial tests with unregularized tree ensembles (XGBoost, Random Forest, Gradient Boosting) showed memorization of training subjects. Regularized linear algorithms (Bayesian Ridge, Huber Regressor, Ridge) apply Bayesian priors and L2 penalties that prevent coefficient explosion, yielding honest, stable generalization across unseen subjects (R^2 between 0.57 and 0.67 with low MAE of 5.1 to 6.5 points). Complete benchmarking code is in `training/harmonize_and_train.py` and documented in `docs/MODEL_README.md`.

---

## 5. Hardware Architecture & Firmware

AstroVitals features a physical wearable and telemetry hub built around the ESP32-WROOM-32 microcontroller.

### Hardware Suite Summary
- **Microcontroller**: ESP32-WROOM-32 (240 MHz dual-core, 4MB flash, station Wi-Fi).
- **Shared I2C Bus (GPIO 21 SDA / GPIO 22 SCL)**:
  - **MAX30102**: Photoplethysmography pulse oximeter & heart rate sensor (0x57, INT on GPIO 19).
  - **MLX90614**: Non-contact infrared core body temperature sensor (0x5A).
  - **MPU-6050**: 6-axis MEMS accelerometer & gyroscope for microgravity motion tracking (0x68).
  - **SSD1306**: 128x64 monochrome OLED local HUD display (0x3C).
- **Actuators & Status Indicators**:
  - **Haptic Vibration Motor**: Driven via 2N2222/S8050 NPN transistor base on GPIO 18 (1k ohm resistor, 1N4148 flyback diode).
  - **Red Anomaly LED**: GPIO 25 with 220 ohm current-limiting resistor.
  - **Green Nominal LED**: GPIO 26 with 220 ohm current-limiting resistor.
- **Definitive Pin Map**: The complete ASCII wiring schematic, circuit design, and pin assignments are documented in [`docs/HARDWARE.md`](docs/HARDWARE.md) (single source of truth).

### Edge Alerting & Sensor Physics
- **Local-First Safety Sentinel**: The firmware evaluates hard physiological limits (HR < 40 or > 180 BPM, SpO2 < 90%, Temp < 35.0 C or > 39.0 C, Motion > 4.0 g) on every 1-second loop. Anomalies trigger the Red LED, shut off the Green LED, and execute a 5-pulse haptic alarm (200 ms ON / 200 ms OFF) with a 30-second debounce refractory window.
- **MAX30102 Optical Motion Rejection**: Microgravity fluid shifts and astronaut movement cause photodiode baseline wander. The firmware monitors MPU-6050 vector acceleration magnitude (`|a| = sqrt(ax^2 + ay^2 + az^2) / 16384.0`) to freeze baseline PPG readings during dynamic motion frames (> 0.25 g).
- **MLX90614 Thermal Differential**: 3-second thermal settling window with ambient temperature compensation (`T_object - T_ambient`).
- **Hybrid Radiation Monitoring**: Dedicated dosimeter tubes were replaced with an integrated space weather pipeline: real-time solar X-ray flux and storm scales from NOAA SWPC (`https://services.swpc.noaa.gov/products/noaa-scales.json`), committed analog fixtures (`demo_fixtures/radspace_weather.json`), and NASA-STD-3001 cumulative career dosimetry limits.

### Ingest JSON Payload Format
The ESP32 firmware posts telemetry to `/api/v1/ingest/vitals`:
```json
{
  "device_id": "esp32-orbital-hub-01",
  "astronaut_id": "astronaut-A",
  "readings": [
    {
      "timestamp_utc": "2026-10-04T12:00:00Z",
      "heart_rate_bpm": 74.2,
      "spo2_pct": 98.4,
      "skin_temp_c": 36.54,
      "accel_x_g": 0.02,
      "accel_y_g": 0.03,
      "accel_z_g": 0.98,
      "activity_state": "rest",
      "radiation_dose_uSv_cumulative": 12.504,
      "battery_pct": 92.5,
      "wifi_rssi": -48.0,
      "buffered": false
    }
  ]
}
```
- Firmware Code: [`firmware/astrovitals_esp32.ino`](firmware/astrovitals_esp32.ino)
- Hardware Specification: [`docs/HARDWARE.md`](docs/HARDWARE.md)
- Hardware Documentation: [`docs/HARDWARE.md`](docs/HARDWARE.md)
- Simulation Fallback: Run `python scripts/simulate_wearable.py --all-astronauts --rate 1` when physical hardware is not connected.

---

## 6. Offline-First Operation & Demo Replay

AstroVitals guarantees 100% functionality when disconnected from the public internet:
- **Safe Fetch Wrapper**: [`backend/services/safe_fetch.py`](backend/services/safe_fetch.py) resolves external queries along `Live -> Cache -> Committed Fixture`.
- **Zero-Crash Demos (`OFFLINE=1`)**: Setting `$env:OFFLINE="1"` forces all services to read exclusively from committed JSON files in `demo_fixtures/`.
- **Deterministic Stream Replay**: Server-Sent Events (`/api/v1/vitals/stream`) replay 600 seconds of pre-recorded multi-astronaut telemetry featuring planned physiological deviations and recovery cycles.

---

## 7. Model Context Protocol (MCP) Server

[`mcp_server.py`](mcp_server.py) implements the Model Context Protocol over stdio JSON-RPC, exposing five deterministic tools for autonomous coding and reasoning agents:
1. `vitals_anomaly_check`: Evaluates vital signs against baseline norms and MAD boundaries.
2. `trend_test`: Executes deterministic Mann-Kendall trend significance and Theil-Sen slope.
3. `osdr_search`: Queries the NASA Open Science Data Repository study catalogue.
4. `ntrs_search`: Searches the NASA Technical Reports Server for aerospace medicine literature.
5. `cite_check`: Provenance verification gate blocking unverified numeric assertions.

Inspect MCP tools:
```powershell
python mcp_server.py --list
```

---

## 8. Data Provenance & Verification

Every numeric claim rendered in the user interface carries a verified `dataset_id` and `source_url`:
- **UI Provenance Badges**: Color-coded badges (`live`, `cache`, or `fixture`) appear alongside vital tiles and risk scores.
- **Provenance Inspection Drawer**: Clicking any badge opens a drawer revealing the underlying tool execution JSON, calculation timestamp, and verified NASA source URL.
- **Automated Gate**: In `backend/services/provenance.py`, `cite_check()` blocks any agent response that makes numeric claims without verified backing metadata.

---

## 9. NASA & Space Science Datasets Used

| Dataset / Source | Accession / Reference | Purpose in AstroVitals |
|---|---|---|
| [NASA OSDR Inspiration4](https://osdr.nasa.gov/osdr/data/osd/files/569) | `OSD-569`, `OSD-570`, `OSD-571`, `OSD-575` | Complete blood count (CBC), plasma cytokines, cfRNA, and physiological telemetry (4 subjects). |
| [NASA Twin Study](https://osdr.nasa.gov/osdr/data/osd/files/294) | `OSD-294` | Longitudinal genomics, cardiovascular telomere dynamics, and microgravity adaptation (2 subjects). |
| [NASA HRP Bed Rest Study](https://osdr.nasa.gov/osdr/data/osd/files/379) | `OSD-379` | 70-day head-down tilt bedrest cardiovascular deconditioning and fluid shift modeling (16 subjects). |
| [ESA Concordia Antarctic Station](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Concordia) | `ESA-ICE-CONCORDIA` | Extreme isolation cognitive performance, sleep debt, and circadian misalignment norms (14 subjects). |
| [NASA HRP Human Research Roadmap](https://humanresearchroadmap.nasa.gov/evidence/) | NASA/SP-2009-3405 | Clinical countermeasure protocols for cardiovascular deconditioning and circadian disruption. |
| [NASA-STD-3001 Vol 1 Rev C](https://www.nasa.gov/hhp/standards/) | NASA Technical Standard | Physiological safety envelope and career radiation exposure limits (600 mSv career limit). |
| [NASA NTRS](https://ntrs.nasa.gov/) | NASA Technical Reports | Grounding aerospace medicine publications for autonomous agent citations. |

---

## 10. Earth Observation and Planetary Mission Status Notes

As documented in the NASA challenge guidelines, AstroVitals maintains awareness of upstream operational mission data status:
- **NISAR**: Spacecraft and SAR radar data products remain provisional during ongoing commissioning and calibration phases.
- **SPHEREx**: Public Quick Release 2 (QR2) catalog accessible under DOI 10.26131/IRSA652.
- **Suomi-NPP**: Mission operations conclude 1 November 2026. Data pipelines are configured to prioritize VIIRS data streams from NOAA-20 and NOAA-21.

---

## 11. NASA Space Apps 2026 Judging Criteria Mapping

| Criterion | Score Band | AstroVitals Implementation |
|---|---|---|
| **Impact** | 1-20 | Solves medical autonomy for Mars transit where 22-minute communications delay makes live Earth-directed surgery or triage impossible. |
| **Creativity** | 1-20 | Connects a physical ESP32 wearable sensor suite with regularized ML risk models, deterministic compute, and an empathetic AI companion. |
| **Validity** | 1-20 | Strict physical separation: the LLM never computes arithmetic. 5-fold GroupKFold cross-validation on subject ID prevents leakage. R^2 values published honestly. |
| **Relevance** | 1-20 | Directly addresses Challenge 5 (Health Monitoring Software for Astronauts) using NASA OSDR, NASA HRP, and NASA-STD-3001 standards. |
| **Presentation** | 1-20 | Cinematic dark-mode mission control UI with glassmorphism, real-time vitals wave monitors, and interactive provenance drawers. |
| **Teamwork** | 1-5 | Multidisciplinary collaboration across full-stack engineering, ML model design, hardware assembly, clinical documentation, and QA testing. |
| **User Experience** | 1-5 | Intuitive astronaut cockpit with visual status badges, one-click countermeasure activation, and complete provenance transparency. |
| **NASA Data Usage** | 1-5 | Fuses NASA open science data (OSDR omics, NTRS literature, NASA standards) with international partner datasets (ESA Concordia). |
| **Category Named** | 0 or 1 | Formally submitted under Challenge 5: Health Monitoring Software for Astronauts. |
| **Repository Access** | 0 or 1 | Public GitHub repository under Apache License 2.0. |
| **Project Page Complete**| 0 or 1 | Complete documentation, hardware schematics, training scripts, test suites, and demonstration recordings provided. |

---

## 12. Local Development & Deployment

### Running Locally

1. **Backend**:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn backend.main:app --port 8080 --reload
```

2. **Frontend**:
```powershell
cd frontend
npm install
npm run dev
```

3. **Offline Demo Mode (`OFFLINE=1`)**:
```powershell
$env:OFFLINE="1"
python -m uvicorn backend.main:app --port 8080
```

4. **Running Unit Tests**:
```powershell
python -m unittest discover backend/tests
```

### Production Deployment
- **Backend**: Deployed on Render (FastAPI web service). Deployment files (`Procfile`, `render.yaml`) are frozen and untouched.
- **Frontend**: Deployed on Vercel (React 19 single-page application). Build commands (`vite build`) and configurations (`vercel.json`) are frozen and untouched.

---

## 13. AI Attribution

In compliance with NASA Space Apps Challenge submission rules, all AI tools utilized during development are disclosed in [`docs/AI_USE.md`](docs/AI_USE.md):
- **Development Tool**: Google Antigravity IDE (powered by Gemini reasoning models) assisted with code scaffolding, test generation, and documentation.
- **In-App Agent**: Google Gemini 1.5 Flash powers the in-app explanation companion (Ori), strictly bound to narrative explanation and literature citation without arithmetic computation.
- **Human Engineering**: Team Orbitrix provided the physiological architecture, clinical threshold design, hardware schematics, firmware physics, and algorithm selection.

---

## 14. License

This project is licensed under the **Apache License 2.0** - see the [`LICENSE`](LICENSE) file for complete details.

---

## 15. Team Orbitrix

| Member | Role | Responsibility | Contact |
|---|---|---|---|
| **MD Tanvir Ahmmed** | **Team Lead · Full Stack · AI/ML** | Software Architecture, ML Models, API, UI/UX | [Email](mailto:tanvirahmmed13579@gmail.com) |
| **Ishraq Ahmmed** | **Hardware Engineer** | ESP32 Firmware, MAX30102, MLX90614 Sensors | Contact via Team |
| **Suvajit Kumar Arja** | **Hardware Engineer** | PCB Schematic, Power Management, Wiring | Contact via Team |
| **Suborna Akter** | **Documentation Lead** | Scientific Research, Compliance Documentation | Contact via Team |
| **Fatima Jahan Hitu** | **Videography & Storyboard** | Video Production, Storyboarding, Media Visuals | Contact via Team |
| **Md. Afzal Hossain** | **QA & System Testing** | System Validation, Test Execution, QA | Contact via Team |

*NASA Space Apps Challenge 2026 - Dhaka Local Event*