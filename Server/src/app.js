import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { existsSync } from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/database.js';
import { initializeEmail } from './email/email.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import placementOfficerRoutes from './routes/placementOfficer.js';
import resumeRoutes from './routes/resume.js';
import jobsRoutes from './routes/jobs.js';
import externalJobsRoutes from './routes/externalJobs.js';
import companiesRoutes from './routes/companies.js';
import notificationsRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        // Allow our frontend origins to embed API responses (e.g., PDF proxy) via iframe
        "frame-ancestors": [
          "'self'",
          process.env.FRONTEND_URL || '',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'https://placement-final.vercel.app'
        ].filter(Boolean),
        "frame-src": [
          "'self'",
          "https://res.cloudinary.com",
          "https://api.cloudinary.com",
          "https://*.cloudinary.com"
        ],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com"
        ],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        "style-src-elem": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        "connect-src": [
          "'self'",
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:3000",
          "http://localhost:5000",
          "https://placement-final.vercel.app",
          "https://api.cloudinary.com",
          "https://res.cloudinary.com"
        ],
        "object-src": ["'none'"],
        "media-src": [
          "'self'",
          "https://res.cloudinary.com",
          "https://*.cloudinary.com"
        ]
      }
    },
  })
);

// Enhanced CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://localhost:4173', // Vite preview
        'http://127.0.0.1:4173',
        'https://placement-final.vercel.app'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('⚠️ CORS blocked origin:', origin);
        callback(null, true); // Allow all origins in development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Initialize email transporter (if credentials configured)
initializeEmail();

// Add preflight handling
app.options('*', cors());

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/placement-officer', placementOfficerRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/external-jobs', externalJobsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Static frontend hosting - Handle both development and production
const frontendDistPath = path.resolve(__dirname, '../../placement-ai/dist');

// Check if dist folder exists (production build)
const distExists = fs.existsSync(frontendDistPath);

if (distExists) {
  // Production: Serve static files from dist
  app.use(express.static(frontendDistPath));
  
  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Development: Redirect to frontend dev server
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    
    // For company form routes, serve a simple HTML page
    if (req.path.startsWith('/company-form/')) {
      const linkId = req.path.split('/')[2];
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/company-form/${linkId}`);
    } else {
      // Redirect other routes to frontend dev server
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(frontendUrl);
    }
  });
}

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

export default app; 
