import app from './app.js';
import connectDB from './config/database.js';
import { initializeEmail } from './email/email.js';

<<<<<<< HEAD
const app = express()
const PORT = process.env.PORT || 5000

// Database
const connectDB = require('./config/database')


// Email Service
const { initializeEmail } = require('./config/email')

// Middleware
app.use(helmet())
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }))
app.use(morgan('combined'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() })
})

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/students', require('./routes/students'))
app.use('/api/placement-officer', require('./routes/placementOfficer'))
app.use('/api/external-jobs', require('./routes/externalJobs'))
app.use('/api/jobs', require('./routes/jobs'))
app.use('/api/companies', require('./routes/companies'))

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' })
})

// 404
app.use('*', (req, res) => res.status(404).json({ success: false, error: 'Route not found' }))
=======
const PORT = process.env.PORT || 5000;
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    
<<<<<<< HEAD
    // Google Drive integration removed
    
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}
=======
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892

    // Initialize email service
    console.log('📧 Initializing Email Service...');
    initializeEmail();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
