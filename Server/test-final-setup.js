// ==========================
// test-final-setup.js
// ==========================
const mongoose = require('mongoose')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function testFinalSetup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔧 Final Setup Test:')
    console.log('==================')
    
    const studentEmail = '23mca022@caias.in'
    const studentPassword = 'DD95637&'
    const newName = 'Sanjith MP'
    
    // Find and update the student
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (!student) {
      console.log('❌ Student not found')
      return
    }
    
    console.log(`📧 Current name: ${student.name}`)
    console.log(`📧 Email: ${student.email}`)
    
    // Update the name
    student.name = newName
    await student.save()
    
    console.log(`✅ Name updated to: ${newName}`)
    
    // Test password validation
    const isValidPassword = await student.comparePassword(studentPassword)
    console.log(`🔐 Password validation: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`)
    
    // Generate a fresh OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000)
    
    student.loginOtpCode = otp
    student.loginOtpExpires = expires
    await student.save()
    
    console.log('\n🎯 FINAL TESTING CREDENTIALS:')
    console.log('============================')
    console.log('📧 Email: 23mca022@caias.in')
    console.log('🔑 Password: DD95637&')
    console.log(`🔢 OTP: ${otp}`)
    console.log(`👤 Name: ${newName}`)
    
    console.log('\n💡 INSTRUCTIONS:')
    console.log('================')
    console.log('1. Start the server: cd Server && npm start')
    console.log('2. Start the frontend: cd placement-ai && npm run dev')
    console.log('3. Go to login page')
    console.log('4. Enter email: 23mca022@caias.in')
    console.log('5. Enter password: DD95637&')
    console.log('6. You should be redirected to OTP page')
    console.log(`7. Enter OTP: ${otp}`)
    console.log('8. You should be logged in successfully')
    
    console.log('\n🎉 Everything is ready!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testFinalSetup()
