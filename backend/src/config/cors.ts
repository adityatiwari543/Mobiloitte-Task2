import { env } from './env.js';

/**
 * Normalizes an origin URL string by trimming whitespace and removing trailing slashes.
 */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/**
 * Returns the set of explicitly allowed origins based on environment.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  // 1. Add configured FRONTEND_URL (supports comma-separated origins)
  if (env.FRONTEND_URL) {
    env.FRONTEND_URL.split(',').forEach((url) => {
      const trimmed = normalizeOrigin(url);
      if (trimmed) origins.add(trimmed);
    });
  }

  // 2. In non-production, include standard local dev origins
  if (env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return Array.from(origins);
}

/**
 * Origin validation callback for Express cors and Socket.IO.
 * OWASP ASVS V14: Strict origin checking that rejects 'null', wildcards, or malicious origins.
 */
export function validateCorsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void {
  // Allow requests with no origin (e.g., mobile apps, curl, server-to-server, Postman, health probes)
  if (!origin) {
    return callback(null, true);
  }

  // Explicitly reject 'null' origin (sandboxed iframe / data: URI attacks)
  if (origin === 'null') {
    return callback(new Error('CORS rejected: "null" origin is not permitted.'), false);
  }

  const normalized = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes(normalized)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS rejected: Origin "${origin}" is not authorized.`), false);
}

export const corsOptions = {
  origin: validateCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
  maxAge: 86400, // 24 hours preflight cache
};
