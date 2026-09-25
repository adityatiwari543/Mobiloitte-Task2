import { Router } from 'express';
import { SessionController } from '../controllers/session.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', SessionController.listSessions);
router.delete('/:sessionId', SessionController.revokeSession);
router.delete('/actions/revoke-others', SessionController.revokeOtherSessions);

export const sessionRoutes = router;
