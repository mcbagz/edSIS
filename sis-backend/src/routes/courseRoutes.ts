import { Router } from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseSections,
  getCourseSection,
  createCourseSection,
  updateCourseSection,
  deleteCourseSection
} from '../controllers/courseController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Course routes
router.get('/courses', authenticate, getCourses);
router.get('/courses/:id', authenticate, getCourse);
router.post('/courses', authenticate, createCourse);
router.patch('/courses/:id', authenticate, updateCourse);
router.delete('/courses/:id', authenticate, deleteCourse);

// Section routes
router.get('/sections', authenticate, getCourseSections);
router.get('/sections/:id', authenticate, getCourseSection);
router.post('/sections', authenticate, createCourseSection);
router.patch('/sections/:id', authenticate, updateCourseSection);
router.delete('/sections/:id', authenticate, deleteCourseSection);

export default router;