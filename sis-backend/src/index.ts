import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import studentRoutes from './routes/studentRoutes';
import courseRoutes from './routes/courseRoutes';
import schedulingRoutes from './routes/schedulingRoutes';
import staffRoutes from './routes/staffRoutes';
import schoolRoutes from './routes/schoolRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import attendanceRoutesV2 from './routes/attendanceRoutesV2';
import gradebookRoutes from './routes/gradebookRoutes';
import gradebookRoutesV2 from './routes/gradebookRoutesV2';
import reportRoutes from './routes/reportRoutes';
import disciplineRoutes from './routes/disciplineRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import customFieldRoutes from './routes/customFieldRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5177',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Token'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', applicationRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', webhookRoutes);
app.use('/api', studentRoutes);
app.use('/api', courseRoutes);
app.use('/api', schedulingRoutes);
app.use('/api', staffRoutes);
app.use('/api', schoolRoutes);
app.use('/api', attendanceRoutes);
app.use('/api/v2/attendance', attendanceRoutesV2);
app.use('/api', gradebookRoutes);
app.use('/api/v2/gradebook', gradebookRoutesV2);
app.use('/api', reportRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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