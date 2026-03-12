import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // loads .env in current dir (for Render)
dotenv.config({ path: '../.env' }); // loads parent .env (for local dev)

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import ambulanceRoutes from './modules/ambulance/ambulance.routes';
import hospitalRoutes from './modules/hospital/hospital.routes';
import volunteerRoutes from './modules/volunteer/volunteer.routes';
import trafficRoutes from './modules/traffic-police/traffic.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://emergex-six.vercel.app',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in dev; restrict further if needed
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/traffic-police', trafficRoutes);
app.use('/api/emergencies', emergencyRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
