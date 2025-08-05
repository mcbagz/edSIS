"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const applicationController_1 = require("../controllers/applicationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/applications', applicationController_1.applicationController.createApplication);
router.post('/applications/upload-url', applicationController_1.applicationController.getUploadUrl);
// Authenticated routes
router.use(auth_1.authenticate);
router.get('/applications', (0, auth_1.authorize)('ADMIN'), applicationController_1.applicationController.listApplications);
router.get('/applications/:id', (0, auth_1.authorize)('ADMIN'), applicationController_1.applicationController.getApplication);
router.patch('/applications/:id/status', (0, auth_1.authorize)('ADMIN'), applicationController_1.applicationController.updateApplicationStatus);
router.patch('/applications/:id/documents', applicationController_1.applicationController.updateDocuments);
router.get('/applications/download/:key', applicationController_1.applicationController.getDownloadUrl);
exports.default = router;
//# sourceMappingURL=applicationRoutes.js.map