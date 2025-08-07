import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get available report templates
router.get('/reports/templates', reportController.getTemplates);

// Execute a report
router.post('/reports/execute', reportController.executeReport);

// Stream large CSV reports
router.get('/reports/stream', reportController.streamReport);

// Get chart data for a report
router.get('/reports/chart-data', reportController.getChartData);

// Schedule a report (future implementation)
router.post('/reports/schedule', reportController.scheduleReport);

// Get report execution history
router.get('/reports/history', reportController.getReportHistory);

export default router;