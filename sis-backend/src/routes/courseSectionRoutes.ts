import { Router } from 'express';
import { courseSectionController } from '../controllers/courseSectionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all sections
router.get('/', courseSectionController.getAllSections);

// Get sections for a specific teacher
router.get('/teacher/:teacherId', courseSectionController.getTeacherSections);

// Get sections for a specific student
router.get('/student/:studentId', courseSectionController.getStudentSections);

// Get a specific section
router.get('/:id', courseSectionController.getSection);

// Get section enrollment
router.get('/:id/enrollment', courseSectionController.getSectionEnrollment);

// Create a new section (Admin/Teacher only)
router.post('/', courseSectionController.createSection);

// Update a section (Admin/Teacher only)
router.put('/:id', courseSectionController.updateSection);

// Delete a section (Admin only)
router.delete('/:id', courseSectionController.deleteSection);

export default router;