/**
 * AstroVitals Neuro-Shield - Demonstration Mode Scenarios & Physiological Generator.
 *
 * Provides scientifically authentic, deterministic spaceflight clinical scenarios
 * for offline demonstration, judging review, and fail-safe presentations.
 * Every scenario is grounded in NASA Human Research Program (HRP) publications,
 * NASA Open Science Data Repository (OSDR) datasets, or NASA-STD-3001 standards.
 *
 * Team Orbitrix - NASA Space Apps Challenge 2026
 * Licensed under the Apache License, Version 2.0.
 */

export const DEMO_SCENARIOS = {
  nominal: {
    id: 'nominal',
    name: 'Nominal Microgravity Transit',
    subtitle: 'Standard Intravehicular Low-G Homeostasis',
    badge: 'NOMINAL BASELINE',
    badgeColor: '#10B981',
    severity: 'nominal',
    datasetId: 'NASA-STD-3001-VOL-1',
    datasetUrl: 'https://www.nasa.gov/hhp/standards/',
    datasetTitle: 'NASA-STD-3001 & OSDR-194',
    citationNote: 'Space Flight Human-System Standard Vol 1 Rev C - Crew Health Norms.',
    baseVitals: {
      heart_rate_bpm: 72.0,
      spo2_pct: 98.4,
      skin_temp_c: 36.52,
      accel_magnitude_g: 0.04,
      activity_state: 'rest',
      radiation_dose_uSv_cumulative: 12500,
      radiation_rate_uSv_hr: 18.5,
      hrv_rmssd_ms: 58.0,
      battery_pct: 98,
      wifi_rssi: -48,
    },
    riskScores: {
      cardiovascular: 8,
      sleep_behavioral: 12,
      immune: 5,
      cognitive: 94,
      radiation: 2,
    },
    isAnomaly: false,
    alertMessage: null,
    clinicalNarrative:
      'Astronaut physiological envelope is within optimal operational range. Autonomic tone exhibits healthy vagal modulation with balanced respiratory sinus arrhythmia.',
    countermeasure:
      'Maintain scheduled cycle ergometer with vibration isolation (CEVIS) 45 min daily protocol.',
  },

  fluid_shift: {
    id: 'fluid_shift',
    name: 'Cephalad Fluid Shift & Cardiovascular Deconditioning',
    subtitle: 'Thoracic Blood Volume Translocation & Orthostatic Strain',
    badge: 'CARDIOVASCULAR CAUTION',
    badgeColor: '#F59E0B',
    severity: 'caution',
    datasetId: 'NASA-OSDR-357',
    datasetUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-357',
    datasetTitle: 'NASA OSDR-357 (Cardiovascular Remodeling)',
    citationNote: 'Long-duration microgravity cardiovascular structural remodeling dataset.',
    baseVitals: {
      heart_rate_bpm: 86.0,
      spo2_pct: 97.2,
      skin_temp_c: 36.75,
      accel_magnitude_g: 0.08,
      activity_state: 'active',
      radiation_dose_uSv_cumulative: 13100,
      radiation_rate_uSv_hr: 19.2,
      hrv_rmssd_ms: 24.5,
      battery_pct: 95,
      wifi_rssi: -52,
    },
    riskScores: {
      cardiovascular: 68,
      sleep_behavioral: 35,
      immune: 18,
      cognitive: 82,
      radiation: 4,
    },
    isAnomaly: true,
    alertMessage:
      'Cardiovascular Alert: Elevated resting pulse and narrowed pulse pressure indicating cephalic fluid redistribution.',
    clinicalNarrative:
      'Thoracic venous engorgement accompanied by central hypovolemia. Compensatory sympathetic elevation observed with attenuated baroreflex sensitivity.',
    countermeasure:
      'Activate Lower Body Negative Pressure (LBNP) chamber at -30 mmHg for 20 minutes; increase oral electrolyte fluid loading (1.0 L saline balance).',
  },

  radiation_spe: {
    id: 'radiation_spe',
    name: 'Solar Particle Event (SPE) Radiation Storm',
    subtitle: 'High-Energy Solar Proton Penetration Warning',
    badge: 'RADIATION CRITICAL',
    badgeColor: '#EF4444',
    severity: 'critical',
    datasetId: 'NASA-OSDR-422',
    datasetUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-422',
    datasetTitle: 'NASA MSL RAD & OSDR-422 (Ionizing Biophysics)',
    citationNote: 'Cosmic ray ionization rate and acute tissue damage thresholds.',
    baseVitals: {
      heart_rate_bpm: 82.0,
      spo2_pct: 97.8,
      skin_temp_c: 36.65,
      accel_magnitude_g: 0.03,
      activity_state: 'rest',
      radiation_dose_uSv_cumulative: 48600,
      radiation_rate_uSv_hr: 2840.0,
      hrv_rmssd_ms: 42.0,
      battery_pct: 91,
      wifi_rssi: -58,
    },
    riskScores: {
      cardiovascular: 22,
      sleep_behavioral: 40,
      immune: 72,
      cognitive: 75,
      radiation: 88,
    },
    isAnomaly: true,
    alertMessage:
      'CRITICAL: Coronal mass ejection proton flux exceeds 100 MeV safety boundary. Immediate storm shelter relocation required.',
    clinicalNarrative:
      'Dosimeter ionization chamber reports acute secondary proton ionization. Radiation trajectory projects career margin reduction of 8.1% within 24 hours.',
    countermeasure:
      'Evacuate to central water-wall shielded station module (Zvezda/Destiny aft). Ingest radioprotective antioxidant formulation (Amifostine analogue / N-acetylcysteine).',
  },

  hypercapnia: {
    id: 'hypercapnia',
    name: 'Life Support Hypercapnia & Hypoxia',
    subtitle: 'Environmental Control (ECLSS) Partial Bypass',
    badge: 'LIFE SUPPORT BREACH',
    badgeColor: '#EF4444',
    severity: 'critical',
    datasetId: 'NASA-TM-2020-220468',
    datasetUrl: 'https://ntrs.nasa.gov/citations/20205001248',
    datasetTitle: 'NASA TM-2020-220468 (CO2 Scrubbing Failure)',
    citationNote: 'Spaceflight hypercapnic physiological threshold studies.',
    baseVitals: {
      heart_rate_bpm: 98.0,
      spo2_pct: 91.4,
      skin_temp_c: 37.15,
      accel_magnitude_g: 0.14,
      activity_state: 'active',
      radiation_dose_uSv_cumulative: 12850,
      radiation_rate_uSv_hr: 18.9,
      hrv_rmssd_ms: 18.0,
      battery_pct: 88,
      wifi_rssi: -50,
    },
    riskScores: {
      cardiovascular: 75,
      sleep_behavioral: 60,
      immune: 30,
      cognitive: 45,
      radiation: 3,
    },
    isAnomaly: true,
    alertMessage:
      'ECLSS BREACH: Ambient CO2 > 3.8 mmHg. Astronaut showing respiratory hyperpnea and arterial desaturation below 92%.',
    clinicalNarrative:
      'Elevated respiratory compensation with compensatory cerebral vasodilation (throbbing retro-orbital discomfort). Oxygen saturation declining toward safety floor.',
    countermeasure:
      'Don emergency intravehicular oxygen mask; initiate manual purge and replacement of lithium hydroxide (LiOH) absorbent canisters.',
  },

  crew_fatigue: {
    id: 'crew_fatigue',
    name: 'Extended EVA Fatigue & Cognitive Strain',
    subtitle: 'Cumulative Sleep Debt & Spacewalk Exertion',
    badge: 'COGNITIVE STRESS',
    badgeColor: '#8B5CF6',
    severity: 'warning',
    datasetId: 'ESA-COGNISPACE-NORM',
    datasetUrl: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/COGNISPACE',
    datasetTitle: 'ESA COGNISPACE Benchmark Norms',
    citationNote: 'Orbital psychomotor vigilance latency and mental exhaustion metrics.',
    baseVitals: {
      heart_rate_bpm: 78.0,
      spo2_pct: 98.0,
      skin_temp_c: 36.42,
      accel_magnitude_g: 0.42,
      activity_state: 'exercise',
      radiation_dose_uSv_cumulative: 13400,
      radiation_rate_uSv_hr: 20.1,
      hrv_rmssd_ms: 19.2,
      battery_pct: 84,
      wifi_rssi: -55,
    },
    riskScores: {
      cardiovascular: 32,
      sleep_behavioral: 85,
      immune: 42,
      cognitive: 38,
      radiation: 3,
    },
    isAnomaly: true,
    alertMessage:
      'Cognitive Alert: Psychomotor vigilance latency extended (+92 ms beyond ESA baseline norm). Micro-sleep intrusion risk.',
    clinicalNarrative:
      'Marked autonomic withdrawal with blunted HRV indices following an 8-hour EVA excursion. Elevated subjective sleepiness and reduced executive function.',
    countermeasure:
      'Mandatory flight surgeon stand-down; administer circadian blue-light phase shifting (460 nm) and schedule 8.5-hour protected sleep cycle.',
  },
};

