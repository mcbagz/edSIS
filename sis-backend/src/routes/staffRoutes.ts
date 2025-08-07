import { Router } from 'express';
import {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffSchedule,
  getStaffStats
} from '../controllers/staffController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Staff routes
router.get('/staff', authenticate, getStaff);
router.get('/staff/stats', authenticate, getStaffStats);
router.get('/staff/:id', authenticate, getStaffMember);
router.get('/staff/:id/schedule', authenticate, getStaffSchedule);
router.post('/staff', authenticate, createStaff);
router.put('/staff/:id', authenticate, updateStaff);
router.delete('/staff/:id', authenticate, deleteStaff);

export default router;