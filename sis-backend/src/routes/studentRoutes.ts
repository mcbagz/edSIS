import { Router } from 'express';
import { studentController } from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All student routes require authentication
router.use(authenticate);

// Advanced search - MUST be before :id route
router.get('/students/search', authorize('ADMIN', 'TEACHER'), studentController.searchStudents);

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

// Get student enrollment history
router.get('/students/:id/enrollment-history', studentController.getStudentEnrollmentHistory);

// Get student transcript
router.get('/students/:id/transcript', studentController.getStudentTranscript);

// Update student medical information
router.put('/students/:id/medical', authorize('ADMIN'), studentController.updateStudentMedicalInfo);

// Update student emergency contact
router.put('/students/:id/emergency-contact', authorize('ADMIN'), studentController.updateStudentEmergencyContact);

// Manage student-parent associations
router.post('/students/:id/parents', authorize('ADMIN'), studentController.addStudentParent);
router.delete('/students/:id/parents/:parentId', authorize('ADMIN'), studentController.removeStudentParent);

export default router;