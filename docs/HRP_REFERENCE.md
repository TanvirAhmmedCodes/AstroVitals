# NASA Human Research Program (HRP) - Complete Reference
# For AstroVitals Neuro-Shield Project
# Source: https://humanresearchroadmap.nasa.gov
# Compiled: September 2026

---

## 1. THE FIVE HRP HAZARDS OF HUMAN SPACEFLIGHT

NASA's Human Research Program identifies five primary hazards that astronauts face
during long-duration missions. Every risk category in AstroVitals maps to one of these.

### Hazard 1: SPACE RADIATION
**Definition:** Exposure to galactic cosmic rays (GCR), solar particle events (SPE),
and trapped radiation in Earth's magnetic field. Unlike Earth, spacecraft do not have
the atmosphere and magnetosphere to shield crew.

**Health effects:**
- Cancer risk (carcinogenesis)
- Central nervous system damage (cognitive decline, memory loss)
- Cardiovascular degeneration
- Degenerative tissue effects (cataracts, premature aging)
- Acute radiation syndrome (during SPE)

**NASA career exposure limits (NASA-STD-3001):**
- Total career effective dose: 600 mSv (universal, all ages/sexes)
- 1-year mission limit: depends on age/sex
- SPE (solar particle event) mission limit: 250 mSv

**AstroVitals mapping:**
- Risk Category: "Radiation Dose Risk"
- Source of calibration: NASA-STD-3001, Vol 1, Rev C
- Sensor proxy: NOAA SWPC space weather telemetry, NASA-STD-3001 reference dosimetry, and analog fixtures
- Tracked via: radiation_dose_uSv_cumulative

---

### Hazard 2: ISOLATION AND CONFINEMENT
**Definition:** Astronauts live in confined, isolated environments for months to years
with the same small crew, no privacy, and limited communication. This affects
psychological and behavioral health.

**Health effects:**
- Sleep loss and circadian rhythm disruption
- Mood disorders (depression, anxiety)
- Cognitive performance decrements
- Team cohesion problems
- Conflict and stress
- "Asteroid" or "break-off" phenomena in extreme cases

**Evidence from analog environments:**
- Antarctic winter-over studies (Concordia, Vostok)
- Mars-500 isolation experiment (520 days)
- HERA (Human Exploration Research Analog) missions
- ISS Expeditions

**AstroVitals mapping:**
- Risk Category: "Sleep/Behavioral Risk"
- Sensor proxy: HRV patterns, activity patterns, cognitive test scores
- Neuro-Shield: 20-second reaction time test + mood survey
- Data source: ESA COGNISPACE (reference), Inspiration4 behavioral surveys

---

### Hazard 3: DISTANCE FROM EARTH
**Definition:** As missions travel to the Moon or Mars, communication delays increase
(from seconds to 22 minutes one-way for Mars). Crew must operate with increasing
autonomy and cannot rely on ground medical support.

**Health effects:**
- Delayed medical decision-making
- Loss of real-time ground support
- Psychological isolation (feelings of remoteness)
- Inability to evacuate in medical emergencies
- Need for autonomous medical care

**Communication delays:**
- Earth-Moon: ~1.3 seconds one-way
- Earth-Mars: 4-22 minutes one-way (varies with orbital position)

**AstroVitals mapping:**
- Risk Category: "Cognitive Resilience Risk (Neuro-Shield)"
- Design principle: Edge-AI offline NVS buffering mirrors autonomous operation
- Design principle: Explainable alerts replace ground medical support
- Data source: ESA COGNISPACE cognitive performance data

---

### Hazard 4: GRAVITY (ALTERED GRAVITY / MICROGRAVITY)
**Definition:** Astronauts experience microgravity (~0g on ISS) or partial gravity
(0.16g Moon, 0.38g Mars). The body adapts to weightlessness, causing major
deconditioning over time.

