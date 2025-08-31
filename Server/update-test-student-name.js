// ==========================
// update-test-student-name.js
// ==========================
const mongoose = require('mongoose')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')

async function updateTestStudentName() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔧 Updating Test Student Name:')
    console.log('=============================')
    
    const studentEmail = 'test@student.com'
    const newName = 'John Doe' // Update this to a proper name
    
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
    console.log('\n🎉 Test student account updated successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

updateTestStudentName()

