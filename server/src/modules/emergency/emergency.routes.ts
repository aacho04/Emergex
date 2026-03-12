import { Router } from 'express';
import emergencyController from './emergency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

// Public endpoint: receive location from SMS link (no auth required)
router.post('/location/:token', emergencyController.receiveLocation);

// All routes below require authentication
router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware([UserRole.ERS_OFFICER, UserRole.SUPER_ADMIN]),
  emergencyController.create
);

router.post(
  '/:id/send-sms',
  roleMiddleware([UserRole.ERS_OFFICER, UserRole.SUPER_ADMIN]),
  emergencyController.sendLocationSMS
);

router.post(
  '/:id/set-location',
  roleMiddleware([UserRole.ERS_OFFICER, UserRole.SUPER_ADMIN]),
  emergencyController.setManualLocation
);

router.post(
  '/:id/dispatch',
  roleMiddleware([UserRole.ERS_OFFICER, UserRole.SUPER_ADMIN]),
  emergencyController.dispatch
);

router.put(
  '/:id',
  roleMiddleware([UserRole.ERS_OFFICER, UserRole.SUPER_ADMIN]),
  emergencyController.updateEmergency
);

router.get('/', emergencyController.getAll);
router.get('/stats', emergencyController.getStats);
router.get('/my', emergencyController.getMyEmergencies);
router.get('/:id', emergencyController.getById);

export default router;
