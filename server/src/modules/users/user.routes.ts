import { Router } from 'express';
import userController from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  userController.getAllUsers
);

router.get(
  '/stats',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  userController.getDashboardStats
);

router.get(
  '/ers-officers',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  userController.getERSOfficers
);

router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

router.patch(
  '/:id/deactivate',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  userController.deactivateUser
);

router.patch(
  '/:id/activate',
  roleMiddleware([UserRole.SUPER_ADMIN]),
  userController.activateUser
);

export default router;
