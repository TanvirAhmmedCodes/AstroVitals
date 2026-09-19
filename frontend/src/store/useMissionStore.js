import { create } from 'zustand';

export const useMissionStore = create((set, get) => ({
  // Active Crew Member
  isDemoMode: false,
  selectedAstronautId: 'astronaut-A',
  selectedAstronaut: {
    id: 'astronaut-A',
    name: 'MD Tanvir Ahmmed',
    callsign: 'CDR',
    role: 'Commander (CDR)',
    status: 'nominal',
    healthScore: 98,
    missionDay: 42,
    isDemo: false,
  },
  crew: [
    { id: 'astronaut-A', name: 'MD Tanvir Ahmmed', callsign: 'CDR', role: 'Commander (CDR)', status: 'nominal', healthScore: 98, isDemo: false },
    { id: 'astronaut-B', name: 'Suborna Akter', callsign: 'MS1', role: 'Flight Engineer (MS1)', status: 'nominal', healthScore: 95, isDemo: false },
  ],
  setAstronaut: (id) => {
    const member = get().crew.find((c) => c.id === id);
    set({
      selectedAstronautId: id,
      selectedAstronaut: member || get().selectedAstronaut,
    });
  },
  setCrew: (newCrew, isDemo = false) => {
    if (newCrew && newCrew.length > 0) {
      const selected = newCrew.find((c) => c.id === get().selectedAstronautId) || newCrew[0];
      set({
        crew: newCrew,
        selectedAstronaut: selected,
        selectedAstronautId: selected.id,
        isDemoMode: isDemo,
      });
    }
  },

  // Telemetry state
  vitals: {
    heart_rate_bpm: 72,
    spo2_pct: 98,
    skin_temp_c: 36.5,
    accel_magnitude_g: 0.28,
    activity_state: 'rest',
    radiation_dose_uSv_cumulative: 12500,
    status: 'nominal',
    heart_rate_delta: 2.4,
    spo2_delta: -0.2,
    skin_temp_delta: 0.1,
    anomaly_detected: false,
    timestamp_utc: new Date().toISOString(),
  },
  vitalsBuffer: [],
  setVitals: (newVitals) => {
    const currentBuffer = Array.isArray(get().vitalsBuffer) ? get().vitalsBuffer : [];
    const updatedBuffer = [...currentBuffer, newVitals].slice(-60); // keep last 60 points
    set({
      vitals: { ...get().vitals, ...newVitals },
      vitalsBuffer: updatedBuffer,
    });
  },
  setVitalsBuffer: (buffer) => {
    const arr = Array.isArray(buffer) ? buffer : (buffer?.data || []);
    set({ vitalsBuffer: arr });
  },

  // Risk state
  risk: {
    cardiovascular: 12,
    sleep_behavioral: 8,
    immune: 5,
    cognitive: 78,
    radiation: 2,
    anomaly_detected: false,
  },
  setRisk: (riskData) => {
    if (!riskData) return;
    const current = get().risk;
    const extract = (v, def) => {
      if (typeof v === 'number' && !isNaN(v)) return v;
      if (typeof v?.score === 'number' && !isNaN(v.score)) return v.score;
      return def;
    };
    set({
      risk: {
        ...current,
        ...riskData,
        cardiovascular: extract(riskData.cardiovascular, current.cardiovascular),
        sleep_behavioral: extract(riskData.sleep_behavioral, current.sleep_behavioral),
        immune: extract(riskData.immune, current.immune),
        cognitive: extract(riskData.cognitive, current.cognitive),
        radiation: extract(riskData.radiation, current.radiation),
      },
    });
  },

  // Radiation
  radiation: {
    cumulative_dose_uSv: 12500,
    cumulative_dose_mSv: 12.5,
    career_limit_pct: 2.08,
    spe_limit_pct: 5.0,
    is_in_saa: false,
    projected_days_to_limit: 730,
  },
  setRadiation: (radData) => set({ radiation: { ...get().radiation, ...radData } }),

  // Mission context
  moduleName: 'ISS · ZARYA',
  missionDay: 42,
  metSeconds: 11922, // MET: 03:18:42 start
  incrementMET: () => set((state) => ({ metSeconds: state.metSeconds + 1 })),

  // UI state
  language: 'EN',
  setLanguage: (lang) => set({ language: lang }),
  emergencyMode: false,
  setEmergencyMode: (val) => set({ emergencyMode: val }),
  bootSequenceFinished: false,
  setBootSequenceFinished: (val) => set({ bootSequenceFinished: val }),
}));
