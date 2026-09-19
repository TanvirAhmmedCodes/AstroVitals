# AstroVitals Neuro-Shield

### AI-Powered Astronaut Health Guardian
**NASA Space Apps Challenge 2026** - Team Orbitrix, Dhaka, Bangladesh

> *"A wearable that reads the body. An AI that understands the mind."*

---

## 🎯 The Challenge

**Create Health Monitoring Software for Astronauts on Space Missions**

Long-duration spaceflight missions expose astronauts to deep space galactic cosmic radiation (GCR) and solar particle events (SPE), extreme isolation and confinement, microgravity fluid shifts, and closed spacecraft environments. These stressors induce cardiovascular deconditioning, bone mineral density loss, immune dysregulation, and neurocognitive decline. On missions to Mars or deep space habitats, real-time communications latency (up to 22 minutes one-way) prevents live consultation with Earth-based flight surgeons. Astronauts must monitor, detect, and counter health hazards autonomously.

**AstroVitals Neuro-Shield** provides an intelligent, closed-loop wearable telemetry stream, predictive multi-system ML risk scoring, real-time anomaly detection, radiation dosimetry tracking, cognitive battery assessment, and an autonomous AI health companion (Ori).

---

## 👥 Team Orbitrix

| Member | Role | Responsibility | Contact |
|---|---|---|---|
| **MD Tanvir Ahmmed** | **Team Lead · Full Stack · AI/ML** | Software, ML Models, API Architecture, UI/UX, Everything Code | [Email](mailto:tanvirahmmed13579@gmail.com) |
| **Ishraq Ahmmed** | **Hardware Engineer** | ESP32 Firmware, MAX30102, MLX90614, MPU6050 Sensors | — |
| **Suvajit Kumar Arja** | **Hardware Engineer** | PCB Schematic, Power Management, Circuit Assembly | — |
| **Suborna Akter** | **Documentation Lead** | Technical Documentation, Research Papers, Compliance | — |
| **Fatima Jahan Hitu** | **Videography & Storyboard** | Video Production, Storyboarding, Media Visuals | — |
| **Md. Afzal Hossain** | **QA & System Testing** | System Testing, User Acceptance Testing, QA | — |

**Event:** NASA Space Apps Challenge 2026 - Dhaka Local Event  
**Made by MD Tanvir Ahmmed (Team Lead) · Team Orbitrix**

---

## 🏗️ What AstroVitals Is

AstroVitals is a synchronized two-part spaceflight health system:

### 1. Wearable Layer (ESP32 Edge Device)
- **Photoplethysmography (PPG)**: Heart Rate (BPM) + Blood Oxygen ($SpO_2$) via MAX30102 optical sensor.
- **Infrared Thermometry**: Non-contact Skin Temperature ($^\circ\text{C}$) via MLX90614 / DS18B20.
- **Inertial Measurement (IMU)**: 6-axis acceleration and angular rate via MPU6050 for physical activity tracking.
- **OLED HUD Display**: Live local physiological status via SSD1306 monochrome screen.
- **NVS Local Ring Buffer**: Stores up to 10,000 telemetry frames during orbital comms loss; auto-syncs on reconnection.
- **Edge Telemetry Dispatch**: Transmits periodic JSON payload via Wi-Fi HTTP POST to `/api/v1/ingest/vitals`.

### 2. Web Application (Mission-Grade Cloud Console)
- **Live Vitals Dashboard** - Real-time biometric streaming via Server-Sent Events (SSE) and Firebase Firestore.
- **Risk & Countermeasure Panel** - Multi-system ML risk scoring (Cardiovascular, Sleep/Behavioral, Immune) with NASA HRP countermeasures.
- **Health Trends Calendar** - Continuous GitHub-style heatmap displaying longitudinal autonomic stability and anomaly clusters.
- **Neuro-Shield Cognitive Engine** - Visual reaction time testing (ms), ESA Concordia-calibrated mood survey, and composite cognitive indexing.
- **Ori AI Health Companion** - Warm, personalized conversational assistant powered by Google Gemini (`gemini-3.5-flash-lite`) with live telemetry context injection.
- **Multi-Crew Mission Control** - Fleet-wide grid tracking all 4 active astronauts, real-time alert logs, and South Atlantic Anomaly (SAA) warnings.
- **Digital Twin Simulator** - Forward projection engine simulating 180-day mission health trajectories under adjustable countermeasure regimens.
- **Earth-Side Family Portal** - Reassuring earth-side portal featuring wellness indices and bidirectional orbital heartbeat pings.
- **Cinematic Medical Dossier** - Automated generator for publication-grade, printable multi-page PDF medical reports via ReportLab.
- **Single-Admin Security Console** - Strict single-admin account governance (`tanvirahmmed13579@gmail.com`) with full user lifecycle controls.

