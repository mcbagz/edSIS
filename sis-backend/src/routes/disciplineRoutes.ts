import { Router } from 'express';
import { disciplineController } from '../controllers/disciplineController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Incident management
router.get('/incidents', disciplineController.getIncidents);
router.get('/incidents/:id', disciplineController.getIncidentById);
router.post('/incidents', disciplineController.createIncident);
router.put('/incidents/:id', disciplineController.updateIncident);
router.delete('/incidents/:id', disciplineController.deleteIncident);

// Student-incident associations
router.post('/incidents/:incidentId/students', disciplineController.addStudentToIncident);
router.delete('/incidents/:incidentId/students/:studentId', disciplineController.removeStudentFromIncident);

// Discipline actions
router.post('/incidents/:incidentId/actions', disciplineController.addDisciplineAction);
router.put('/actions/:actionId', disciplineController.updateDisciplineAction);
router.delete('/actions/:actionId', disciplineController.deleteDisciplineAction);

// Student discipline history
router.get('/students/:studentId/history', disciplineController.getStudentDisciplineHistory);

// Reports and analytics
router.get('/report', disciplineController.generateDisciplineReport);

// Reference data
router.get('/behavior-codes', disciplineController.getBehaviorCodes);
router.get('/action-types', disciplineController.getActionTypes);

export default router;