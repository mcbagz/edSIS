import { Router } from 'express';
import { applicationController } from '../controllers/applicationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/applications', applicationController.createApplication);
router.post('/applications/upload-url', applicationController.getUploadUrl);

// Authenticated routes
router.use(authenticate);

router.get('/applications', authorize('ADMIN'), applicationController.listApplications);
router.get('/applications/:id', authorize('ADMIN'), applicationController.getApplication);
router.patch('/applications/:id/status', authorize('ADMIN'), applicationController.updateApplicationStatus);
router.patch('/applications/:id/documents', applicationController.updateDocuments);
router.get('/applications/download/:key', applicationController.getDownloadUrl);
router.post('/applications/:id/enroll', authorize('ADMIN'), applicationController.enrollAcceptedApplication);
router.put('/applications/:id/details', authorize('ADMIN'), applicationController.updateApplicationDetails);
router.get('/applications/stats/summary', authorize('ADMIN'), applicationController.getApplicationStats);

export default router;