---

## 🧠 ML Models (Frozen — Negative $R^2$ Disclosure)

Trained on **NASA Open Science Data Repository (OSDR) Inspiration4** multi-omics and physiological data (4 crew members, 28 longitudinal timepoints). These models are locked and frozen:

| Model File | Target System | Model Architecture | $R^2$ Score | MAE | Status |
|---|---|---|---|---|---|
| `risk_model_cardiovascular.pkl` | Cardiovascular Strain | VotingRegressor (XGBoost + GradientBoosting + RandomForest) | **-0.43** | 22.0 / 100 | Frozen |
| `risk_model_sleep_behavioral.pkl` | Sleep & Behavioral Shift | VotingRegressor (XGBoost + GradientBoosting + RandomForest) | **-0.35** | 24.9 / 100 | Frozen |
| `risk_model_immune.pkl` | Immune Dysregulation | VotingRegressor (XGBoost + GradientBoosting + RandomForest) | **-0.17** | 24.0 / 100 | Frozen |
| `anomaly_detector.pkl` | Real-time Anomaly Detection | IsolationForest (Unsupervised outlier detection) | — | Contamination: 0.05 | Active |

### Why Negative $R^2$?
> **Scientific Integrity over Inflated Claims**: In machine learning, $R^2 < 0$ occurs when sample size is extremely small ($N=28$ biological samples across only 4 civilian astronauts on Inspiration4). Under cross-validation, predicting the population mean achieves a higher $R^2$ than complex non-linear combinations.
> Rather than fabricating synthetic samples to manufacture artificial 99% accuracy scores, **Team Orbitrix chose complete transparency**. In deep space mission medicine, honest uncertainty bounds save astronaut lives. Full disclosure in [`docs/MODEL_README.md`](docs/MODEL_README.md).

---

## 📊 NASA & Space Science Datasets Used

