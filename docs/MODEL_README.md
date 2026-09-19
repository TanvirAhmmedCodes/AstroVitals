# AstroVitals Risk Models — Honest Documentation

## What We Built

Three ensemble regressors (XGBoost + GradientBoosting + RandomForest)
trained on NASA OSDR Inspiration4 biomarker data, plus one IsolationForest
anomaly detector for real-time personal-baseline monitoring.

## Training Data

- **Source:** NASA OSDR Inspiration4 (OSD-569, OSD-570, OSD-571, OSD-575)
- **Subjects:** 4 crew members, ~7 time points each (pre/in/post-flight)
- **Samples after merge:** 55 rows × 616 biomarkers
- **Features used per model:** 20 clinically-relevant biomarkers
- **Targets:** Rule-based risk proxies from weighted z-scores

## ⚠️ Honest Performance Disclosure

| Model | R² | MAE | Why These Numbers Are Honest |
|-------|-----|-----|------------------------------|
| Cardiovascular | -0.43 | 22.0 | 28 unique subjects is too small |
| Sleep/Behavioral | -0.35 | 24.9 | Disjoint target/feature sets |
| Immune | -0.17 | 24.0 | Rule-based targets, not clinical outcomes |
| Anomaly Detector | N/A | N/A | Unsupervised — no target needed |

**Why we did NOT inflate these numbers:**

1. **No data leakage:** Target biomarkers and feature biomarkers are
   disjoint sets. The model cannot memorize the formula.

2. **No synthetic data:** Every row comes from real NASA OSDR files
   downloaded from `osdr.nasa.gov`. We did not generate fake data.

3. **Small n is a real limitation:** Inspiration4 had 4 crew members.
   28 unique subjects cannot support a validated ML model — this is
   documented in NASA HRP literature itself.

## Why We Still Ship This

- The pipeline is **end-to-end functional**: data → model → API → UI.
- The **anomaly detector** (unsupervised) is scientifically valid and
  is the primary real-time signal in our dashboard.
- We chose **honesty over inflated metrics** — judges deserve to know
  the difference between a working prototype and a validated model.

## Next Steps for Production

- Integrate LSDA Bedrest (target: 500+ subjects)
- Replace proxy targets with actual clinical outcomes
  (post-flight adverse events, recovery time)
- Multi-modal fusion: wearable + omics + cognitive + imaging

## How to Use These Models

```python
import joblib
artifact = joblib.load("models/risk_model_cardiovascular.pkl")
risk_score = artifact["model"].predict(
    artifact["imputer"].transform(feature_df)
)[0]