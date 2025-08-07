import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceControllerV2';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All attendance routes require authentication
router.use(authenticate);

// Record attendance
router.post('/record', authorize('ADMIN', 'TEACHER'), attendanceController.recordAttendance);
router.post('/record-bulk', authorize('ADMIN', 'TEACHER'), attendanceController.recordBulkAttendance);

// Get attendance
router.get('/class', attendanceController.getClassAttendance);
router.get('/student/:studentId/report', attendanceController.getStudentAttendanceReport);
router.get('/school/report', authorize('ADMIN'), attendanceController.getSchoolAttendanceReport);
router.get('/analytics', authorize('ADMIN'), attendanceController.getAttendanceAnalytics);
router.get('/summary', attendanceController.getAttendanceSummary);

// Notifications
router.post('/notifications', authorize('ADMIN', 'TEACHER'), attendanceController.sendAttendanceNotifications);

export default router;