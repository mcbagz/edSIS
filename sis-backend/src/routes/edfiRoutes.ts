import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import edfiService from '../services/edfiService';

const router = Router();

// Test Ed-Fi connection
router.get('/test-connection', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const isConnected = await edfiService.testConnection();
    if (isConnected) {
      res.json({ status: 'connected', message: 'Ed-Fi connection successful' });
    } else {
      res.status(503).json({ status: 'disconnected', message: 'Ed-Fi connection failed' });
    }
  } catch (error) {
    console.error('Error testing Ed-Fi connection:', error);
    res.status(500).json({ error: 'Failed to test Ed-Fi connection' });
  }
});

// Sync all data to Ed-Fi
router.post('/sync-all', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await edfiService.syncAll();
    res.json({ message: 'Full Ed-Fi synchronization completed successfully' });
  } catch (error) {
    console.error('Error syncing all data to Ed-Fi:', error);
    res.status(500).json({ error: 'Failed to sync all data to Ed-Fi' });
  }
});

// Sync specific entity types
router.post('/sync/schools', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await edfiService.syncAllSchools();
    res.json({ message: 'Schools synchronized to Ed-Fi successfully' });
  } catch (error) {
    console.error('Error syncing schools to Ed-Fi:', error);
    res.status(500).json({ error: 'Failed to sync schools to Ed-Fi' });
  }
});

router.post('/sync/students', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await edfiService.syncAllStudents();
    res.json({ message: 'Students synchronized to Ed-Fi successfully' });
  } catch (error) {
    console.error('Error syncing students to Ed-Fi:', error);
    res.status(500).json({ error: 'Failed to sync students to Ed-Fi' });
  }
});

router.post('/sync/courses', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await edfiService.syncAllCourses();
    res.json({ message: 'Courses synchronized to Ed-Fi successfully' });
  } catch (error) {
    console.error('Error syncing courses to Ed-Fi:', error);
    res.status(500).json({ error: 'Failed to sync courses to Ed-Fi' });
  }
});

router.post('/sync/sections', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await edfiService.syncAllCourseSections();
    res.json({ message: 'Course sections synchronized to Ed-Fi successfully' });
  } catch (error) {
    console.error('Error syncing course sections to Ed-Fi:', error);
    res.status(500).json({ error: 'Failed to sync course sections to Ed-Fi' });
  }
});

router.post('/sync/grades', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await edfiService.syncAllGrades();
    res.json({ message: 'Grades synchronized to Ed-Fi successfully' });
  } catch (error) {
    console.error('Error syncing grades to Ed-Fi:', error);
    res.status(500).json({ error: 'Failed to sync grades to Ed-Fi' });
  }
});

// Sync individual entities
router.post('/sync/student/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await edfiService.syncStudent(id);
    res.json({ message: `Student ${id} synchronized to Ed-Fi successfully` });
  } catch (error) {
    console.error(`Error syncing student ${req.params.id} to Ed-Fi:`, error);
    res.status(500).json({ error: 'Failed to sync student to Ed-Fi' });
  }
});

router.post('/sync/school/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await edfiService.syncSchool(id);
    res.json({ message: `School ${id} synchronized to Ed-Fi successfully` });
  } catch (error) {
    console.error(`Error syncing school ${req.params.id} to Ed-Fi:`, error);
    res.status(500).json({ error: 'Failed to sync school to Ed-Fi' });
  }
});

router.post('/sync/course/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await edfiService.syncCourse(id);
    res.json({ message: `Course ${id} synchronized to Ed-Fi successfully` });
  } catch (error) {
    console.error(`Error syncing course ${req.params.id} to Ed-Fi:`, error);
    res.status(500).json({ error: 'Failed to sync course to Ed-Fi' });
  }
});

router.post('/sync/section/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await edfiService.syncCourseSection(id);
    res.json({ message: `Course section ${id} synchronized to Ed-Fi successfully` });
  } catch (error) {
    console.error(`Error syncing course section ${req.params.id} to Ed-Fi:`, error);
    res.status(500).json({ error: 'Failed to sync course section to Ed-Fi' });
  }
});

router.post('/sync/grade/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await edfiService.syncGrade(id);
    res.json({ message: `Grade ${id} synchronized to Ed-Fi successfully` });
  } catch (error) {
    console.error(`Error syncing grade ${req.params.id} to Ed-Fi:`, error);
    res.status(500).json({ error: 'Failed to sync grade to Ed-Fi' });
  }
});

export default router;