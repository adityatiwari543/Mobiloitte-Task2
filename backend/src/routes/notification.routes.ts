import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', NotificationController.listNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/actions/read-all', NotificationController.markAllAsRead);

export const notificationRoutes = router;
