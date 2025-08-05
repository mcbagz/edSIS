import { Router } from 'express';
import {
  checkConflicts,
  getTeacherScheduleHandler,
  getStudentScheduleHandler,
  generateSchedule,
  checkTeacherAvailabilityHandler,
  checkRoomAvailabilityHandler
} from '../controllers/schedulingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Conflict detection
router.post('/scheduling/check-conflicts', authenticate, checkConflicts);

// Schedule views
router.get('/scheduling/teacher/:teacherId', authenticate, getTeacherScheduleHandler);
router.get('/scheduling/student/:studentId', authenticate, getStudentScheduleHandler);

// Auto-scheduler
router.post('/scheduling/generate', authenticate, generateSchedule);

// Availability checks
router.post('/scheduling/check-teacher-availability', authenticate, checkTeacherAvailabilityHandler);
router.post('/scheduling/check-room-availability', authenticate, checkRoomAvailabilityHandler);

export default router;