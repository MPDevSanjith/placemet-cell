// ==========================
// test-student-login.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function testStudentLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔍 Testing Student Login Flow:')
    console.log('==============================')
    
    const studentEmail = '23mca022@caias.in'
    const studentPassword = 'DD95637&'
    
    // Find the student
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (!student) {
      console.log('❌ Student not found')
      return
    }
    
    console.log(`✅ Student found: ${student.name} (${student.email})`)
    
    // Test password validation
    const isValidPassword = await student.comparePassword(studentPassword)
    console.log(`🔐 Password validation: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`)
    
    if (!isValidPassword) {
      console.log('❌ Login failed - Invalid password')
      return
    }
    
    // Simulate login flow - generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000)
    
    student.loginOtpCode = otp
    student.loginOtpExpires = expires
    await student.save()
    
    console.log('\n📱 OTP Generated:')
    console.log('=================')
    console.log(`🔢 OTP Code: ${otp}`)
    console.log(`⏰ Expires: ${expires.toLocaleTimeString()}`)
    console.log(`📧 Email: ${studentEmail}`)
    
    console.log('\n🎉 SUCCESS: Student login flow is working!')
    console.log('📧 Email: 23mca022@caias.in')
    console.log('🔑 Password: DD95637&')
    console.log(`🔢 OTP: ${otp}`)
    console.log('\n💡 Use these credentials in your frontend login form.')
    console.log('💡 The OTP will be returned in the API response in development mode.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testStudentLogin()
