import { Router } from 'express';
import { EnrollmentWorkflowService } from '../services/enrollmentWorkflowService';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Webhook to process accepted applications
router.post('/webhooks/process-accepted-application', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      res.status(400).json({ message: 'applicationId is required' });
      return;
    }

    // Process the application asynchronously
    EnrollmentWorkflowService.processAcceptedApplication(applicationId)
      .then(() => {
        console.log('Application processed successfully:', applicationId);
      })
      .catch((error) => {
        console.error('Error processing application:', error);
      });

    // Return immediately
    res.json({ message: 'Processing started', applicationId });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Failed to start processing' });
  }
});

export default router;