| Dataset / Source | Accession / Reference | Purpose in AstroVitals |
|---|---|---|
| **NASA OSDR Inspiration4** | `OSD-569`, `OSD-570`, `OSD-571`, `OSD-575` | Complete blood count (CBC), plasma cytokines, cfRNA, and physiological records used to train the frozen ML ensemble models. |
| **NASA HRP Evidence Roadmap** | NASA/SP-2009-3405 | Grounding matrix for the 5 Human Spaceflight Hazards: Radiation, Isolation/Confinement, Distance, Gravity Fields, Hostile Environments. |
| **NASA-STD-3001 Vol 1 Rev C** | NASA Space Flight Human-System Standard | Establishes clinical alarm thresholds ($SpO_2 < 92\%$, Heart Rate extremes), career radiation limits ($600\text{ mSv}$), and acoustic limits. |
| **ESA COGNISPACE Norms** | DOI: 10.57780/esa-4wm576m | Cognitive performance benchmarks (mean reaction time 280 ms, standard deviation 45 ms) from parabolic flight and Antarctica Concordia station. |
| **NASA OSDR OSD-918** | GeneLab Omics Archive | Omics evidence for microgravity-induced cardiomyocyte functional remodeling and immune dysregulation. |
| **Launch Library 2 API** | The Space Devs (`thespacedevs.com`) | Real-time global launch manifests, orbital rocket launch countdowns, and launch vehicle specifications. |
| **Open Notify & WhereTheISS** | `api.open-notify.org` & `wheretheiss.at` | Live International Space Station (ISS) orbital coordinates, orbital speed (km/h), altitude, and South Atlantic Anomaly (SAA) tracking. |
| **NASA Astronomy Picture of the Day** | `api.nasa.gov` | Daily deep space imagery and educational context integration. |

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Wearable** | ESP-IDF v5.x / C++ | FreeRTOS tasks, I2C sensor drivers, Wi-Fi HTTP client, NVS flash buffer |
| **Backend** | FastAPI (Python 3.11) | High-performance asynchronous REST API, Pydantic schemas, SQLAlchemy ORM |
| **Database** | SQLite + SQLAlchemy 2.0 | Embedded transactional database with WAL mode |
| **Authentication** | JWT + Passlib (bcrypt 12 rounds) | Secure tokens, role-based access control, Single-Admin policy |
| **Real-Time Data** | Server-Sent Events (SSE) + Firebase | Dual-channel streaming: low-latency SSE plus Firestore cloud sync |
| **Machine Learning** | scikit-learn 1.6.1 + XGBoost 3.2.0 | Frozen voting ensemble regression models and IsolationForest outlier detector |
| **AI Companion** | Google Gemini (`gemini-3.5-flash-lite`) | Context-aware, empathetic medical and operational astronaut companion |
| **Email Service** | Resend API (`resend`) | Automated transactional emails for password resets and critical alerts |
| **PDF Engine** | ReportLab 4.4.10 | Multi-page, publication-grade astronaut medical dossiers with telemetry charts |
| **Rate Limiting** | SlowAPI | Protects ingestion and authentication endpoints from brute-force vectors |
| **Frontend** | React 19 + Vite 8 | Fast single-page application with modern reactive state management |
| **Styling** | TailwindCSS 3.4 + Vanilla CSS | Cinematic dark space UI, HUD brackets, glassmorphism, responsive grid |
| **Visualization** | Recharts 3.10 + Heatmap | Smooth real-time telemetry line charts, radiation gauges, calendar heatmaps |
| **Motion & Audio** | Framer Motion 13 + HTML5 Audio | Fluid UI transitions, loop space ambience, tactile emergency alert sounds |
| **PWA** | Service Worker + Manifest | Installable Progressive Web App with offline caching capabilities |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Global edge CDN frontend and managed containerized cloud backend |

---

## 📁 Complete Repository File Tree

