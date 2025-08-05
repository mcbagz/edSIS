"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const schedulingController_1 = require("../controllers/schedulingController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Conflict detection
router.post('/scheduling/check-conflicts', auth_1.authenticate, schedulingController_1.checkConflicts);
// Schedule views
router.get('/scheduling/teacher/:teacherId', auth_1.authenticate, schedulingController_1.getTeacherScheduleHandler);
router.get('/scheduling/student/:studentId', auth_1.authenticate, schedulingController_1.getStudentScheduleHandler);
// Auto-scheduler
router.post('/scheduling/generate', auth_1.authenticate, schedulingController_1.generateSchedule);
// Availability checks
router.post('/scheduling/check-teacher-availability', auth_1.authenticate, schedulingController_1.checkTeacherAvailabilityHandler);
router.post('/scheduling/check-room-availability', auth_1.authenticate, schedulingController_1.checkRoomAvailabilityHandler);
exports.default = router;
//# sourceMappingURL=schedulingRoutes.js.map