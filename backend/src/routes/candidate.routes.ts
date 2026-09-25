import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { resumeUpload } from '../utils/upload.js';
import { UpdateProfileSchema, ROLES } from '@jobconnect/shared';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(ROLES.CANDIDATE));

router.get('/profile', CandidateController.getProfile);
router.patch('/profile', validateBody(UpdateProfileSchema), CandidateController.updateProfile);
router.post('/resume', resumeUpload.single('resume'), CandidateController.uploadResume);
router.delete('/resume', CandidateController.removeResume);
router.get('/dashboard', CandidateController.getDashboard);

export const candidateRoutes = router;