```
AstroVitals/
│
├── README.md                              # Complete Project Documentation & Architecture
├── LICENSE                                # MIT Open Source License
├── .gitignore                             # Ignores .env, *.db, venv, node_modules, secrets
├── .env.example                           # Root Environment Template
├── DEPLOYMENT.md                          # Full Production Deployment Guide (Vercel + Render)
├── RENDER_ENVIRONMENT_VARIABLES.example.md # Render & Cloud Deployment Reference (Sanitized)
├── SECURITY.md                            # Comprehensive Security Policy & Admin Governance
├── AGENT_HANDOFF.md                       # Development Diagnostic & Bug Fix Record
├── MASTER_PROMPT.md                       # System Specification & Architecture Reference
├── Procfile                               # Render / Heroku Web Service Startup Command
├── requirements.txt                       # Top-Level Python Dependencies
│
├── api/                                   # External API Configuration & Credentials
│   ├── ll2_config.txt                     # Launch Library 2 Endpoint Configuration
│   ├── open_notify.txt                    # Open Notify ISS API Reference
│   ├── gemini_api_key.txt                 # (Gitignored) Gemini API Key Storage
│   └── nasa_api_key.txt                   # (Gitignored) NASA Open API Key Storage
│
├── backend/                               # ── FastAPI Application Server ──
│   ├── main.py                            # Application Entrypoint, Middleware & Lifespan
│   ├── config.py                          # Pydantic Settings & Environment Loader
│   ├── database.py                        # SQLAlchemy Engine, Session, & DB Models
│   ├── schemas.py                         # Pydantic Request/Response Validation Schemas
│   ├── limiter.py                         # SlowAPI Rate Limiter Instance
│   ├── requirements.txt                   # Backend Python Dependencies
│   ├── Procfile                           # Render Process Definition
│   ├── render.yaml                        # Render Infrastructure-as-Code Spec
│   ├── check_db.py                        # Database Integrity & Schema Verification Utility
│   ├── test_all_fixes.py                  # Comprehensive Test Suite (17 Verifications)
│   ├── test_phase1.py                     # Phase 1 Test Harness
│   ├── test_phase2.py                     # Phase 2 Test Harness
│   ├── test_phase5_auth.py                # Authentication & JWT Unit Tests
│   ├── test_phase5_fixes.py               # Phase 5 Diagnostic Tests
│   ├── test_sim.py                        # Telemetry Ingestion Test
│   ├── .env.example                       # Backend Environment Template
│   ├── .env                               # (Gitignored) Backend Secrets & API Keys
│   ├── astrovitals.db                     # (Gitignored) Local SQLite Database
│   ├── astrovitals_backup.db              # (Gitignored) Database Backup Snapshot
│   ├── firebase-service-account.json      # (Gitignored) Firebase Admin Service Account Key
│   │
│   ├── middleware/                        # HTTP Middleware Components
│   │   └── auth.py                        # JWT Verification & Single-Admin Guard
│   │
│   ├── migrations/                        # Database Migration Scripts
│   │   └── 001_replace_fake_users.py      # Seed/Migrate Real Crew Profiles
│   │
│   ├── prompts/                           # LLM System Prompts
│   │   └── system_prompt.txt              # Ori AI Companion Personality & Medical Protocols
│   │
│   ├── routers/                           # API Route Handlers
│   │   ├── admin.py                       # Admin Endpoints (Crew Sync, Database Diagnostics)
│   │   ├── alerts.py                      # Alert History & Emergency Beacon Dispatch
│   │   ├── analytics.py                   # Digital Twin Forward Simulation API
│   │   ├── astronaut.py                   # Astronaut Profiles, Metadata & Summary
│   │   ├── auth.py                        # Registration, Login, Token Refresh, Password Reset
│   │   ├── chat.py                        # Ori AI Companion Streaming & History
│   │   ├── cognitive.py                   # Reaction Time & Mood Survey Endpoints
│   │   ├── devices.py                     # ESP32 Device Registration & Heartbeat
│   │   ├── external.py                    # ISS Orbital Tracker, Rocket Launches, NASA APOD
│   │   ├── ingest.py                      # POST /ingest/vitals (Wearable Payload Ingestion)
│   │   ├── radiation.py                   # Cumulative Dosimetry & NASA Limits
│   │   ├── risk.py                        # Composite ML Risk Scoring & Countermeasures
│   │   └── vitals.py                      # Real-time Vitals & Server-Sent Events (SSE)
│   │
│   └── services/                          # Business Logic & External Integrations
│       ├── auth_service.py                # Password Hashing (bcrypt) & JWT Creation
│       ├── email_service.py               # Transactional Email Dispatch via Resend API
│       ├── explainer.py                   # SHAP-Style Feature Importance & Risk Drivers
│       ├── firebase_service.py            # Firebase Admin SDK & Cloud Firestore Sync
│       ├── forecast_service.py            # Digital Twin Trajectory Forecasting Engine
│       ├── gemini_service.py              # Google Gemini API Client (gemini-3.5-flash-lite)
│       ├── iss_tracker.py                 # ISS Tracker with Dual Live Fallbacks & SAA Check
│       ├── model_registry.py              # Frozen ML Model Loader & Inference Engine
│       ├── nasa_service.py                # NASA Open APIs Client (APOD, Horizons)
│       ├── pdf_service.py                 # ReportLab Astronaut Medical Dossier PDF Generator
│       ├── radiation_model.py             # NASA-STD-3001 Dosimetry Accumulator
│       ├── spacex_service.py              # Launch Library 2 Spacecraft & Launch Tracker
│       └── sse_manager.py                 # Multi-Subscriber Server-Sent Events Broadcaster
│
├── frontend/                              # ── React 19 + Vite 8 SPA ──
│   ├── index.html                         # HTML5 Entrypoint, AstroVitals Favicon & Fonts
│   ├── package.json                       # Dependencies, Scripts, Team Orbitrix Authorship
│   ├── package-lock.json                  # Locked NPM Dependency Graph
│   ├── vite.config.js                     # Vite Build Config & Dev Proxy
│   ├── tailwind.config.js                 # Design Tokens, HUD Fonts & Palette Config
│   ├── postcss.config.js                  # TailwindCSS PostCSS Plugin Config
│   ├── vercel.json                        # Vercel SPA Routing & Security Headers
│   ├── .oxlintrc.json                     # Oxlint Linter Configuration
│   ├── README.md                          # Frontend Documentation
│   ├── .env.example                       # Frontend Environment Template
│   ├── .env                               # (Gitignored) Frontend Environment Variables
│   │
│   ├── public/                            # Static Web Assets
│   │   ├── favicon.svg                    # Vector Mission Icon
│   │   ├── icons.svg                      # SVG Icon Sprite
│   │   ├── manifest.json                  # Progressive Web App (PWA) Manifest
│   │   ├── sw.js                          # Service Worker for Offline Resilience
│   │   │
│   │   ├── audios/                        # Audio Assets
│   │   │   ├── space_sound.mp3            # Relaxing Ambient Space Soundscape (Loop)
│   │   │   └── warning_sound.mp3          # Emergency Beacon Alert Sound (Single-Shot)
│   │   │
│   │   ├── images/                        # Branding & Logos
│   │   │   ├── astrovitals_logo.png       # AstroVitals Official Project Logo
│   │   │   └── orbitrix_logo.png          # Team Orbitrix Circular Logo
│   │   │
│   │   └── videos/                        # NASA Public Domain Background Footage
│   │       ├── astronaut-working.mp4      # Astronaut EVA in Microgravity
│   │       ├── astronaut-working-poster.jpg
│   │       ├── earth-from-iss.mp4         # Cupola View of Earth from ISS
│   │       ├── earth-from-iss-poster.jpg
│   │       ├── launch-compilation.mp4     # Orbital Rocket Launch Montage
│   │       ├── launch-compilation-poster.jpg
│   │       ├── mars-surface.mp4           # Rover Perspective on Martian Regolith
│   │       ├── mars-surface-poster.jpg
│   │       ├── nebula-zoom.mp4            # Deep Space Telescope Zoom
│   │       └── nebula-zoom-poster.jpg
│   │
│   └── src/                               # Application Source Code
│       ├── main.jsx                       # React DOM Root & Global Providers
│       ├── App.jsx                        # Route Hierarchy & Layout Composition
│       ├── App.css                        # App-Level Styling
│       ├── index.css                      # Design Tokens, Glassmorphism & Custom Scrollbars
│       │
│       ├── assets/                        # Local Graphics
│       │   ├── hero.png                   # Landing Page Hero Graphic
│       │   ├── react.svg                  # React Logo
│       │   └── vite.svg                   # Vite Logo
│       │
│       ├── components/                    # Modular UI Component Library
│       │   ├── ErrorBoundary.jsx          # UI Crash Isolation Boundary
│       │   ├── SoundProvider.jsx          # Synthesized Audio Feedback Provider
│       │   │
│       │   ├── auth/                      # Authentication Components
│       │   │   └── ProtectedRoute.jsx     # Route Guard with JWT & Role Checking
│       │   │
│       │   ├── cinematic/                 # Space Cinematic & Canvas Components
│       │   │   ├── AmbientSoundToggle.jsx # Fixed Floating Ambience Mute/Unmute Button
│       │   │   ├── AnomalyBar.jsx         # Global Slide-Down Outlier Alert Bar
│       │   │   ├── BootScreen.jsx         # HUD Startup Sequence Animation
│       │   │   ├── CornerBracket.jsx      # Sci-Fi Decorative Corner Reticles
│       │   │   ├── EarthCurvature.jsx     # Cinematic Earth Limb SVG Curve
│       │   │   ├── HUDFrame.jsx           # Global Futuristic Viewport Border
│       │   │   ├── ISSTrackerWidget.jsx   # Live ISS Orbit Widget (Live vs Simulated Badge)
│       │   │   ├── Starfield.jsx          # Dynamic HTML5 Canvas Procedural Starfield
│       │   │   └── VideoBackground.jsx    # Smooth Cross-Fading NASA Video Player
│       │   │
│       │   ├── common/                    # Generic UI Primitives
│       │   │   ├── Badge.jsx              # Status Pill Badge
│       │   │   ├── Button.jsx             # Mission Button with Glow Variants
│       │   │   ├── Card.jsx               # Glassmorphic Card Container
│       │   │   ├── Modal.jsx              # Accessible Dialog Overlay
│       │   │   ├── Skeleton.jsx           # Loading Skeleton Shimmer
│       │   │   └── Spinner.jsx            # Orbital Loading Spinner
│       │   │
│       │   ├── dashboard/                 # Dashboard Panels
│       │   │   ├── AIChatPreview.jsx      # Compact Ori AI Telemetry Snapshot
│       │   │   ├── NASADataPanel.jsx      # Interactive Scientific Reference Modal
│       │   │   └── RiskPanel.jsx          # 3-System Risk Cards with Feature Drivers
│       │   │
│       │   ├── layout/                    # Layout Shell & Navigation
│       │   │   ├── BottomNav.jsx          # Mobile Viewport Sticky Navigation
│       │   │   ├── Layout.jsx             # Shell Wrapper with Sidebar, TopBar, & Footer
│       │   │   ├── Sidebar.jsx            # Collapsible Navigation Drawer
│       │   │   └── TopBar.jsx             # Crew Switcher, Emergency Alarm, & Orbitrix Badge
│       │   │
│       │   ├── ori/                       # Ori AI Health Companion
│       │   │   ├── OriAvatar.jsx          # Expressive SVG Avatar with Emotion States
│       │   │   ├── OriButton.jsx          # Floating Companion Launch Button
│       │   │   ├── OriChatDrawer.jsx      # Slide-In Chat Drawer with Audio Synthesis
│       │   │   ├── OriProvider.jsx        # Ori Global State & Context Provider
│       │   │   ├── OriStyles.css          # Pulse & Glowing Halo Keyframe Animations
│       │   │   └── OriWelcomeModal.jsx    # First-Time Briefing Modal
│       │   │
│       │   └── vitals/                    # Physiological Widgets
│       │       ├── RadiationGauge.jsx     # Radial Arc Dosimetry Gauge (NASA 600 mSv Limit)
│       │       ├── TelemetryWave.jsx      # Simulated Real-Time ECG / PPG Canvas Wave
│       │       └── VitalsTile.jsx         # Metric Card with Trend Micro-Chart
│       │
│       ├── config/                        # Frontend Configuration
│       │   └── videos.js                  # Video Catalog & Manifest
│       │
│       ├── hooks/                         # Custom React Hooks
│       │   ├── useAmbientSound.js         # Real Audio Space Ambience Controller Hook
│       │   └── useFirestore.js            # Real-Time Firestore Document Subscription Hook
│       │
│       ├── i18n/                          # Internationalization
│       │   ├── index.js                   # i18next Setup
│       │   └── en.json                    # English Mission Terminology Strings
│       │
│       ├── lib/                           # Utility & Client Libraries
│       │   ├── ambientSound.js            # Real Audio Player for Ambient Space Soundscape
│       │   ├── emergencySound.js          # Audio Player for Emergency Alarm Alert
│       │   ├── api.js                     # Axios HTTP Client with JWT Interceptors
│       │   ├── auth.js                    # Local Storage Token Helpers
│       │   ├── firebase.js                # Firebase Web App Initialization & Firestore
│       │   ├── sounds.js                  # Mission Audio SFX Engine (Web Audio API)
│       │   └── sse.js                     # Server-Sent Events Reconnecting Stream Listener
│       │
│       ├── pages/                         # Application Views
│       │   ├── AdminDashboard.jsx         # Single-Admin User Management & DB Diagnostics
│       │   ├── ChangePasswordPage.jsx     # Authenticated User Credential Update
│       │   ├── ChatCompanion.jsx          # Full-Screen Ori AI Companion Console
│       │   ├── Dashboard.jsx              # Main Command Center & Vitals Summary
│       │   ├── DigitalTwin.jsx            # 180-Day Countermeasure Trajectory Simulator
│       │   ├── FamilyPortal.jsx           # Earth-Side Loved-One Dashboard & Messaging
│       │   ├── ForgotPasswordPage.jsx     # Password Recovery Email Request
│       │   ├── HealthTrends.jsx           # Longitudinal Calendar Heatmap & Historical Charts
│       │   ├── LandingPage.jsx            # Public Hero View, Team Orbitrix Credits & Features
│       │   ├── LiveVitals.jsx             # Live Telemetry Stream, Recharts, & Radiation Gauge
│       │   ├── LoginPage.jsx              # Secure Sign-In View
│       │   ├── MedicalDossier.jsx         # Clinical Health Dossier & PDF Export Trigger
│       │   ├── MissionControl.jsx         # Fleet Health Grid & South Atlantic Anomaly Radar
│       │   ├── NeuroShield.jsx            # Reaction Time Test & Daily Mood Survey Battery
│       │   ├── NotFoundPage.jsx           # 404 Orbital Lost View
│       │   ├── PhasePlaceholder.jsx       # Diagnostic Fallback Route
│       │   ├── RegisterPage.jsx           # Crew Account Registration
│       │   ├── ResetPasswordPage.jsx      # Token-Validated Password Reset
│       │   ├── Settings.jsx               # Audio Volume, Telemetry Rate & Profile Settings
│       │   └── VerifyEmailPage.jsx        # Verification Route
│       │
│       └── store/                         # Global State (Zustand)
│           ├── useAuthStore.js            # Current User, JWT Token, Role & Auth Lifecycle
│           └── useMissionStore.js         # Crew State, Live Vitals, Active Alarms, Simulation
│
├── models/                                # ── Locked & Frozen ML Models ──
│   ├── risk_model_cardiovascular.pkl      # VotingRegressor (XGB + GBR + RF)
│   ├── risk_model_sleep_behavioral.pkl    # VotingRegressor (XGB + GBR + RF)
│   ├── risk_model_immune.pkl              # VotingRegressor (XGB + GBR + RF)
│   ├── anomaly_detector.pkl               # IsolationForest Anomaly Model
│   ├── baseline_stats.json                # Population Mean & Standard Deviation Baselines
│   ├── cognitive_norms.json               # ESA Concordia Cognitive Baselines
│   ├── feature_columns.json               # Input Feature Ordering & Names
│   ├── metrics.json                       # Validation Metrics & Honest R² Scores
│   └── model_metadata.json                # Model Hyperparameters & Training Timestamps
│
├── data/                                  # ── NASA Datasets (Gitignored - 200 MB) ──
│   ├── training_table.csv                 # Cleaned Pre-processed Multi-Omics Dataset
│   └── osdr_i4/                           # NASA OSDR Inspiration4 Archives
│       ├── OSD 569/                       # Inspiration4 Complete Blood Count (CBC)
│       ├── OSD 570/                       # Inspiration4 Single-Cell RNA Sequencing
│       ├── OSD 571/                       # Inspiration4 Plasma Cytokines & cfRNA
│       └── OSD 575/                       # Inspiration4 Multiplex Serum Biomarkers
│
├── training/                              # ML Training Pipeline
│   └── training_pipeline.py               # Reproducible Training & Evaluation Pipeline
│
├── scripts/                               # Simulation & Maintenance Tools
│   ├── simulate_wearable.py               # Realistic Multi-Astronaut Biometric Simulator
│   ├── set_admin.py                       # Single-Admin Provisioning Script
│   └── verify_sanitization.py             # Telemetry Value Range & NaN Verifier
│
└── docs/                                  # In-Depth Documentation
    ├── DEVELOPMENT.md                     # Local Setup & Contribution Guide
    ├── FIREBASE_ARCHITECTURE.md           # Firestore Real-time Sync Specification
    ├── HRP_REFERENCE.md                   # NASA Human Research Program Hazard Catalog
    ├── MODEL_README.md                    # Machine Learning Methodology & R² Disclosure
    └── RADIATION_LIMITS.md                # NASA-STD-3001 Radiation Limits Reference
```

