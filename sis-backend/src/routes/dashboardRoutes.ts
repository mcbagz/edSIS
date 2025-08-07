import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard statistics based on user role
router.get('/stats', dashboardController.getDashboardStats);

// Get announcements
router.get('/announcements', dashboardController.getAnnouncements);

// Get upcoming events
router.get('/events', dashboardController.getUpcomingEvents);

export default router;