/**
 * Generate a deterministic, scientifically consistent snapshot of vital readings
 * for any scenario at a specific elapsed second.
 */
export function generateDemoVitals(scenarioId = 'nominal', elapsedSec = 0) {
  const scenario = DEMO_SCENARIOS[scenarioId] || DEMO_SCENARIOS.nominal;
  const base = scenario.baseVitals;
  const t = elapsedSec;

  // Authentic human sinus arrhythmia & respiratory oscillation
  const hrOscillation = 2.4 * Math.sin(t * 0.35) + 0.9 * Math.cos(t * 1.15);
  const spo2Oscillation = 0.3 * Math.sin(t * 0.22);
  const tempOscillation = 0.06 * Math.sin(t * 0.12);
  const motionOscillation = 0.015 * Math.sin(t * 0.8);

  const hr = Math.round((base.heart_rate_bpm + hrOscillation) * 10) / 10;
  const spo2 = Math.min(100, Math.max(85, Math.round((base.spo2_pct + spo2Oscillation) * 10) / 10));
  const temp = Math.round((base.skin_temp_c + tempOscillation) * 100) / 100;
  const motion = Math.max(0.01, Math.round((base.accel_magnitude_g + motionOscillation) * 100) / 100);

  // Progressive radiation dose accumulation
  const accumulatedRad = Math.round(base.radiation_dose_uSv_cumulative + (base.radiation_rate_uSv_hr / 3600) * t);

  return {
    astronaut_id: 'astronaut-A',
    timestamp_utc: new Date(Date.now() - (60 - (t % 60)) * 1000).toISOString(),
    heart_rate_bpm: hr,
    spo2_pct: spo2,
    skin_temp_c: temp,
    accel_magnitude_g: motion,
    accel_x_g: Math.round(0.02 * Math.sin(t * 0.8) * 1000) / 1000,
    accel_y_g: Math.round(0.03 * Math.cos(t * 0.9) * 1000) / 1000,
    accel_z_g: Math.round((0.98 + 0.02 * Math.sin(t * 0.5)) * 1000) / 1000,
    activity_state: base.activity_state,
    radiation_dose_uSv_cumulative: accumulatedRad,
    radiation_rate_uSv_hr: base.radiation_rate_uSv_hr,
    hrv_rmssd_ms: base.hrv_rmssd_ms,
    battery_pct: Math.max(10, base.battery_pct - Math.floor(t / 120)),
    wifi_rssi: base.wifi_rssi,
    wifi_ssid: 'Orbital-ISS-Mesh',
    heart_rate_delta: Math.round((hr - 72.0) * 10) / 10,
    spo2_delta: Math.round((spo2 - 98.0) * 10) / 10,
    skin_temp_delta: Math.round((temp - 36.5) * 100) / 100,
    anomaly_detected: scenario.isAnomaly,
    status: scenario.severity,
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    provenance: {
      dataset_id: scenario.datasetId,
      source_url: scenario.datasetUrl,
      title: scenario.datasetTitle,
      data_mode: 'demonstration_simulation',
      note: scenario.citationNote,
    },
  };
}

/**
 * Generate 60 historical data points for the initial chart render.
 */
export function generateDemoHistory(scenarioId = 'nominal', count = 60) {
  const points = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const pt = generateDemoVitals(scenarioId, 1000 - i * 2);
    pt.timestamp_utc = new Date(now - i * 2000).toISOString();
    points.push(pt);
  }
  return points;
}
