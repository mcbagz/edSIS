import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All enrollment routes require authentication
router.use(authenticate);

// Available courses and homerooms
router.get('/enrollment/courses', enrollmentController.getAvailableCourses);
router.get('/enrollment/homerooms', enrollmentController.getAvailableHomerooms);

// Student enrollments
router.get('/enrollment/student/:studentId', enrollmentController.getStudentEnrollments);
router.post('/enrollment', authorize('ADMIN', 'STUDENT'), enrollmentController.enrollStudent);
router.delete('/enrollment/:enrollmentId', authorize('ADMIN'), enrollmentController.dropCourse);

export default router;