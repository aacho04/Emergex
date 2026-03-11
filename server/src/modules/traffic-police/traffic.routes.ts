import { Router } from 'express';
import trafficController from './traffic.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

router.use(authMiddleware);

router.get('/', trafficController.getAll);
router.get('/on-duty', trafficController.getOnDuty);
router.get('/nearby', trafficController.getNearby);
router.get('/me', roleMiddleware([UserRole.TRAFFIC_POLICE]), trafficController.getMyProfile);
router.patch(
  '/toggle-duty',
  roleMiddleware([UserRole.TRAFFIC_POLICE]),
  trafficController.toggleDuty
);
router.patch(
  '/location',
  roleMiddleware([UserRole.TRAFFIC_POLICE]),
  trafficController.updateLocation
);

export default router;
