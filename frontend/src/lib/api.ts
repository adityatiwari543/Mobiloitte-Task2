import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Helper to read cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3] || '') : null;
}

// Request interceptor to attach anti-CSRF token and properly handle FormData uploads
api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  const csrfToken = getCookie('jobconnect_csrf');
  if (csrfToken && config.headers) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// In-Memory Session Active State (Security: Zero storage in sessionStorage or localStorage)
let isSessionActiveInMemory = false;

export const setSessionActive = (active: boolean) => {
  isSessionActiveInMemory = active;
};

export const getSessionActive = (): boolean => {
  return isSessionActiveInMemory;
};

// Response interceptor to handle auto token refresh on 401 using secure HttpOnly cookies
let isRefreshing = false;
let failedQueue: Array<{ resolve: (val?: unknown) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop on auth endpoints & do not auto-refresh if session is not active in memory
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      if (!getSessionActive()) {
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token rotated via secure HttpOnly cookie
        await api.post('/auth/refresh');
        setSessionActive(true);
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        setSessionActive(false);
        processQueue(refreshErr);
        return Promise.reject(new Error('Your session has expired. Please sign in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
