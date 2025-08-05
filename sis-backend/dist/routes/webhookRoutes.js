"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollmentWorkflowService_1 = require("../services/enrollmentWorkflowService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Webhook to process accepted applications
router.post('/webhooks/process-accepted-application', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), async (req, res) => {
    try {
        const { applicationId } = req.body;
        if (!applicationId) {
            res.status(400).json({ message: 'applicationId is required' });
            return;
        }
        // Process the application asynchronously
        enrollmentWorkflowService_1.EnrollmentWorkflowService.processAcceptedApplication(applicationId)
            .then(() => {
            console.log('Application processed successfully:', applicationId);
        })
            .catch((error) => {
            console.error('Error processing application:', error);
        });
        // Return immediately
        res.json({ message: 'Processing started', applicationId });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Failed to start processing' });
    }
});
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map