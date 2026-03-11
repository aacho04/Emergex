import { Router } from 'express';
import emergencyController from './emergency.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware([UserRole.ERS_OFFICER, UserRole.SUPER_ADMIN]),
  emergencyController.create
);

router.get('/', emergencyController.getAll);
router.get('/stats', emergencyController.getStats);
router.get('/my', emergencyController.getMyEmergencies);
router.get('/:id', emergencyController.getById);

export default router;
