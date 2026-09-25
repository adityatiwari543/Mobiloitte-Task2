import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  ApplyJobSchema,
  UpdateApplicationStatusSchema,
  ScheduleInterviewSchema,
  ROLES,
} from '@jobconnect/shared';

const router = Router();

router.use(authenticateToken);

// Candidate routes
router.post(
  '/jobs/:jobId/apply',
  authorizeRoles(ROLES.CANDIDATE),
  validateBody(ApplyJobSchema),
  ApplicationController.applyJob
);
router.get('/me', authorizeRoles(ROLES.CANDIDATE), ApplicationController.getMyApplications);
router.patch(
  '/:id/withdraw',
  authorizeRoles(ROLES.CANDIDATE),
  ApplicationController.withdrawApplication
);

// Recruiter routes
router.get(
  '/jobs/:jobId/applicants',
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  ApplicationController.getJobApplicants
);
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  validateBody(UpdateApplicationStatusSchema),
  ApplicationController.updateStatus
);
router.get(
  '/recruiter/applicants',
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  ApplicationController.getAllRecruiterApplicants
);
router.get(
  '/recruiter/interviews',
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  ApplicationController.getRecruiterInterviews
);
router.post(
  '/interviews',
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  validateBody(ScheduleInterviewSchema),
  ApplicationController.scheduleInterview
);

// General IDOR protected details route
router.get('/:id', ApplicationController.getApplicationById);

export const applicationRoutes = router;
