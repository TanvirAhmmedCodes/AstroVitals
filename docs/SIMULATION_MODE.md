# AstroVitals Demonstration Mode & Scientific Simulation

Clinical Scenarios, Mathematical Models, and Deterministic Spaceflight Physiology.
NASA Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts.
Team Orbitrix, Dhaka, Bangladesh. Licensed under the Apache License 2.0.

---

## 1. Executive Purpose & Clinical Importance

In real aerospace operations, physical sensors may be disconnected, uninstrumented during transit, or awaiting pre-EVA donning. Furthermore, judges, reviewers, and mission controllers require a reproducible, fail-safe environment to evaluate software capabilities across critical flight anomalies without endangering astronaut health or relying on unstable local hardware links.

AstroVitals incorporates a **Professional Demonstration Mode** that is completely self-contained, mathematically verified, and grounded in published NASA and ESA spaceflight datasets.

---

## 2. The Five Authentic Spaceflight Scenarios

AstroVitals provides five pre-configured mission scenarios accessible via the top-level mode switcher:

### Scenario 1: Nominal Microgravity Transit
- **Operational Context**: Standard intravehicular activity (IVA) during low-G transit between the Moon and Mars.
- **Scientific Basis**: NASA-STD-3001 Volume 1 Revision C & NASA OSDR-194.
- **Biometric Profile**:
  - Heart Rate: 72.0 bpm (+/- 2.5 bpm sinus arrhythmia)
  - Blood Oxygen (SpO2): 98.4%
  - Core Skin Temp: 36.52 C
  - Postural Motion: 0.04 g (microgravity float jitter)
  - Radiation Dose Rate: 18.5 uSv/hr (nominal galactic cosmic ray background)
- **Clinical Assessment**: Autonomic tone exhibits healthy vagal modulation. Anomaly sentinel reports nominal status.

### Scenario 2: Cephalad Fluid Shift & Cardiovascular Deconditioning
- **Operational Context**: Mid-mission microgravity adaptation where headward fluid redistribution contracts effective intravascular volume.
- **Scientific Basis**: NASA OSDR-357 (Microgravity Cardiovascular Remodeling).
- **Biometric Profile**:
  - Heart Rate: 86.0 bpm (compensatory resting tachycardia)
  - Blood Oxygen (SpO2): 97.2%
  - Core Skin Temp: 36.75 C
  - Heart Rate Variability (RMSSD): 24.5 ms (reduced vagal tone)
- **Clinical Assessment**: Elevated cardiovascular risk score (68/100). Prescribes Lower Body Negative Pressure (LBNP) protocol at -30 mmHg for 20 minutes and electrolyte rehydration.

### Scenario 3: Solar Particle Event (SPE) Radiation Storm
- **Operational Context**: Coronal Mass Ejection (CME) producing high-flux relativistic solar protons penetrating the spacecraft hull.
- **Scientific Basis**: NASA MSL RAD & NASA OSDR-422 (Space Radiation Biophysics).
- **Biometric Profile**:
  - Acute Dose Rate: 2,840.0 uSv/hr (severe acute radiation influx)
  - Cumulative Dose: 48.6 mSv (projecting rapid career limit exhaustion)
  - Heart Rate: 82.0 bpm
- **Clinical Assessment**: Critical alert triggered. Directs immediate relocation to the spacecraft central storm shelter (water-wall shielded core) and antioxidant countermeasure administration.

### Scenario 4: Life Support Hypercapnia & Hypoxia
- **Operational Context**: Environmental Control and Life Support System (ECLSS) scrubber saturation causing ambient CO2 accumulation above 3.8 mmHg.
- **Scientific Basis**: NASA Technical Memorandum TM-2020-220468 & NASA-STD-3001 Vol 2.
- **Biometric Profile**:
  - Heart Rate: 98.0 bpm (hypercapnic tachycardia)
  - Blood Oxygen (SpO2): 91.4% (arterial desaturation below safety envelope)
  - Core Skin Temp: 37.15 C (vasodilation)
- **Clinical Assessment**: Critical threshold breach. Recommends donning emergency intravehicular oxygen masks and replacing lithium hydroxide (LiOH) canisters.

### Scenario 5: Extended EVA Fatigue & Cognitive Strain
- **Operational Context**: Prolonged 8-hour extravehicular spacewalk resulting in physical exertion and acute sleep deprivation.
- **Scientific Basis**: ESA COGNISPACE Benchmark Norms & NASA Human Research Program.
- **Biometric Profile**:
  - Psychomotor Vigilance Latency: +92 ms beyond ESA baseline norm
  - Motion Magnitude: 0.42 g (active suit translation)
  - HRV RMSSD: 19.2 ms (severe autonomic exhaustion)
  - Sleep / Behavioral Risk: 85/100
- **Clinical Assessment**: Cognitive stress alert. Recommends mandatory flight surgeon stand-down, 460 nm circadian blue-light phase shifting, and protected 8.5-hour sleep cycle.

---

## 3. Deterministic 1 Hz Waveform Generation Math

To ensure smooth visual animations without jumpy or synthetic-looking charts, the simulation engine (`frontend/src/lib/demoScenarios.js`) applies coupled trigonometric differential functions:

```javascript
// Authentic human sinus arrhythmia & respiratory oscillation
const hrOscillation = 2.4 * Math.sin(t * 0.35) + 0.9 * Math.cos(t * 1.15);
const spo2Oscillation = 0.3 * Math.sin(t * 0.22);
const tempOscillation = 0.06 * Math.sin(t * 0.12);
const motionOscillation = 0.015 * Math.sin(t * 0.8);

// Continuous radiation accumulation
const accumulatedRad = baseDose + (doseRate / 3600) * t;
```

This math produces natural, continuous waveforms on canvas charts, sparklines, and gauges with zero backend or network dependency.

