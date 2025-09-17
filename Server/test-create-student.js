// Test creating a student for OTP testing
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './src/models/Student.js';

dotenv.config();

async function createTestStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Check if test student already exists
    const existingStudent = await Student.findOne({ email: 'test@example.com' });
    
    if (existingStudent) {
      console.log('✅ Test student already exists:', existingStudent.email);
      return;
    }

    // Create test student
    const testStudent = new Student({
      name: 'Test Student',
      email: 'test@example.com',
      password: 'password123',
      branch: 'Computer Science',
      section: 'A',
      rollNumber: 'TEST001',
      phone: '1234567890',
      year: '2024'
    });

    await testStudent.save();
    console.log('✅ Test student created:', testStudent.email);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
}

createTestStudent();