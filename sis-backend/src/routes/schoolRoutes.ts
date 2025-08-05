import { Router } from 'express';
import {
  getSchools,
  getSessions,
  getCurrentSession
} from '../controllers/schoolController';
import { authenticate } from '../middleware/auth';

const router = Router();

// School routes
router.get('/schools', authenticate, getSchools);
router.get('/sessions', authenticate, getSessions);
router.get('/sessions/current', authenticate, getCurrentSession);

export default router;