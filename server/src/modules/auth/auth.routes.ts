import { Router } from 'express';
import authController from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '../../constants/roles';

const router = Router();

router.post('/login', authController.login);
router.post('/register-hospital', authController.registerHospital);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);
router.get('/me', authMiddleware, authController.getMe);

// Super Admin only
router.post(
  '/create-ers-officer',
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  authController.registerERSOfficer
);

router.post(
  '/create-ambulance',
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  authController.createAmbulance
);

router.post(
  '/create-traffic-police',
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  authController.createTrafficPolice
);

router.post(
  '/create-hospital',
  authMiddleware,
  roleMiddleware([UserRole.SUPER_ADMIN]),
  authController.createHospital
);

export default router;
