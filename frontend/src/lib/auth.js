import { apiClient } from './api';

const TOKEN_KEY = 'astrovitals_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Request interceptor: Inject Bearer JWT into all outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized redirections
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname;
      const isPublicPath = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
      ].some((p) => path === p || path.startsWith('/reset-password') || path.startsWith('/verify-email'));

      if (!isPublicPath) {
        removeStoredToken();
        window.location.href = '/login?redirect=' + encodeURIComponent(path);
      }
    }
    return Promise.reject(error);
  }
);

export async function registerUser({ email, password, full_name }) {
  const res = await apiClient.post('/auth/register', {
    email,
    password,
    full_name,
  });
  if (res.data?.token) {
    setStoredToken(res.data.token);
  }
  return res.data;
}

export async function loginUser({ email, password }) {
  const res = await apiClient.post('/auth/login', {
    email,
    password,
  });
  if (res.data?.token) {
    setStoredToken(res.data.token);
  }
  return res.data;
}

export async function logoutUser() {
  try {
    await apiClient.post('/auth/logout');
  } catch (err) {
    console.warn('[Auth] Server logout notification error:', err.message);
  } finally {
    removeStoredToken();
  }
}

export async function getCurrentUser() {
  const res = await apiClient.get('/auth/me');
  return res.data?.user;
}

export async function requestPasswordReset(email) {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(token, new_password) {
  const res = await apiClient.post('/auth/reset-password', {
    token,
    new_password,
  });
  return res.data;
}

export async function verifyEmail(token) {
  const res = await apiClient.post(`/auth/verify-email/${token}`);
  return res.data;
}

export async function resendVerification(email) {
  const res = await apiClient.post('/auth/resend-verification', { email });
  return res.data;
}

export async function updateUserProfile(profileData) {
  const res = await apiClient.put('/auth/profile', profileData);
  return res.data?.user;
}

export async function changeUserPassword(old_password, new_password) {
  const payload = typeof old_password === 'object'
    ? old_password
    : { old_password, new_password };
  const res = await apiClient.put('/auth/change-password', payload);
  return res.data;
}
