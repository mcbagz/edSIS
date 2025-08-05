"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/auth/login', authController_1.authController.login);
// Protected routes
router.use(auth_1.authenticate);
router.get('/auth/me', authController_1.authController.getCurrentUser);
router.put('/auth/change-password', authController_1.authController.changePassword);
router.post('/auth/logout', authController_1.authController.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map