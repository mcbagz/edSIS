import { Router } from 'express';
import { studentController } from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All student routes require authentication
router.use(authenticate);

// List and search students
router.get('/students', authorize('ADMIN', 'TEACHER'), studentController.listStudents);

// Get single student
router.get('/students/:id', studentController.getStudent);

// Create new student (Admin only)
router.post('/students', authorize('ADMIN'), studentController.createStudent);

// Update student (Admin only)
router.put('/students/:id', authorize('ADMIN'), studentController.updateStudent);

// Delete student (Admin only)
router.delete('/students/:id', authorize('ADMIN'), studentController.deleteStudent);

// Get student grades
router.get('/students/:id/grades', studentController.getStudentGrades);

// Get student attendance
router.get('/students/:id/attendance', studentController.getStudentAttendance);

export default router;