import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

// Get settings
router.get('/', settingsController.getSettings);
router.get('/category/:category', settingsController.getSettingsByCategory);
router.get('/grading-periods', settingsController.getGradingPeriods);
router.get('/current-session', settingsController.getCurrentSession);

// Update settings (Admin only)
router.put('/', authorize('ADMIN'), settingsController.updateSettings);
router.put('/category/:category', authorize('ADMIN'), settingsController.updateSettingsByCategory);
router.post('/session', authorize('ADMIN'), settingsController.upsertSession);
router.post('/reset', authorize('ADMIN'), settingsController.resetSettings);

export default router;