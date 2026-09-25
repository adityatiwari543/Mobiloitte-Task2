import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { ROLES } from '@jobconnect/shared';

const router = Router();

// Strict RBAC: Admin only
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.listUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/jobs', AdminController.listJobs);
router.patch('/jobs/:id/moderate', AdminController.moderateJob);
router.get('/audit-logs', AdminController.listAuditLogs);
router.get('/profile', AdminController.getProfile);
router.patch('/profile', AdminController.updateProfile);

export const adminRoutes = router;
