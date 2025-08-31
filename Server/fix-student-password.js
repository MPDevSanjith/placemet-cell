// ==========================
// fix-student-password.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function fixStudentPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    const studentEmail = '23mca022@caias.in'
    const newPassword = 'DD12345@'
    
    console.log('\n🔧 Fixing Student Password:')
    console.log('============================')
    console.log(`📧 Email: ${studentEmail}`)
    console.log(`🔑 New Password: ${newPassword}`)
    
    // Find the student
    const student = await Student.findOne({ email: studentEmail.toLowerCase() })
    if (!student) {
      console.log('❌ Student not found')
      return
    }
    
    console.log(`✅ Student found: ${student.name}`)
    
    // Hash the new password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    
    // Update the student's password
    student.password = hashedPassword
    await student.save()
    
    console.log('✅ Password updated successfully')
    
    // Verify the password works
    const isValidPassword = await student.comparePassword(newPassword)
    console.log(`🔐 Password verification: ${isValidPassword ? '✅ Valid' : '❌ Invalid'}`)
    
    if (isValidPassword) {
      console.log('\n🎉 SUCCESS: Student can now login!')
      console.log('📧 Email: 23mca022@caias.in')
      console.log('🔑 Password: DD12345@')
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

fixStudentPassword()
