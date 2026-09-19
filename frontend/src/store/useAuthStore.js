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

    try {
      const user = await getCurrentUser();
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });
    } catch (err) {
      console.warn('[AuthStore] Session validation failed:', err.message);
      removeStoredToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true });
    try {
      const data = await loginUser({ email, password });
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
