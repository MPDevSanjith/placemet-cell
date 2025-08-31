// ==========================
// test-complete-login-flow.js
// ==========================
const mongoose = require('mongoose')
const fetch = require('node-fetch')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function testCompleteLoginFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔍 Testing Complete Login Flow:')
    console.log('===============================')
    
    const studentEmail = '23mca022@caias.in'
    const studentPassword = 'DD95637&'
    
    // Step 1: Generate a fresh OTP
    console.log('\n📱 Step 1: Generating Fresh OTP')
    console.log('================================')
    
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (!student) {
      console.log('❌ Student not found')
      return
    }
    
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000)
    
    student.loginOtpCode = otp
    student.loginOtpExpires = expires
    await student.save()
    
    console.log(`✅ OTP generated: ${otp}`)
    console.log(`⏰ Expires: ${expires.toLocaleTimeString()}`)
    
    // Step 2: Test login API
    console.log('\n🔐 Step 2: Testing Login API')
    console.log('============================')
    
    try {
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword
        })
      })
      
      const loginData = await loginResponse.json()
      console.log(`📊 Login Response Status: ${loginResponse.status}`)
      console.log(`📊 Login Response:`, JSON.stringify(loginData, null, 2))
      
      if (loginResponse.ok && loginData.otpRequired) {
        console.log('✅ Login successful, OTP required')
      } else {
        console.log('❌ Login failed')
        return
      }
    } catch (error) {
      console.log('❌ Login API error:', error.message)
      console.log('💡 Make sure the server is running on http://localhost:5000')
      return
    }
    
    // Step 3: Test OTP verification API
    console.log('\n🔢 Step 3: Testing OTP Verification API')
    console.log('=======================================')
    
    try {
      const otpResponse = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: studentEmail,
          otp: otp
        })
      })
      
      const otpData = await otpResponse.json()
      console.log(`📊 OTP Response Status: ${otpResponse.status}`)
      console.log(`📊 OTP Response:`, JSON.stringify(otpData, null, 2))
      
      if (otpResponse.ok && otpData.token) {
        console.log('✅ OTP verification successful!')
        console.log(`🔑 Token received: ${otpData.token.substring(0, 20)}...`)
      } else {
        console.log('❌ OTP verification failed')
        console.log(`❌ Error: ${otpData.error}`)
      }
    } catch (error) {
      console.log('❌ OTP API error:', error.message)
    }
    
    console.log('\n🎯 SUMMARY:')
    console.log('==========')
    console.log('📧 Email: 23mca022@caias.in')
    console.log('🔑 Password: DD95637&')
    console.log(`🔢 OTP: ${otp}`)
    console.log('\n💡 If the APIs are working, try these credentials in the frontend.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testCompleteLoginFlow()
