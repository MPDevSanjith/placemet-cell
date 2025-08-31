// ==========================
// debug-otp-issue.js
// ==========================
const mongoose = require('mongoose')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function debugOtpIssue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔍 Debugging OTP Issue:')
    console.log('=======================')
    
    const studentEmail = '23mca022@caias.in'
    
    // Find the student and check current OTP status
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (!student) {
      console.log('❌ Student not found')
      return
    }
    
    console.log(`✅ Student found: ${student.name} (${student.email})`)
    console.log(`📱 Current OTP Code: ${student.loginOtpCode || 'None'}`)
    console.log(`⏰ OTP Expires: ${student.loginOtpExpires || 'None'}`)
    
    if (student.loginOtpExpires) {
      const now = new Date()
      const isExpired = student.loginOtpExpires < now
      console.log(`⏰ OTP Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`)
      console.log(`⏰ Time until expiry: ${Math.floor((student.loginOtpExpires - now) / 1000 / 60)} minutes`)
    }
    
    // Generate a fresh OTP for testing
    console.log('\n🔄 Generating Fresh OTP:')
    console.log('========================')
    
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    student.loginOtpCode = otp
    student.loginOtpExpires = expires
    await student.save()
    
    console.log(`🔢 New OTP Code: ${otp}`)
    console.log(`⏰ Expires: ${expires.toLocaleTimeString()}`)
    console.log(`📧 Email: ${studentEmail}`)
    
    console.log('\n🎯 TESTING CREDENTIALS:')
    console.log('======================')
    console.log('📧 Email: 23mca022@caias.in')
    console.log('🔑 Password: DD95637&')
    console.log(`🔢 OTP: ${otp}`)
    
    console.log('\n💡 INSTRUCTIONS:')
    console.log('================')
    console.log('1. Go to login page')
    console.log('2. Enter email: 23mca022@caias.in')
    console.log('3. Enter password: DD95637&')
    console.log('4. You should be redirected to OTP page')
    console.log(`5. Enter OTP: ${otp}`)
    console.log('6. You should be logged in successfully')
    
    console.log('\n🔧 API ENDPOINTS TO TEST:')
    console.log('=========================')
    console.log('POST http://localhost:5000/api/auth/login')
    console.log('Body: {"email":"23mca022@caias.in","password":"DD95637&"}')
    console.log('')
    console.log('POST http://localhost:5000/api/auth/verify-otp')
    console.log(`Body: {"email":"23mca022@caias.in","otp":"${otp}"}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

debugOtpIssue()
