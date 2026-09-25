import { Router } from 'express';
import { RecruiterController } from '../controllers/recruiter.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { UpdateRecruiterProfileSchema, ROLES } from '@jobconnect/shared';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN));

router.get('/profile', RecruiterController.getProfile);
router.patch('/profile', validateBody(UpdateRecruiterProfileSchema), RecruiterController.updateProfile);

export const recruiterRoutes = router;
