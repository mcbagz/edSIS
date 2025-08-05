import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/auth/login', authController.login);

// Protected routes
router.use(authenticate);
router.get('/auth/me', authController.getCurrentUser);
router.put('/auth/change-password', authController.changePassword);
router.post('/auth/logout', authController.logout);

export default router;