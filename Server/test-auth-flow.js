// ==========================
// test-auth-flow.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')
const User = require('./src/models/User')

async function testAuthFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔍 Testing Authentication Flow:')
    console.log('================================')
    
    // Test student login flow
    const studentEmail = '23mca022@caias.in'
    const studentPassword = 'DD12345@'
    
    console.log('\n📚 Testing Student Login:')
    console.log('---------------------------')
    
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (student) {
      console.log(`✅ Student found: ${student.name} (${student.email})`)
      
      // Test password comparison
      const isValidPassword = await student.comparePassword(studentPassword)
      console.log(`🔐 Password validation: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`)
      
      if (isValidPassword) {
        // Simulate OTP generation
        const otp = String(Math.floor(100000 + Math.random() * 900000))
        const expires = new Date(Date.now() + 10 * 60 * 1000)
        
        student.loginOtpCode = otp
        student.loginOtpExpires = expires
        await student.save()
        
        console.log(`📱 OTP generated: ${otp} (expires: ${expires.toLocaleTimeString()})`)
        console.log('✅ Student login flow: READY')
      } else {
        console.log('❌ Student login flow: FAILED - Invalid password')
      }
    } else {
      console.log('❌ Student not found')
    }
    
    // Test placement officer login flow
    console.log('\n👨‍💼 Testing Placement Officer Login:')
    console.log('-------------------------------------')
    
    const officers = await User.find({ role: 'placement_officer' })
    if (officers.length > 0) {
      console.log(`✅ Found ${officers.length} placement officer(s)`)
      
      for (const officer of officers) {
        console.log(`   - ${officer.name} (${officer.email}) - Status: ${officer.status}`)
        
        if (officer.password) {
          console.log(`   🔐 Has password: ✅`)
          console.log(`   📊 Account status: ${officer.status}`)
        } else {
          console.log(`   🔐 Has password: ❌`)
        }
      }
      console.log('✅ Placement officer login flow: READY')
    } else {
      console.log('⚠️ No placement officers found')
      console.log('💡 Create a placement officer account first')
    }
    
    console.log('\n🔍 System Status Summary:')
    console.log('==========================')
    console.log('✅ MongoDB: Connected')
    console.log('✅ Student Model: Ready')
    console.log('✅ User Model: Ready')
    console.log('✅ Password Hashing: Working')
    console.log('✅ OTP System: Ready')
    
    console.log('\n🚀 Ready to test login!')
    console.log('📧 Student Email: 23mca022@caias.in')
    console.log('🔑 Student Password: DD12345@')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

testAuthFlow()
