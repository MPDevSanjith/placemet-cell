const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Database
const connectDB = require('./config/database')

// Google Drive Service
const driveService = require('./utils/googleDrive')

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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' })
})

// 404
app.use('*', (req, res) => res.status(404).json({ success: false, error: 'Route not found' }))

// Start server
const startServer = async () => {
  try {
    await connectDB()
    console.log('📧 Initializing Email Service...')
    initializeEmail()
    
    console.log('🔑 Initializing Google Drive...')
    const driveOk = await driveService.initialize()
    if (!driveOk) {
      console.error('❌ Google Drive initialization failed.')
      console.error('💡 Please check GOOGLE_DRIVE_SETUP.md for configuration instructions')
      console.error('📁 You need to set GDRIVE_SHARED_DRIVE_ID environment variable')
      process.exit(1)
    }
    
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()
