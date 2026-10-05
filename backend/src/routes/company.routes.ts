import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';
import { ROLES } from '@jobconnect/shared';

const router = Router();

// Recruiter actions (Static routes must precede wildcard :id)
router.get('/actions/dashboard', authenticateToken, authorizeRoles(ROLES.RECRUITER), CompanyController.getRecruiterDashboard);

// Public company details
router.get('/:id', CompanyController.getCompany);

// Recruiter company management
router.post('/', authenticateToken, authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN), CompanyController.createCompany);
router.patch('/:id', authenticateToken, authorizeRoles(ROLES.RECRUITER, ROLES.ADMIN), CompanyController.updateCompany);

export const companyRoutes = router;
