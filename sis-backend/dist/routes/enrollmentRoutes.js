"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollmentController_1 = require("../controllers/enrollmentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All enrollment routes require authentication
router.use(auth_1.authenticate);
// Available courses and homerooms
router.get('/enrollment/courses', enrollmentController_1.enrollmentController.getAvailableCourses);
router.get('/enrollment/homerooms', enrollmentController_1.enrollmentController.getAvailableHomerooms);
// Student enrollments
router.get('/enrollment/student/:studentId', enrollmentController_1.enrollmentController.getStudentEnrollments);
router.post('/enrollment', (0, auth_1.authorize)('ADMIN', 'STUDENT'), enrollmentController_1.enrollmentController.enrollStudent);
router.delete('/enrollment/:enrollmentId', (0, auth_1.authorize)('ADMIN'), enrollmentController_1.enrollmentController.dropCourse);
exports.default = router;
//# sourceMappingURL=enrollmentRoutes.js.map