import { Router } from 'express';
import { SessionController } from '../controllers/session.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', SessionController.listSessions);
router.delete('/actions/revoke-others', SessionController.revokeOtherSessions);
router.delete('/:sessionId', SessionController.revokeSession);

export const sessionRoutes = router;
