import { Router } from 'express';
import {
  getStaff,
  getStaffMember,
  createStaff
} from '../controllers/staffController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Staff routes
router.get('/staff', authenticate, getStaff);
router.get('/staff/:id', authenticate, getStaffMember);
router.post('/staff', authenticate, createStaff);

export default router;