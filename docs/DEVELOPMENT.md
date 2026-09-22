# AstroVitals Neuro-Shield - Engineering & Development Guide

### Author: MD Tanvir Ahmmed · Team Orbitrix
**NASA Space Apps Challenge 2026 · Dhaka, Bangladesh**

---

## 1. Project Overview & State (Phases 1-5)

AstroVitals Neuro-Shield is an integrated astronaut bio-telemetry, physiological risk forecasting, and cognitive resilience platform developed for deep-space missions and orbital habitats.

### Phase Milestones Summary:
- **Phase 1 (Core Foundation):** Real-time telemetry ingestion pipeline, SQLite database schema, deterministic health scoring, and baseline vitals streaming.
- **Phase 2 (Scientific Modeling & Reporting):** Integration of NASA OSDR Inspiration4 datasets, trained ensemble regressors (Cardiovascular, Sleep/Circadian, Immune), Isolation Forest anomaly detection, and automated PDF dossier reporting.
- **Phase 3 (Wearable Simulation & External Ephemeris):** Bio-realistic ESP32 wearable emulation, Ring buffer offline caching, Live ISS and SpaceX telemetry integration, and personalized baseline calibration.
- **Phase 4 (Orbital Cockpit & PWA):** 10-page mission console, Digital Twin astronaut 3D visualizer, Neuro-Shield cognitive vigilance testing, PWA offline caching, and real-time Server-Sent Events (SSE).
- **Phase 5 (Ultimate Edition):** 
  - Complete physiological rewrite of `scripts/simulate_wearable.py` with respiratory sinus arrhythmia (RSA), bounded random walks, and activity states.
  - Cryptographic multi-user JWT authentication and strict Single-Admin governance (`tanvirahmmed13579@gmail.com`).
  - Open observer registration with automatic dynamic berth assignment, replacing all static placeholder astronaut profiles.
  - Cinematic 8-section landing page (`/`) with honest model methodology and $R^2$ transparency.
  - Privacy-preserving `/admin` dashboard with aggregated metrics, partial IPs (`192.168.x.x`), and zero disclosure of passwords or personal chat transcripts.
  - Production-grade rate limiting (`slowapi`), mandatory security key rotation, and deployment presets for Vercel and Render.

---

## 2. Architecture & Technical Decisions

1. **Deterministic Alarms vs. Machine Learning Models:**
   Deterministic alarms strictly enforce NASA-STD-3001 biological boundaries (e.g. cumulative radiation limits of 600 mSv career and 250 mSv single SPE, hypoxia alarms for $\text{SpO}_2 < 95\%$, and hyperthermia thresholds). Machine learning models provide risk trend foresight rather than brittle hard triggers.
2. **Relative Backend Architecture:**
   Backend services and routers are packaged with modular local imports, allowing smooth execution both within the `backend/` directory (`uvicorn main:app`) and from the repository root.
3. **Medical Privacy & Data Minimization:**
   The administrator console provides fleet-level oversight (total users, active connections, database footprint, alert volume) while cryptographically isolating sensitive patient data. Administrator views never reveal passwords, message text, or raw biometrics.
4. **Single-Admin Open Source Security:**
   Only `tanvirahmmed13579@gmail.com` possesses administrative privileges, seeded automatically with mandatory key rotation on first sign-in. All other participants register freely as observers with real-time telemetry access.

---

## 3. Directory & File Structure

```
AstroVitals/
├── backend/                  # FastAPI Application (Python 3.11+)
│   ├── config.py             # App configuration, settings, and env resolution
│   ├── database.py           # SQLAlchemy database schema and session factory
│   ├── main.py               # FastAPI application entrypoint & middleware
│   ├── middleware/           # Auth guards & clearance validators
│   ├── migrations/           # Data migration scripts
│   ├── routers/              # Modular REST API routes (auth, admin, vitals, risk, etc.)
│   ├── services/             # Core engines (auth, email, models, radiation, sse)
│   ├── schemas.py            # Pydantic data validation schemas
│   ├── Procfile              # Production process runner
│   └── requirements.txt      # Backend Python dependencies
├── docs/                     # Technical, medical, and development documentation
│   ├── DEVELOPMENT.md        # This development guide
│   ├── HRP_REFERENCE.md      # NASA Human Research Program 5 hazards reference
│   ├── MODEL_README.md       # Honest scientific model disclosure
│   └── CONSOLIDATION_AUDIT.md # Repository consolidation audit matrix
├── frontend/                 # React 19 + Vite Application
│   ├── public/               # Static assets, web manifest, icons
│   ├── src/
│   │   ├── components/       # UI widgets, HUD frame, protected route guards
│   │   ├── lib/              # API and auth client interceptors
│   │   ├── pages/            # 16 cinematic mission pages & landing portal
│   │   ├── store/            # Zustand state stores (mission, auth)
│   │   ├── App.jsx           # Declarative React Router configuration
│   │   └── main.jsx          # React DOM entrypoint
│   ├── vercel.json           # Vercel SPA build and rewrite rules
│   └── package.json          # Node dependencies and project metadata
├── firmware/                 # ESP32 FreeRTOS C/C++ firmware
├── models/                   # Serialized ML artifacts and baseline statistics
├── scripts/                  # Utility scripts & realistic wearable simulator
│   └── simulate_wearable.py  # Bio-mathematical telemetry streaming engine
├── training/                 # Data preprocessing and scikit-learn/xgboost pipelines
└── README.md                 # Primary project overview and quickstart
```

---

## 4. Setup & Execution Commands

### Prerequisites
- Python 3.10+ (with virtual environment)
- Node.js 18+ and npm
- Git

### Backend Setup & Launch
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Frontend Setup & Launch
```powershell
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### Wearable Telemetry Simulator
```powershell
python scripts/simulate_wearable.py --all-astronauts --rate 1.0 --backend http://127.0.0.1:8080
```

---

## 5. Scientific Transparency & Model Performance

The predictive risk models in AstroVitals were trained on NASA Open Science Data Repository (OSDR) Inspiration4 datasets (`OSD-569`, `OSD-570`, `OSD-571`, `OSD-575`).

- **Subject Cohort:** $N=4$ orbital astronauts across pre-, in-, and post-flight intervals (expanded to 28 bio-analog cohorts).
- **Target Design:** Rule-based composite z-score proxies for Cardiovascular, Sleep/Behavioral, and Immune risks.
- **Evaluation:** Model metrics are disclosed transparently (negative $R^2$ on held-out subject partitions), directly reflecting genuine deep-space data sparsity without artificial synthetic inflation or target leakage.
- Detailed disclosure is cataloged in `docs/MODEL_README.md`.

---

## 6. Credits & Authorship

- **System Architect & Lead Developer:** MD Tanvir Ahmmed (`tanvirahmmed13579@gmail.com`)
- **Team:** Team Orbitrix - Dhaka, Bangladesh
- **Event:** NASA Space Apps Challenge 2026
- **Attributions:** NASA Open Science Data Repository (OSDR), NASA Human Research Program (HRP), ESA COGNISPACE, NASA-STD-3001.
- **License:** MIT License.
