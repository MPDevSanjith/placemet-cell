// ==========================
// check-all-credentials.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')
const User = require('./src/models/User')

async function checkAllCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔍 Checking All Credentials:')
    console.log('=============================')
    
    // Check all students
    console.log('\n📚 STUDENTS:')
    console.log('-------------')
    const students = await Student.find({})
    
    if (students.length === 0) {
      console.log('❌ No students found in database')
    } else {
      console.log(`✅ Found ${students.length} student(s):`)
      
      for (const student of students) {
        console.log(`\n👤 Student: ${student.name}`)
        console.log(`📧 Email: ${student.email}`)
        console.log(`🔑 Has Password: ${student.password ? '✅ Yes' : '❌ No'}`)
        
        if (student.password) {
          // Test with common passwords
          const testPasswords = ['DD12345@', '123456', 'password', 'admin', 'test']
          
          for (const testPassword of testPasswords) {
            const isValid = await student.comparePassword(testPassword)
            if (isValid) {
              console.log(`✅ Working Password: ${testPassword}`)
              break
            }
          }
        }
      }
    }
    
    // Check all users (placement officers)
    console.log('\n👨‍💼 PLACEMENT OFFICERS:')
    console.log('------------------------')
    const users = await User.find({})
    
    if (users.length === 0) {
      console.log('❌ No placement officers found in database')
    } else {
      console.log(`✅ Found ${users.length} placement officer(s):`)
      
      for (const user of users) {
        console.log(`\n👤 Officer: ${user.name}`)
        console.log(`📧 Email: ${user.email}`)
        console.log(`🔑 Has Password: ${user.password ? '✅ Yes' : '❌ No'}`)
        console.log(`📊 Role: ${user.role}`)
        console.log(`📊 Status: ${user.status}`)
        
        if (user.password) {
          // Test with common passwords
          const testPasswords = ['admin123', '123456', 'password', 'admin', 'test']
          
          for (const testPassword of testPasswords) {
            const isValid = await user.comparePassword(testPassword)
            if (isValid) {
              console.log(`✅ Working Password: ${testPassword}`)
              break
            }
          }
        }
      }
    }
    
    console.log('\n📋 SUMMARY:')
    console.log('==========')
    console.log(`📚 Students: ${students.length}`)
    console.log(`👨‍💼 Officers: ${users.length}`)
    
    if (students.length === 0 && users.length === 0) {
      console.log('\n⚠️ No users found! You need to create accounts first.')
      console.log('💡 Use the bulk upload feature or create accounts manually.')
    } else {
      console.log('\n🚀 Ready to test login with the credentials above!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

checkAllCredentials()