---

## 🚀 Local Development

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** / **NPM 9+** installed
- **Git**

### 1. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI development server
python -m uvicorn main:app --reload --port 8080
```
- **Backend URL**: [http://localhost:8080](http://localhost:8080)
- **Interactive Swagger Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **ReDoc Documentation**: [http://localhost:8080/redoc](http://localhost:8080/redoc)

### 2. Frontend Setup
```powershell
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)

### 3. Wearable Telemetry Simulator
To test live streaming vitals without physical ESP32 hardware:
```powershell
# Open a new terminal and navigate to scripts directory
cd scripts

# Activate backend virtual environment
..\backend\venv\Scripts\Activate.ps1

# Run simulator across all 4 astronauts at 1-second cadence
python simulate_wearable.py --all-astronauts --rate 1
```

---

## ☁️ Production Deployment

### 1. Vercel (Frontend Deployment)
Deploy **only** the `frontend/` directory to Vercel.

- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Required Environment Variables (Vercel Dashboard)**:
```env
VITE_API_BASE_URL=https://astrovitals.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=astrovitals.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=astrovitals
VITE_FIREBASE_MESSAGING_SENDER_ID=1049915567750
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-P69YXM6GYK
```

**Files Vercel Requires**:
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/postcss.config.js`
- `frontend/vercel.json`
- `frontend/index.html`
- `frontend/public/` (Audio files, images, videos, PWA manifest)
- `frontend/src/` (Entire application source code)

---

### 2. Render (Backend Deployment)
Deploy the root repository or `backend/` directory as a **Web Service** on Render.

- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Root Directory**: `.` (Repository root so that `models/` is accessible)

**Required Environment Variables (Render Dashboard)**:
```env
GEMINI_API_KEY=your_google_gemini_api_key
NASA_API_KEY=your_nasa_open_api_key
RESEND_API_KEY=your_resend_api_key
JWT_SECRET_KEY=generate_a_secure_64_character_hex_secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
DATABASE_URL=sqlite:///./astrovitals.db
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8080
CORS_ORIGINS=https://astrovitals.vercel.app,http://localhost:5173
FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=tanvirahmmed13579@gmail.com
ADMIN_INITIAL_PASSWORD=YourSecureAdminPassword2026!
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"astrovitals",...}
```

**Files Render Requires**:
- `backend/` (All routers, services, middleware, schemas, database, config, prompts)
- `models/` (All `.pkl` and `.json` model files — accessed by `backend/services/model_registry.py`)

---

## 🔐 Security Architecture

- **Password Hashing**: Salted `bcrypt` hashing with 12 computational rounds via Passlib.
- **Session Tokens**: Cryptographically signed JSON Web Tokens (JWT) using HS256 with 7-day expiration.
- **Single-Admin Policy**: Hardened RBAC restriction ensuring only the verified commander (`tanvirahmmed13579@gmail.com`) can access administrative, database inspection, and crew provisioning routes.
- **Secret Isolation**: All credentials, API keys, SQLite databases, and Google Cloud service account keys are strictly gitignored and managed exclusively via environment variables.
- **Rate Limiting**: Protects against automated volumetric attacks on authentication and ingest endpoints using SlowAPI.
- See [`SECURITY.md`](SECURITY.md) for full vulnerability reporting and security protocols.

---

## 📜 Credits & Attributions

### Team Orbitrix (NASA Space Apps Challenge 2026 — Dhaka, Bangladesh)
- **Software, ML Models, Full-Stack Architecture**: **MD Tanvir Ahmmed** (Team Lead)
- **Hardware & Sensor Integration**: **Ishraq Ahmmed**
- **Hardware & PCB Assembly**: **Suvajit Kumar Arja**
- **Documentation Lead**: **Suborna Akter**
- **Videography & Storyboarding**: **Fatima Jahan Hitu**
- **QA & Testing**: **Md. Afzal Hossain**

**Lead Developer & System Architect:** MD Tanvir Ahmmed  
**Organization:** Team Orbitrix  
**Event:** NASA Space Apps Challenge 2026, Dhaka Local Event  

---

## 📄 License

This project is licensed under the **MIT License** - see the [`LICENSE`](LICENSE) file for complete details.

---

*AstroVitals Neuro-Shield - because the next frontier starts with a heartbeat.*