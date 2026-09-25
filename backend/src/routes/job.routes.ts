import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate.middleware.js';
import {
  CreateJobSchema,
  UpdateJobSchema,
  JobFilterQuerySchema,
  ROLES,
} from '@jobconnect/shared';

const router = Router();

// Public Job discovery endpoints
router.get('/', validateQuery(JobFilterQuerySchema), JobController.listJobs);
router.get('/:id', JobController.getJobById);

// Saved Jobs endpoints (Candidate authenticated)
router.get('/saved/all', authenticateToken, authorizeRoles(ROLES.CANDIDATE), JobController.listSavedJobs);
router.post('/:id/save', authenticateToken, authorizeRoles(ROLES.CANDIDATE), JobController.saveJob);
router.delete('/:id/save', authenticateToken, authorizeRoles(ROLES.CANDIDATE), JobController.unsaveJob);

// Recruiter Job Management endpoints
router.post(
  '/',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  validateBody(CreateJobSchema),
  JobController.createJob
);
router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  validateBody(UpdateJobSchema),
  JobController.updateJob
);
router.post(
  '/:id/publish',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  JobController.publishJob
);
router.post(
  '/:id/pause',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  JobController.pauseJob
);
router.post(
  '/:id/close',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  JobController.closeJob
);
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN),
  JobController.deleteJob
);

export const jobRoutes = router;
