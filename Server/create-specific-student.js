// ==========================
// create-specific-student.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function createSpecificStudent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔧 Creating Specific Student Account:')
    console.log('=====================================')
    
    const studentEmail = '23mca022@caias.in'
    const studentPassword = 'DD95637&'
    
    // Check if student already exists
    const existingStudent = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (existingStudent) {
      console.log('⚠️ Student already exists, updating password...')
      existingStudent.password = studentPassword
      await existingStudent.save()
      console.log('✅ Password updated successfully')
    } else {
      // Create new student
      const testStudent = new Student({
        name: 'Test Student',
        email: studentEmail,
        password: studentPassword,
        branch: 'Computer Science',
        year: '2024',
        cgpa: 8.5,
        phone: '9876543210',
        onboardingCompleted: false
      })
      
      await testStudent.save()
      console.log('✅ Created new student account')
    }
    
    // Verify the account works
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    const loginWorks = await student.comparePassword(studentPassword)
    
    console.log('\n🔍 Verification:')
    console.log('================')
    console.log(`📧 Email: ${studentEmail}`)
    console.log(`🔑 Password: ${studentPassword}`)
    console.log(`🔐 Login Test: ${loginWorks ? '✅ Works' : '❌ Failed'}`)
    
    if (loginWorks) {
      console.log('\n🎉 SUCCESS: Student account is ready!')
      console.log('📧 Email: 23mca022@caias.in')
      console.log('🔑 Password: DD95637&')
      console.log('📊 Role: Student (requires OTP)')
    } else {
      console.log('\n❌ ERROR: Password verification failed')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

createSpecificStudent()
