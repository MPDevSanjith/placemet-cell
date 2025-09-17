import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    // Use MongoDB URI from environment variables with fallback
    const mongoURI = process.env.MONGODB_URI;
    
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
    })

    console.log('✅ MongoDB Connected:', conn.connection.host);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 To fix this:');
    console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('2. Or use MongoDB Atlas: https://www.mongodb.com/atlas');
    console.log('3. Update MONGODB_URI in your .env file');
    process.exit(1);
  }
}

export default connectDB
