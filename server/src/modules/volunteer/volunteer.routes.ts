import { Router } from 'express';
import volunteerController from './volunteer.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

// Public route - volunteers register without account
router.post('/register', volunteerController.register);

// Protected routes
router.get('/', authMiddleware, volunteerController.getAll);
router.get('/nearby', authMiddleware, volunteerController.getNearby);
router.get('/:id', authMiddleware, volunteerController.getById);
router.post(
  '/:id/rate',
  authMiddleware,
  roleMiddleware([UserRole.HOSPITAL]),
  volunteerController.rateVolunteer
);

export default router;
