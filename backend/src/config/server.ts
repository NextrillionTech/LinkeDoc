import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '../middleware/errorHandler';

import authRoutes from '../routes/authRoutes';
import userRoutes from '../routes/userRoutes';
import adminRoutes from '../routes/adminRoutes';
import forumRoutes from '../routes/forumRoutes';
import jobRoutes from '../routes/jobRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/jobs', jobRoutes);

// Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Global Error Handler
app.use(errorHandler);

// Start Server if not imported by test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 LinkeDoc API Server is running on port ${PORT}`);
  });
}

export default app;
