# AstroVitals Neuro-Shield - Production Deployment Guide

AstroVitals is architected for decoupled cloud deployment:
- **Frontend (SPA/PWA):** Deployed to **Vercel** (Global Edge CDN)
- **Backend (FastAPI & ML Registry):** Deployed to **Render** (Python Web Service)

---

## 1. Environment Variable Matrix

| Variable | Platform | Scope | Description | Sample / Default |
|:---|:---|:---|:---|:---|
| `VITE_API_BASE_URL` | Vercel (Frontend) | **Public** | URL to the deployed backend | `https://astrovitals.onrender.com` |
| `VITE_APP_NAME` | Vercel (Frontend) | **Public** | Brand application title | `AstroVitals` |
| `VITE_AUTHOR` | Vercel (Frontend) | **Public** | Lead developer credit | `MD Tanvir Ahmmed` |
| `GEMINI_API_KEY` | Render (Backend) | **Secret** | Google Gemini API Key for Ori | `AIzaSy...` (from Google AI Studio) |
| `NASA_API_KEY` | Render (Backend) | **Secret** | NASA Open Data API Key | `DEMO_KEY` or custom key from api.nasa.gov |
| `RESEND_API_KEY` | Render (Backend) | **Secret** | Resend API Key for transactional email | `re_...` (from resend.com) |
| `JWT_SECRET_KEY` | Render (Backend) | **Secret** | Cryptographic secret for signing tokens | High-entropy 64-char hex string |
| `JWT_ALGORITHM` | Render (Backend) | Config | JWT hashing algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Render (Backend) | Config | Token lifespan before refresh | `10080` (7 days) |
| `DATABASE_URL` | Render (Backend) | Config | SQLAlchemy connection URI | `sqlite:///./astrovitals.db` |
| `CORS_ORIGINS` | Render (Backend) | Config | Allowed origin domains (comma-separated)| `https://astrovitals.vercel.app,http://localhost:5173` |
| `FROM_EMAIL` | Render (Backend) | Config | Verified sender email for alerts | `onboarding@resend.dev` or custom domain |
| `ADMIN_EMAIL` | Render (Backend) | Config | Designee with exclusive admin rights | `tanvirahmmed13579@gmail.com` |
| `ADMIN_INITIAL_PASSWORD`| Render (Backend) | **Secret** | Temporary seed password for admin | `ChangeMe123!` (forces change on login) |
| `BACKEND_PORT` | Render (Backend) | Config | Port for local testing or container | `8080` (Render overrides with `$PORT`) |
| `AUTHOR` | Render (Backend) | Config | System author credit | `MD Tanvir Ahmmed` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Render (Backend) | **Secret** | Single-line Firebase Admin Service Account JSON | `{"type": "service_account", ...}` |
| `VITE_FIREBASE_API_KEY` | Vercel (Frontend) | **Public** | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Vercel (Frontend) | **Public** | Firebase Auth domain | `astrovitals.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Vercel (Frontend) | **Public** | Firestore Project ID | `astrovitals` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Vercel (Frontend)| **Public**| Firebase messaging sender ID | `1049915567750` |
| `VITE_FIREBASE_APP_ID` | Vercel (Frontend) | **Public** | Firebase Web application ID | `1:1049915567750:web:...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Vercel (Frontend)| **Public** | Firebase Measurement / Analytics ID | `G-P69YXM6GYK` |

> [!IMPORTANT]
> **Public vs Private Variables**: All variables prefixed with `VITE_` are embedded into the client-side browser bundle at build time. Never place `FIREBASE_SERVICE_ACCOUNT_JSON`, JWT secrets, or backend passwords in frontend `.env` files or Vercel public settings.

---

## 2. Frontend Deployment (Vercel)

The AstroVitals frontend is built with React 19 and Vite, styled with Tailwind CSS, and optimized with PWA offline assets.

### Step-by-Step Instructions

