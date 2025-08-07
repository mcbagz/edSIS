import { Router } from 'express';
import {
  getAttendanceCodes,
  createAttendanceCode,
  updateAttendanceCode,
  deleteAttendanceCode,
  getDailyAttendance,
  recordDailyAttendance,
  getPeriodAttendance,
  recordPeriodAttendance,
  getStudentAttendanceReport,
  getClassAttendanceReport
} from '../controllers/attendanceController';

const router = Router();

// Attendance codes management
router.get('/attendanceCodes', getAttendanceCodes);
router.post('/attendanceCodes', createAttendanceCode);
router.put('/attendanceCodes/:id', updateAttendanceCode);
router.delete('/attendanceCodes/:id', deleteAttendanceCode);

// Daily attendance
router.get('/studentSectionAttendanceEvents', getDailyAttendance);
router.post('/studentSectionAttendanceEvents', recordDailyAttendance);

// Period attendance (using same endpoints with different params)
router.get('/studentSectionAttendanceEvents/period', getPeriodAttendance);
router.post('/studentSectionAttendanceEvents/period', recordPeriodAttendance);

// Reports
router.get('/attendance/reports/student', getStudentAttendanceReport);
router.get('/attendance/reports/class', getClassAttendanceReport);

export default router;