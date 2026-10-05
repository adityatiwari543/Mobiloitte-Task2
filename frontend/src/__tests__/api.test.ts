import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api, setSessionActive } from '../lib/api.js';

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

describe('Frontend API Client Security & Interceptors (OWASP ASVS V3 & V4)', () => {
  beforeEach(() => {
    // Provide lightweight browser DOM mocks for Node environment
    (globalThis as any).document = {
      cookie: '',
    };
    (globalThis as any).sessionStorage = new MockStorage();
    (globalThis as any).window = globalThis;
  });

  afterEach(() => {
    delete (globalThis as any).document;
    delete (globalThis as any).sessionStorage;
  });

  describe('Axios Client Base Configuration', () => {
    it('enforces secure API baseURL /api/v1', () => {
      expect(api.defaults.baseURL).toBe('/api/v1');
    });

    it('enforces withCredentials: true for HttpOnly cookie transport (Anti-XSS)', () => {
      expect(api.defaults.withCredentials).toBe(true);
    });

    it('includes standard Anti-CSRF X-Requested-With header by default', () => {
      expect(api.defaults.headers['X-Requested-With']).toBe('XMLHttpRequest');
    });
  });

  describe('Request Interceptor Security Headers', () => {
    it('extracts jobconnect_csrf cookie and attaches X-CSRF-Token header', async () => {
      const testToken = 'csrf-token-abc123xyz789';
      document.cookie = `jobconnect_csrf=${testToken}; path=/`;

      const requestHandlers = (api.interceptors.request as any).handlers;
      expect(requestHandlers.length).toBeGreaterThan(0);

      const interceptor = requestHandlers[0].fulfilled;
      const config = {
        headers: {} as Record<string, string>,
      };

      const modifiedConfig = await interceptor(config);
      expect(modifiedConfig.headers['X-CSRF-Token']).toBe(testToken);
    });

    it('gracefully continues without X-CSRF-Token when cookie is absent', async () => {
      document.cookie = '';

      const requestHandlers = (api.interceptors.request as any).handlers;
      const interceptor = requestHandlers[0].fulfilled;
      const config = {
        headers: {} as Record<string, string>,
      };

      const modifiedConfig = await interceptor(config);
      expect(modifiedConfig.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('strips Content-Type header on FormData uploads to let browser set boundary', async () => {
      const requestHandlers = (api.interceptors.request as any).handlers;
      const interceptor = requestHandlers[0].fulfilled;

      // Mock FormData
      class MockFormData {}
      (globalThis as any).FormData = MockFormData;

      const formData = new MockFormData();
      const config = {
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        } as Record<string, string>,
      };

      const modifiedConfig = await interceptor(config);
      expect(modifiedConfig.headers['Content-Type']).toBeUndefined();

      delete (globalThis as any).FormData;
    });
  });

  describe('Response Interceptor 401 & Session Handling', () => {
    it('immediately rejects 401 on login endpoint without attempting refresh', async () => {
      const responseHandlers = (api.interceptors.response as any).handlers;
      const errorHandler = responseHandlers[0].rejected;

      const mock401Error = {
        response: { status: 401 },
        config: { url: '/auth/login', _retry: false },
      };

      await expect(errorHandler(mock401Error)).rejects.toEqual(mock401Error);
    });

    it('immediately rejects 401 on refresh endpoint to prevent recursive loop', async () => {
      const responseHandlers = (api.interceptors.response as any).handlers;
      const errorHandler = responseHandlers[0].rejected;

      const mock401Error = {
        response: { status: 401 },
        config: { url: '/auth/refresh', _retry: false },
      };

      await expect(errorHandler(mock401Error)).rejects.toEqual(mock401Error);
    });

    it('immediately rejects 401 when in-memory session is not active', async () => {
      const responseHandlers = (api.interceptors.response as any).handlers;
      const errorHandler = responseHandlers[0].rejected;

      setSessionActive(false);

      const mock401Error = {
        response: { status: 401 },
        config: { url: '/candidate/profile', _retry: false },
      };

      await expect(errorHandler(mock401Error)).rejects.toEqual(mock401Error);
    });
  });
});
