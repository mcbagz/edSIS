"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courseController_1 = require("../controllers/courseController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Course routes
router.get('/courses', auth_1.authenticate, courseController_1.getCourses);
router.get('/courses/:id', auth_1.authenticate, courseController_1.getCourse);
router.post('/courses', auth_1.authenticate, courseController_1.createCourse);
router.patch('/courses/:id', auth_1.authenticate, courseController_1.updateCourse);
router.delete('/courses/:id', auth_1.authenticate, courseController_1.deleteCourse);
// Section routes
router.get('/sections', auth_1.authenticate, courseController_1.getCourseSections);
router.get('/sections/:id', auth_1.authenticate, courseController_1.getCourseSection);
router.post('/sections', auth_1.authenticate, courseController_1.createCourseSection);
router.patch('/sections/:id', auth_1.authenticate, courseController_1.updateCourseSection);
router.delete('/sections/:id', auth_1.authenticate, courseController_1.deleteCourseSection);
exports.default = router;
//# sourceMappingURL=courseRoutes.js.map