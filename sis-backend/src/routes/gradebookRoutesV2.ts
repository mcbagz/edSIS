import { Router } from 'express';
import { gradebookController } from '../controllers/gradebookControllerV2';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All gradebook routes require authentication
router.use(authenticate);

// Gradebook configuration
router.get('/config/:courseSectionId', authorize('TEACHER', 'ADMIN'), gradebookController.getGradebookConfig);
router.put('/config/:courseSectionId', authorize('TEACHER', 'ADMIN'), gradebookController.updateGradebookConfig);

// Grade calculations
router.get('/weighted-grade/:studentId/:courseSectionId', gradebookController.calculateWeightedGrade);
router.get('/gpa/:studentId', gradebookController.calculateGPA);

// Transcript and reports
router.get('/transcript/:studentId', authorize('ADMIN', 'STUDENT'), gradebookController.generateTranscript);
router.get('/progress-report/:studentId/:gradingPeriodId', gradebookController.generateProgressReport);

// Bulk operations
router.post('/bulk-entry', authorize('TEACHER', 'ADMIN'), gradebookController.bulkGradeEntry);

// Analytics
router.get('/distribution/:courseSectionId', authorize('TEACHER', 'ADMIN'), gradebookController.getGradeDistribution);

export default router;