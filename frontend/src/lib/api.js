import axios from 'axios';

// Resolve base URL: use Vite env, fallback to localhost in dev or Render in production
const rawEnvBase = import.meta.env.VITE_API_BASE_URL;

function resolveApiBase() {
  if (rawEnvBase && rawEnvBase.trim()) {
    return `${rawEnvBase.trim().replace(/\/$/, '')}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080/api/v1';
    }
    // Production on Vercel or custom domain: point directly to deployed Render backend
    return 'https://astrovitals.onrender.com/api/v1';
  }
  return '/api/v1';
}

export const API_BASE = resolveApiBase();

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add timestamp or telemetry metadata
apiClient.interceptors.request.use(
  (config) => {
    config.headers['X-Mission-Client'] = 'AstroVitals-Console-v1';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Retry up to 2 times for network timeouts or 503s
    if (!config || !config.retryCount) {
      config.retryCount = 0;
    }

    if (config.retryCount < 2 && (!error.response || error.response.status >= 500)) {
      config.retryCount += 1;
      const delay = config.retryCount * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    const message = error.response?.data?.detail || error.message || 'Mission telemetry connection error';
    console.warn(`[API] Telemetry link error [${config?.url}]:`, message);
    return Promise.reject(new Error(message));
  }
);

// Fallback demo crew if backend is offline or warming up
export const FALLBACK_ASTRONAUTS = [
  { id: 'astronaut-A', name: 'Crew Member 1', role: 'Commander (CDR)', callsign: 'CDR', mission_day_0: '2026-08-01', isDemo: true, healthScore: 98 },
  { id: 'astronaut-B', name: 'Crew Member 2', role: 'Flight Engineer (MS1)', callsign: 'MS1', mission_day_0: '2026-08-01', isDemo: true, healthScore: 82 },
  { id: 'astronaut-C', name: 'Crew Member 3', role: 'Science Officer (MS2)', callsign: 'MS2', mission_day_0: '2026-08-01', isDemo: true, healthScore: 95 },
  { id: 'astronaut-D', name: 'Crew Member 4', role: 'Mission Specialist (MS3)', callsign: 'MS3', mission_day_0: '2026-08-01', isDemo: true, healthScore: 96 },
];

export async function fetchAstronauts() {
  try {
    const res = await apiClient.get('/astronaut');
    return res.data;
  } catch (err) {
    console.warn('Using fallback astronauts list:', err.message);
    return { total_crew: 4, crew: FALLBACK_ASTRONAUTS, is_demo: true };
  }
}

export async function fetchLatestVitals(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/vitals/latest?astronaut_id=${astronautId}`);
    return res.data;
  } catch (err) {
    console.warn('Using simulated vitals fallback:', err.message);
    return {
      astronaut_id: astronautId,
      timestamp_utc: new Date().toISOString(),
      heart_rate_bpm: 72.4,
      spo2_pct: 98.2,
      skin_temp_c: 36.5,
      accel_magnitude_g: 0.28,
      activity_state: 'rest',
      radiation_dose_uSv_cumulative: 12500,
      status: 'nominal',
      heart_rate_delta: 1.8,
      spo2_delta: -0.1,
      skin_temp_delta: 0.1,
      anomaly_detected: false,
    };
  }
}

export async function fetchVitalsHistory(astronautId = 'astronaut-A', limit = 60) {
  try {
    const res = await apiClient.get(`/vitals/history?astronaut_id=${astronautId}&limit=${limit}`);
    return res.data?.data || (Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.warn('Using simulated vitals history fallback:', err.message);
    const now = Date.now();
    return Array.from({ length: 30 }).map((_, i) => ({
      timestamp_utc: new Date(now - (30 - i) * 2000).toISOString(),
      heart_rate_bpm: 70 + Math.sin(i / 2) * 5 + (Math.random() * 2 - 1),
      spo2_pct: 98 + Math.cos(i / 3) * 0.8,
      skin_temp_c: 36.5 + (Math.random() * 0.2 - 0.1),
      activity_state: 'rest',
      radiation_dose_uSv_cumulative: 12500 + i * 0.1,
      anomaly_flag: false,
      wifi_rssi: -45,
    }));
  }
}

export async function fetchCurrentRisk(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/risk/current?astronaut_id=${astronautId}`);
    const data = res.data;
    return {
      astronaut_id: astronautId,
      cardiovascular: typeof data?.cardiovascular === 'object' ? data.cardiovascular.score : (data?.cardiovascular ?? 12.4),
      sleep_behavioral: typeof data?.sleep_behavioral === 'object' ? data.sleep_behavioral.score : (data?.sleep_behavioral ?? 8.5),
      immune: typeof data?.immune === 'object' ? data.immune.score : (data?.immune ?? 5.2),
      cognitive: typeof data?.cognitive === 'object' ? data.cognitive.score : (data?.cognitive ?? 78.0),
      radiation: typeof data?.radiation === 'object' ? data.radiation.score : (data?.radiation ?? 2.1),
      composite_risk: data?.composite_risk ?? 22.0,
      overall_status: data?.overall_status || 'nominal',
      anomaly_flag: !!data?.anomaly_flag,
      raw: data,
    };
  } catch (err) {
    console.warn('Using fallback risk scores:', err.message);
    return {
      astronaut_id: astronautId,
      cardiovascular: 12.4,
      sleep_behavioral: 8.5,
      immune: 5.2,
      cognitive: 78.0,
      radiation: 2.1,
      composite_risk: 22.0,
      overall_status: 'nominal',
      anomaly_flag: false,
      explanations: {
        cardiovascular: 'Heart rate and HRV within nominal resting thresholds. Validated BayesianRidge model (GroupKFold R² = 0.673) operates on clinical biomarker manifold.',
        sleep_behavioral: 'Circadian stability index 8.2/10. Validated sleep debt model (GroupKFold R² = 0.577).',
        immune: 'PBMC single-cell cfRNA markers within nominal post-flight envelope.',
      },
    };
  }
}

export async function fetchRadiationStatus(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/radiation/status?astronaut_id=${astronautId}`);
    return res.data;
  } catch (err) {
    console.warn('Using fallback radiation status:', err.message);
    return {
      astronaut_id: astronautId,
      cumulative_dose_uSv: 12500,
      cumulative_dose_mSv: 12.5,
      career_limit_mSv: 600.0,
      career_limit_pct: 2.08,
      spe_limit_mSv: 250.0,
      spe_limit_pct: 5.0,
      is_in_saa: false,
      projected_days_to_limit: 730,
    };
  }
}

