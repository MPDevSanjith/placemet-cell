import app from './app.js';
import connectDB from './config/database.js';
import { initializeEmail } from './email/email.js';

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

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
