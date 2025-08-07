import { Router } from 'express';
import { gradebookController } from '../controllers/gradebookController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Assignment routes
router.get('/assignments/section/:courseSectionId', gradebookController.getAssignments);
router.get('/assignments/:id', gradebookController.getAssignment);
router.post('/assignments', gradebookController.createAssignment);
router.put('/assignments/:id', gradebookController.updateAssignment);
router.delete('/assignments/:id', gradebookController.deleteAssignment);

// Grade routes
router.get('/grades', gradebookController.getGrades);
router.get('/grades/student/:studentId', gradebookController.getStudentGrades);
router.post('/grades', gradebookController.createGrade);
router.put('/grades/:id', gradebookController.updateGrade);
router.post('/grades/upsert', gradebookController.upsertGrade);
router.delete('/grades/:id', gradebookController.deleteGrade);

// Gradebook view for teachers
router.get('/gradebook/:courseSectionId', gradebookController.getGradebook);

// Weighted grade calculation
router.get('/grades/calculate/:studentId/:courseSectionId', gradebookController.calculateWeightedGrade);

// Report card generation
router.get('/report-card/:studentId/:gradingPeriodId', gradebookController.getReportCard);

// GPA calculation
router.get('/gpa/:studentId', gradebookController.calculateGPA);

export default router;