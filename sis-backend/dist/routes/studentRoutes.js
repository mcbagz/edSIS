"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentController_1 = require("../controllers/studentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All student routes require authentication
router.use(auth_1.authenticate);
// List and search students
router.get('/students', (0, auth_1.authorize)('ADMIN', 'TEACHER'), studentController_1.studentController.listStudents);
// Get single student
router.get('/students/:id', studentController_1.studentController.getStudent);
// Create new student (Admin only)
router.post('/students', (0, auth_1.authorize)('ADMIN'), studentController_1.studentController.createStudent);
// Update student (Admin only)
router.put('/students/:id', (0, auth_1.authorize)('ADMIN'), studentController_1.studentController.updateStudent);
// Delete student (Admin only)
router.delete('/students/:id', (0, auth_1.authorize)('ADMIN'), studentController_1.studentController.deleteStudent);
// Get student grades
router.get('/students/:id/grades', studentController_1.studentController.getStudentGrades);
// Get student attendance
router.get('/students/:id/attendance', studentController_1.studentController.getStudentAttendance);
exports.default = router;
//# sourceMappingURL=studentRoutes.js.map