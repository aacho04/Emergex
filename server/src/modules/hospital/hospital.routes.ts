import { Router } from 'express';
import hospitalController from './hospital.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

router.use(authMiddleware);

router.get('/', hospitalController.getAll);
router.get('/nearby', hospitalController.getNearby);
router.get('/me/emergencies', roleMiddleware([UserRole.HOSPITAL]), hospitalController.getMyEmergencies);
router.get('/me', roleMiddleware([UserRole.HOSPITAL]), hospitalController.getMyHospital);
router.put('/me', roleMiddleware([UserRole.HOSPITAL]), hospitalController.update);

router.get(
  '/admin/all',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  hospitalController.getAllAdmin
);

router.patch(
  '/:id/verify',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  hospitalController.verify
);

router.get('/:id', hospitalController.getById);

export default router;
