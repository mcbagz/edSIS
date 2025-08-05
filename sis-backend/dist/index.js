"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const enrollmentRoutes_1 = __importDefault(require("./routes/enrollmentRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const schedulingRoutes_1 = __importDefault(require("./routes/schedulingRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5177',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Token'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api', authRoutes_1.default);
app.use('/api', applicationRoutes_1.default);
app.use('/api', enrollmentRoutes_1.default);
app.use('/api', webhookRoutes_1.default);
app.use('/api', studentRoutes_1.default);
app.use('/api', courseRoutes_1.default);
app.use('/api', schedulingRoutes_1.default);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
//# sourceMappingURL=index.js.map