1. Log in to your [Vercel Dashboard](https://vercel.com) and click **Add New... $\rightarrow$ Project**.
2. Import your GitHub repository (`AstroVitals`).
3. In the project setup configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   ```text
   VITE_API_BASE_URL = https://astrovitals.onrender.com
   VITE_APP_NAME = AstroVitals
   VITE_AUTHOR = MD Tanvir Ahmmed

   # Firebase Client Config (Public / Safe for Web)
   VITE_FIREBASE_API_KEY = your_firebase_web_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = your_project_id
   VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
   VITE_FIREBASE_APP_ID = your_app_id
   VITE_FIREBASE_MEASUREMENT_ID = your_measurement_id
   ```
5. Click **Deploy**.
6. Single Page App (SPA) routing is governed by [`frontend/vercel.json`](file:///e:/Nasa%20Space%20Apps%20Resources/AstroVitals/frontend/vercel.json):
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

---

## 3. Backend Deployment (Render)

The AstroVitals backend runs FastAPI on Python 3.11+ with frozen scikit-learn and XGBoost model artifacts.

### Option A: Automatic Blueprint Deployment (Recommended)

1. Log in to [Render](https://render.com).
2. Go to **Blueprints** $\rightarrow$ **New Blueprint Instance**.
3. Connect your repository (Render automatically detects root [`render.yaml`](file:///e:/Nasa%20Space%20Apps%20Resources/AstroVitals/render.yaml)).
4. Fill in the prompted secret values (`GEMINI_API_KEY`, `NASA_API_KEY`, `RESEND_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`).
5. Click **Apply**.

### Option B: Manual Web Service Setup

1. From the Render dashboard, click **New + $\rightarrow$ Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name:** `astrovitals-backend`
   - **Region:** Any (e.g. Frankfurt, Oregon, Singapore)
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In the **Environment Variables** tab, add all keys from `backend/.env.example`, including:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: Copy the single-line JSON content from `firebase-service-account.json`.
5. Click **Create Web Service**.

---

## 4. Firebase Configuration (Firestore Real-Time Layer)

AstroVitals features real-time synchronization via Google Cloud Firestore (`asia-southeast1`, Singapore).

### Prerequisites & Credentials
1. **Firestore Database**: Created in Native Mode in `asia-southeast1`.
2. **Authentication**: Anonymous authentication enabled (for ESP32 device pairing).
3. **Storage**: Completely skipped (paid tier avoided).
4. **Service Account Key**:
   - Generated from Firebase Console $\rightarrow$ Project Settings $\rightarrow$ Service accounts $\rightarrow$ Generate new private key.
   - For Render: Compacted into a single line and added to `FIREBASE_SERVICE_ACCOUNT_JSON`.
5. **Client Config**: Public variables added to Vercel dashboard (`VITE_FIREBASE_*`).

---

## 5. Post-Deployment Verification

### 1. Backend Health Check
Verify your backend is operational by visiting:
```bash
curl https://your-backend.onrender.com/api/v1/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "AstroVitals Neuro-Shield API",
  "version": "1.0.0",
  "models_loaded": true,
  "timestamp": "2026-09-19T..."
}
```

### 2. CORS Verification
Ensure `CORS_ORIGINS` in your Render backend settings includes the exact production URL assigned by Vercel (e.g. `https://astrovitals.vercel.app`):
```text
CORS_ORIGINS=https://astrovitals.vercel.app,http://localhost:5173
```

### 3. Admin Initialization
Log in with `tanvirahmmed13579@gmail.com` and the initial password set in `ADMIN_INITIAL_PASSWORD`. The application will immediately prompt you to set a strong custom password via `/change-password`.

---

## 5. Troubleshooting & Common Errors

| Issue | Root Cause | Solution |
|:---|:---|:---|
| **CORS Network Error on Login** | Backend `CORS_ORIGINS` does not match frontend domain | Add your exact Vercel URL to `CORS_ORIGINS` in Render settings (no trailing slash). |
| **404 on Page Refresh on Vercel** | Missing SPA rewrite rules | Ensure [`frontend/vercel.json`](file:///e:/Nasa%20Space%20Apps%20Resources/AstroVitals/frontend/vercel.json) exists with rewrite `{"source": "/(.*)", "destination": "/index.html"}`. |
| **Model Loading Warning on Startup** | Serialized XGBoost pickle version variance | Normal operational warning; `ModelRegistry` successfully initializes and verifies model hashes. |
| **Ori Responses Fallback to Offline** | `GEMINI_API_KEY` missing or quota exceeded | Check Render environment variables and verify the Google AI Studio key is active. |
| **Verification Emails Not Received** | Resend API key missing or unverified domain | Using `onboarding@resend.dev` delivers to the account owner's email. For production, add and verify a custom domain in Resend. |

---

*Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026*
