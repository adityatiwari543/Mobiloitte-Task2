import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { authRateLimiter, otpRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { avatarUpload } from '../utils/upload.js';
import {
  RegisterSchema,
  LoginSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  ForgotPasswordSchema,
  VerifyResetOtpSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '@jobconnect/shared';

const router = Router();

// Public auth endpoints with strict rate limiting & Zod input validation
router.post('/register', authRateLimiter, validateBody(RegisterSchema), AuthController.register);
router.post('/verify-otp', otpRateLimiter, validateBody(VerifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', otpRateLimiter, validateBody(ResendOtpSchema), AuthController.resendOtp);
router.post('/login', authRateLimiter, validateBody(LoginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);

router.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(ForgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  '/verify-reset-otp',
  otpRateLimiter,
  validateBody(VerifyResetOtpSchema),
  AuthController.verifyResetOtp
);
router.post(
  '/reset-password',
  authRateLimiter,
  validateBody(ResetPasswordSchema),
  AuthController.resetPassword
);

// Protected authenticated routes
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.me);
router.post(
  '/change-password',
  authenticateToken,
  validateBody(ChangePasswordSchema),
  AuthController.changePassword
);
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), AuthController.uploadAvatar);
router.delete('/avatar', authenticateToken, AuthController.removeAvatar);

export const authRoutes = router;
