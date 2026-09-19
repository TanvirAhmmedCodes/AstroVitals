import { create } from 'zustand';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from '../lib/auth';

const DEMO_USER_KEY = 'astrovitals_demo_user';
const CACHED_USER_KEY = 'astrovitals_cached_user';

export const DEFAULT_DEMO_USER = {
  id: 'astronaut-A',
  email: 'commander.demo@orbitrix.org',
  full_name: 'Commander Alex Mercer (Demo)',
  role: 'Commander',
  callsign: 'CDR',
  astronaut_id: 'astronaut-A',
  is_demo: true,
  email_verified: true,
  created_at: '2026-08-01T00:00:00Z',
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getStoredToken() || null,
  isAuthenticated: !!getStoredToken(),
  loading: true,

  initAuth: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, loading: false });
      return;
    }

    // 1. Instant Demo Session Hydration
    if (token.startsWith('demo_token_')) {
      let demoUser = DEFAULT_DEMO_USER;
      try {
        const stored = localStorage.getItem(DEMO_USER_KEY);
        if (stored) demoUser = JSON.parse(stored);
      } catch {
        // use default
      }
      set({
        user: demoUser,
        token,
        isAuthenticated: true,
        loading: false,
      });
      return;
    }

    // 2. Validate real user session with backend
    try {
      const user = await getCurrentUser();
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
      } catch {}
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      console.warn('[AuthStore] Session validation notice:', err.message);
      // Only discard session if the backend explicitly rejected credentials (401)
      const isExplicit401 = err.response && err.response.status === 401;
      if (isExplicit401) {
        removeStoredToken();
        localStorage.removeItem(CACHED_USER_KEY);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      } else {
        // Backend offline, sleeping on free tier, or network hiccup:
        // Retain session using cached profile so astronaut isn't booted out
        console.info('[AuthStore] Operating in offline/telemetry cache mode.');
        let fallbackUser = null;
        try {
          const cached = localStorage.getItem(CACHED_USER_KEY);
          if (cached) fallbackUser = JSON.parse(cached);
        } catch {}

        if (!fallbackUser) {
          fallbackUser = {
            id: 'astronaut-A',
            email: 'astronaut@orbitrix.org',
            full_name: 'MD Tanvir Ahmmed',
            role: 'Commander',
            callsign: 'CDR',
            astronaut_id: 'astronaut-A',
            is_demo: false,
            email_verified: true,
          };
        }

        set({
          user: fallbackUser,
          token,
          isAuthenticated: true,
          loading: false,
        });
      }
    }
  },

  loginDemo: (role = 'Commander') => {
    const isSpecialAdmin = role.toLowerCase() === 'admin';
    const demoUser = {
      ...DEFAULT_DEMO_USER,
      role: isSpecialAdmin ? 'admin' : 'Commander',
      callsign: isSpecialAdmin ? 'ADMIN' : 'CDR',
      full_name: isSpecialAdmin ? 'Mission Director (Demo)' : 'Commander Alex Mercer (Demo)',
    };
    const demoToken = 'demo_token_' + Date.now();
    setStoredToken(demoToken);
    try {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    } catch {}
    set({
      user: demoUser,
      token: demoToken,
      isAuthenticated: true,
      loading: false,
    });
    return { user: demoUser, token: demoToken };
  },

  login: async ({ email, password }) => {
    set({ loading: true });
    try {
      const data = await loginUser({ email, password });
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      } catch {}
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async ({ email, password, full_name }) => {
    set({ loading: true });
    try {
      const data = await registerUser({ email, password, full_name });
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      } catch {}
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.removeItem(DEMO_USER_KEY);
      localStorage.removeItem(CACHED_USER_KEY);
      removeStoredToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  setUser: (user) => set({ user }),
  setToken: (token) => {
    setStoredToken(token);
    set({ token, isAuthenticated: !!token });
  },
  updateUser: (partial) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...partial } });
    }
  },
}));
