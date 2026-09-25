import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { aiRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { ROLES } from '@jobconnect/shared';

const router = Router();

// Apply AI rate limiter to prevent abuse and protect costs (Section 15.7 & 54)
router.use(aiRateLimiter);

// Candidate & Recruiter AI endpoints
router.post('/job-summary', AIController.summarizeJob);

router.post(
  '/match-score',
  authenticateToken,
  authorizeRoles(ROLES.CANDIDATE),
  AIController.explainMatch
);

router.post(
  '/generate-jd',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  AIController.generateJobDescription
);

router.post('/chat', authenticateToken, AIController.chat);

export const aiRoutes = router;