**Health effects:**
- **Cardiovascular deconditioning:** Heart atrophy, reduced stroke volume,
  orthostatic intolerance (can't stand on return to Earth), HRV changes
- **Muscle atrophy:** Loss of muscle mass, especially in legs and back
  (~20% loss in long missions without countermeasures)
- **Bone loss:** 1-2% bone mineral density loss per month in weight-bearing bones
- **SANS (Spaceflight Associated Neuro-ocular Syndrome):** Vision changes, fluid shifts
- **Vestibular dysfunction:** Space motion sickness, balance issues
- **Fluid shifts:** Puffy face, bird legs, increased intracranial pressure

**Evidence from analog studies:**
- UTMB Bedrest Campaign 1, 3, 70-day studies
- ESA HDT (head-down tilt) bedrest campaigns
- JAXA HDT bedrest meta-analysis
- ISS crew data

**AstroVitals mapping:**
- Risk Category: "Cardiovascular & Musculoskeletal Risk"
- Sensor proxy: HR, HRV (SDNN, RMSSD), activity magnitude
- Data source: OSDR I4 (CRP, Fibrinogen, IL6), LSDA Bedrest (reference)
- Explainability: HRV decline → resistance-band countermeasure

---

### Hazard 5: HOSTILE / CLOSED ENVIRONMENT
**Definition:** The spacecraft is a closed-loop environment with recycled air, water,
and limited microbial diversity. This creates unique stressors on the immune system.

**Health effects:**
- **Immune dysregulation:** T-cell function changes, latent virus reactivation
  (EBV, CMV, VZV), altered cytokine profiles
- **Microbial changes:** Shifts in microbiome (gut, skin), increased pathogen
  virulence, reduced microbial diversity
- **Environmental toxins:** CO2 buildup, volatile organic compounds
- **Circadian disruption:** Artificial lighting, no natural day/night cycle
- **Physical confinement:** Limited hygiene, close quarters

**Immune findings from spaceflight:**
- Latent virus reactivation in ~50% of astronauts (EBV, CMV)
- Reduced T-cell proliferation
- Altered cytokine production (IL-6, TNF-α often elevated)
- Monocyte function changes
- Neutrophil changes

**AstroVitals mapping:**
- Risk Category: "Immune Risk"
- Sensor proxy: skin temp (fever indicator), HRV, activity
- Data source: OSDR I4 (IL6, TNF, IL10, IL12, IFNG, IL17), OSD-918
- Explainability: elevated IL6 + altered WBC → anti-inflammatory countermeasure

---

## 2. NASA HRP RISKS (detailed, per hazard)

The HRP Roadmap lists ~30 specific risks organized into the 5 hazards. Here are the
risks most relevant to AstroVitals (wearable-monitorable):

### Category: Cardiovascular
| Risk ID | Risk Name | Wearable-observable? |
|---|---|---|
| CV1 | Cardiovascular deconditioning (from altered gravity) | ✅ HR, HRV, BP |
| CV2 | Arrhythmias | ✅ HR, ECG |
| CV3 | Orthostatic intolerance on reentry | ⚠️ Indirect |
| CV4 | Radiation-induced cardiovascular disease | ⚠️ Cumulative dose |

### Category: Sleep/Behavioral
| Risk ID | Risk Name | Wearable-observable? |
|---|---|---|
| SB1 | Sleep loss and circadian desynchronization | ✅ Actigraphy, HRV |
| SB2 | Behavioral health and performance decrements | ✅ Cognitive tests |
| SB3 | Team cohesion and communication problems | ⚠️ Not wearable |
| SB4 | Fatigue-related performance errors | ✅ Reaction time |

### Category: Immune
| Risk ID | Risk Name | Wearable-observable? |
|---|---|---|
| IM1 | Immune system dysregulation | ⚠️ Indirect (via cytokines) |
| IM2 | Latent virus reactivation | ⚠️ Requires lab |
| IM3 | Microbial changes and pathogen virulence | ❌ Not wearable |
| IM4 | Host-microbiome interactions | ❌ Not wearable |

### Category: Radiation
| Risk ID | Risk Name | Wearable-observable? |
|---|---|---|
| RA1 | Carcinogenesis from GCR/SPE | ⚠️ Cumulative dose only |
| RA2 | CNS damage (cognitive decline) | ⚠️ Via cognitive tests |
| RA3 | Degenerative tissue effects | ❌ Not wearable |
| RA4 | Acute radiation syndrome | ⚠️ Only during SPE |

### Category: Musculoskeletal
| Risk ID | Risk Name | Wearable-observable? |
|---|---|---|
| MS1 | Muscle atrophy | ✅ Activity, IMU data |
| MS2 | Bone mineral density loss | ❌ Needs DXA |
| MS3 | Muscle performance loss | ✅ Activity patterns |

---

## 3. COUNTERMEASURES (for explainer.py)

These are NASA-documented countermeasures associated with each risk category.
AstroVitals uses these to generate plain-language suggestions.

```python
HRP_COUNTERMEASURES = {
    "cardiovascular": {
        "display_name": "Cardiovascular Risk",
        "hrp_hazard": "Altered Gravity",
        "patterns": [
            "Sustained HRV decline (SDNN < 30ms)",
            "Elevated resting HR",
            "Elevated inflammatory markers (CRP, IL6)",
            "Reduced activity magnitude",
        ],
        "countermeasures": [
            "Resistance-band exercise: 30 min/day, focus on lower body",
            "Lower-body negative pressure (LBNP) if available",
            "2x daily isometric squats",
            "1L electrolyte solution with each exercise session",
            "Track orthostatic tolerance weekly (sit-to-stand test)",
        ],
        "evidence_source": "HRP Cardiovascular Risk Evidence Report",
        "evidence_url": "https://humanresearchroadmap.nasa.gov/risks/",
    },
    
    "sleep_behavioral": {
        "display_name": "Sleep/Behavioral Risk",
        "hrp_hazard": "Isolation & Confinement",
        "patterns": [
            "Reduced HRV during sleep hours",
            "Circadian rhythm desynchronization",
            "Low mood score on survey",
            "Slow reaction time (>400ms)",
            "Elevated stress markers (cortisol, IL6)",
        ],
        "countermeasures": [
            "Guided breathing: 10 min, 4-7-8 pattern before sleep",
            "Strict sleep hygiene: fixed bedtime, blue light reduction",
            "Cognitive behavioral techniques for mood",
            "Weekly video call with family/ground support",
            "12-min yoga or stretching session",
        ],
        "evidence_source": "HRP Behavioral Health & Performance Evidence Report",
        "evidence_url": "https://humanresearchroadmap.nasa.gov/risks/",
    },
    
    "immune": {
        "display_name": "Immune Risk",
        "hrp_hazard": "Hostile/Closed Environment",
        "patterns": [
            "Elevated IL6, TNF, CRP, IL10",
            "Altered WBC (neutrophils, lymphocytes)",
            "Elevated skin temperature",
            "Reduced HRV",
            "Poor wound healing",
        ],
        "countermeasures": [
            "Anti-inflammatory nutrition: omega-3, curcumin",
            "Moderate exercise (avoid overtraining)",
            "Adequate vitamin D and zinc intake",
            "Immune-boosting sleep (7-8 hrs)",
            "Regular hand hygiene and air quality monitoring",
        ],
        "evidence_source": "HRP Immune/Microbial Evidence Report",
        "evidence_url": "https://humanresearchroadmap.nasa.gov/risks/",
    },
    
    "cognitive": {
        "display_name": "Cognitive Resilience",
        "hrp_hazard": "Distance from Earth",
        "patterns": [
            "Slow reaction time (>400ms)",
            "Variable reaction time (high std dev)",
            "Cognitive errors on memory tests",
            "Reduced HRV during cognitive tasks",
            "Low mood + low alertness",
        ],
        "countermeasures": [
            "Daily 15-min cognitive training (dual n-back)",
            "Autonomous decision-making drills",
            "Mindfulness meditation (10 min)",
            "Physical exercise for BDNF boost",
            "Scheduled social contact with crew",
        ],
        "evidence_source": "HRP Behavioral Health & Performance Evidence Report",
        "evidence_url": "https://humanresearchroadmap.nasa.gov/risks/",
    },
    
    "radiation": {
        "display_name": "Radiation Dose Risk",
        "hrp_hazard": "Space Radiation",
        "patterns": [
            "Cumulative dose approaching 600 mSv career limit",
            "Dose rate spike during SPE",
            "Dose rate >2x baseline over South Atlantic Anomaly",
        ],
        "countermeasures": [
            "Move to radiation-shielded area during SPE",
            "Sleep in most-shielded part of spacecraft",
            "Use water/liquid shielding when possible",
            "Monitor SPE forecasts from space weather agencies",
            "Reduce EVA during high-radiation periods",
        ],
        "evidence_source": "HRP Space Radiation Evidence Report + NASA-STD-3001",
        "evidence_url": "https://humanresearchroadmap.nasa.gov/risks/",
    },
}