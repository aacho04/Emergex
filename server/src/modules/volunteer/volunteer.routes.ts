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
router.get('/leaderboard', authMiddleware, volunteerController.getLeaderboard);
router.get('/:id', authMiddleware, volunteerController.getById);

// Volunteer actions
router.post('/:id/accept', volunteerController.acceptEmergency);
router.post('/:id/complete', volunteerController.completeAssist);
router.patch('/:id/location', volunteerController.updateLocation);
router.get('/:id/nearby-ambulances', volunteerController.getNearbyAmbulances);

// Hospital rates volunteer
router.post(
  '/:id/rate',
  authMiddleware,
  roleMiddleware([UserRole.HOSPITAL]),
  volunteerController.rateVolunteer
);

export default router;
