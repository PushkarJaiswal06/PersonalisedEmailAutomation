import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env FIRST before any other imports
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Environment loaded from:', path.join(__dirname, '.env'));
console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);

// Now import other modules AFTER environment is loaded
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import emailRoutes from './routes/emailRoutes.js';
import { initializeSocketIO } from './socket/socketHandler.js';
import emailService from './services/emailService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.IO
initializeSocketIO(io);
app.set('io', io);

// MongoDB Connection with optimizations
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Initialize email service after environment is loaded
    emailService.initializeTransporter();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/emails', emailRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email Automation API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email Automation System ready`);
});
