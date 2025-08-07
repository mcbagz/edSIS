import { Router } from 'express';
import { customFieldController } from '../controllers/customFieldController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Custom Field Definition routes
router.get('/field-definitions', authenticate, customFieldController.getFieldDefinitions);
router.post('/field-definitions', authenticate, authorize('ADMIN'), customFieldController.createFieldDefinition);
router.put('/field-definitions/:id', authenticate, authorize('ADMIN'), customFieldController.updateFieldDefinition);
router.delete('/field-definitions/:id', authenticate, authorize('ADMIN'), customFieldController.deleteFieldDefinition);

// Student Custom Fields routes
router.get('/students/:studentId/custom-fields', authenticate, customFieldController.getStudentCustomFields);
router.put('/students/:studentId/custom-fields', authenticate, authorize('ADMIN'), customFieldController.updateStudentCustomFields);

// Attendance Codes routes
router.get('/attendance-codes', authenticate, customFieldController.getAttendanceCodes);
router.post('/attendance-codes', authenticate, authorize('ADMIN'), customFieldController.createAttendanceCode);
router.put('/attendance-codes/:id', authenticate, authorize('ADMIN'), customFieldController.updateAttendanceCode);
router.delete('/attendance-codes/:id', authenticate, authorize('ADMIN'), customFieldController.deleteAttendanceCode);

export default router;