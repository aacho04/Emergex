import { Router } from 'express';
import ambulanceController from './ambulance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

router.use(authMiddleware);

router.get('/', ambulanceController.getAll);
router.get('/available', ambulanceController.getAvailable);
router.get('/nearby', ambulanceController.getAvailableWithDistance);
router.get('/me', roleMiddleware([UserRole.AMBULANCE]), ambulanceController.getMyAmbulance);
router.patch('/toggle-duty', roleMiddleware([UserRole.AMBULANCE]), ambulanceController.toggleDuty);
router.patch('/location', roleMiddleware([UserRole.AMBULANCE]), ambulanceController.updateLocation);
router.patch('/status', roleMiddleware([UserRole.AMBULANCE]), ambulanceController.updateStatus);
router.get('/:id', ambulanceController.getById);

export default router;