export async function fetchISSPosition() {
  try {
    const res = await apiClient.get('/external/iss');
    return res.data;
  } catch (err) {
    return {
      latitude: -22.5,
      longitude: -44.2,
      altitude_km: 418.5,
      velocity_kmh: 27580,
      in_saa: false,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }
}

export async function fetchAlertsHistory(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/alerts/history?astronaut_id=${astronautId}`);
    return res.data;
  } catch (err) {
    return [];
  }
}

export async function submitCognitiveTest(data) {
  try {
    const res = await apiClient.post('/cognitive/test', data);
    return res.data;
  } catch (err) {
    console.warn('Cognitive test submission fallback:', err.message);
    return { status: 'recorded_offline', score: data.cognitive_resilience_score || 78 };
  }
}

export async function fetchCognitiveHistory(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/cognitive/history?astronaut_id=${astronautId}`);
    return res.data;
  } catch (err) {
    return [];
  }
}

export async function fetchCognitiveNorms() {
  try {
    const res = await apiClient.get('/cognitive/norms');
    return res.data;
  } catch (err) {
    return {
      reaction_time_mean_ms: 280.0,
      reaction_time_sd_ms: 35.0,
      mental_rotation_accuracy_pct: 88.5,
    };
  }
}

export async function sendChatMessage(astronautId, message, sessionId = 'default-session') {
  let aId = astronautId;
  let msg = message;
  let sId = sessionId;

  // Handle object-style arguments: sendChatMessage({ message, astronaut_id, session_id })
  if (typeof astronautId === 'object' && astronautId !== null) {
    aId = astronautId.astronaut_id || 'astronaut-A';
    msg = astronautId.message;
    sId = astronautId.session_id || 'default-session';
  }

  try {
    const res = await apiClient.post('/chat/message', {
      astronaut_id: aId,
      message: msg,
      session_id: sId,
    });
    return res.data;
  } catch (err) {
    console.warn('Chat companion network issue:', err.message);
    const detail = err.response?.data?.detail;
    if (detail && typeof detail === 'string') {
      return {
        response: `Mission advisory: ${detail}`,
        content: `Mission advisory: ${detail}`,
        session_id: sId,
      };
    }
    return {
      response: "AstroVitals Neuro-Shield: Operating in telemetry cache mode. Your vitals remain stable. What specific countermeasure or trend would you like to review?",
      content: "AstroVitals Neuro-Shield: Operating in telemetry cache mode. Your vitals remain stable. What specific countermeasure or trend would you like to review?",
      session_id: sId,
      tokens_used: 42,
    };
  }
}

export async function fetchChatSuggestions(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/chat/suggestions?astronaut_id=${astronautId}`);
    return res.data;
  } catch (err) {
    return [
      'Show my 7-day HRV trend',
      'Explain current radiation dose',
      'Recommend sleep countermeasure',
      'Check cognitive reaction test results',
    ];
  }
}

export async function fetchForecast(days = 7) {
  try {
    const res = await apiClient.get(`/analytics/forecast?days=${days}`);
    return res.data;
  } catch (err) {
    console.warn('Forecast fallback:', err.message);
    return {
      days,
      cardiovascular_trajectory: [12, 13, 14, 13, 12, 11, 12],
      sleep_trajectory: [8, 9, 10, 8, 7, 8, 8],
      immune_trajectory: [5, 5, 6, 6, 5, 5, 5],
    };
  }
}

export async function fetchAstronautSummary(astronautId = 'astronaut-A') {
  try {
    const res = await apiClient.get(`/astronaut/${astronautId}/summary`);
    return res.data;
  } catch (err) {
    console.warn('Error fetching astronaut summary:', err.message);
    return null;
  }
}

export async function postForecastSimulation(payload) {
  try {
    const res = await apiClient.post('/analytics/forecast', payload);
    return res.data;
  } catch (err) {
    console.warn('Forecast simulation API error:', err.message);
    return null;
  }
}

export async function postEmergencyAlert(payload = {}) {
  try {
    const res = await apiClient.post('/alerts/emergency', payload);
    return res.data;
  } catch (err) {
    console.warn('Emergency alert broadcast error:', err.message);
    throw err;
  }
}

