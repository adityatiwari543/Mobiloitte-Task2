import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { csrfTokenGenerator, csrfProtection } from './middlewares/csrf.middleware.js';
import { redisService } from './services/redis.service.js';
import fs from 'fs';
import { getStorageDirectory } from './utils/upload.js';
import { sendError } from './utils/response.js';
import { ERROR_CODES } from '@jobconnect/shared';

// Route imports
import { authRoutes } from './routes/auth.routes.js';
import { candidateRoutes } from './routes/candidate.routes.js';
import { recruiterRoutes } from './routes/recruiter.routes.js';
import { jobRoutes } from './routes/job.routes.js';
import { applicationRoutes } from './routes/application.routes.js';
import { companyRoutes } from './routes/company.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { sessionRoutes } from './routes/session.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { aiRoutes } from './routes/ai.routes.js';

export const app = express();

// Trust reverse proxy if in production
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1. Security Headers (Section 6.8)
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Configuration (Section 6.7)
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
    ],
  })
);

// 3. Body & Cookie Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 4. Static Uploads Folder (Section 6.13)
const uploadsPath = getStorageDirectory();
app.use('/uploads', express.static(uploadsPath));

// Also serve legacy backend/uploads as fallback so no legacy upload is ever lost
const legacyUploadsPath = path.resolve(uploadsPath, '../backend/uploads');
if (fs.existsSync(legacyUploadsPath)) {
  app.use('/uploads', express.static(legacyUploadsPath));
}

// 5. Anti-CSRF Token Generation & Protection (Section 6.6)
app.use(csrfTokenGenerator);
app.use(csrfProtection);

// 6. Health & Readiness Endpoints (Section 33)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/ready', (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisService.getStatus();
  const isReady = mongoStatus === 'connected';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'unhealthy',
    mongodb: mongoStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

// 7. Versioned REST API Routes (Section 9)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidate', candidateRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ai', aiRoutes);

// 8. 404 Route Handler
app.use((_req: Request, res: Response) => {
  sendError(res, 'ENDPOINT_NOT_FOUND', 'Requested API endpoint does not exist.', 404);
});

// 9. Safe Global Error Handler (Section 6.16: Never leak stack traces in responses)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const errorObj = err as { statusCode?: number; code?: string; message?: string };
  const statusCode = errorObj.statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : errorObj.message || 'An error occurred processing the request.';

  sendError(res, errorObj.code || ERROR_CODES.INTERNAL_SERVER_ERROR, message, statusCode);
});
