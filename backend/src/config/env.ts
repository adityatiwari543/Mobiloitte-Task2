import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from multiple potential locations (CWD, parent workspace root, or backend folder)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  MONGO_URI: isTest
    ? z.string().default('mongodb://127.0.0.1:27017/jobconnect_test')
    : z.string({
        required_error: 'MONGO_URI is required. Please configure it in your .env file.',
        invalid_type_error: 'MONGO_URI must be a valid connection string.',
      }).min(1, 'MONGO_URI cannot be empty.'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  JWT_ACCESS_SECRET: isTest
    ? z.string().default('test_jwt_access_secret_min_32_chars_long!')
    : z.string({
        required_error: 'JWT_ACCESS_SECRET is required. Generate a secure random string (32+ chars).',
      }).min(32, 'JWT_ACCESS_SECRET must be at least 32 characters for security.'),
  JWT_REFRESH_SECRET: isTest
    ? z.string().default('test_jwt_refresh_secret_min_32_chars_long!')
    : z.string({
        required_error: 'JWT_REFRESH_SECRET is required. Generate a secure random string (32+ chars).',
      }).min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security.'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CSRF_SECRET: isTest
    ? z.string().default('test_csrf_secret_min_16_chars!')
    : z.string({
        required_error: 'CSRF_SECRET is required. Generate a secure random string (16+ chars).',
      }).min(16, 'CSRF_SECRET must be at least 16 characters for security.'),
  AI_PROVIDER: z.enum(['deterministic', 'gemini', 'openai']).default('deterministic'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL_NAME: z.string().default('gemini-1.5-flash'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  STORAGE_DIR: z.string().default('./uploads'),

  // SMTP Email Settings
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  FROM_EMAIL: z.string().default('JobConnect <noreply@jobconnect.dev>'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('\n❌ CRITICAL: Environment validation failed!');
  console.error('Please check your .env file against .env.example.\n');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\n');
  process.exit(1);
}

export const env = parsedEnv.data;
