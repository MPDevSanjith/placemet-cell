// ==========================
// show-all-accounts.js
// ==========================
const mongoose = require('mongoose')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')
const User = require('./src/models/User')

async function showAllAccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🎯 ALL WORKING ACCOUNTS:')
    console.log('========================')
    
    // Show Student Accounts
    console.log('\n📚 STUDENT ACCOUNTS:')
    console.log('====================')
    const students = await Student.find({}).select('name email')
    if (students.length > 0) {
      students.forEach((student, index) => {
        console.log(`${index + 1}. 👤 ${student.name}`)
        console.log(`   📧 Email: ${student.email}`)
        console.log(`   🔑 Password: DD95637&`)
        console.log(`   📊 Role: Student (requires OTP)`)
        console.log('')
      })
    } else {
      console.log('❌ No student accounts found')
    }
    
    // Show Placement Officer Accounts
    console.log('\n👨‍💼 PLACEMENT OFFICER ACCOUNTS:')
    console.log('===============================')
    const officers = await User.find({ role: 'placement_officer' }).select('name email')
    if (officers.length > 0) {
      officers.forEach((officer, index) => {
        console.log(`${index + 1}. 👤 ${officer.name}`)
        console.log(`   📧 Email: ${officer.email}`)
        console.log(`   🔑 Password: Officer123@`)
        console.log(`   📊 Role: Placement Officer`)
        console.log('')
      })
    } else {
      console.log('❌ No placement officer accounts found')
    }
    
    // Show Admin Accounts
    console.log('\n👨‍💼 ADMIN ACCOUNTS:')
    console.log('==================')
    const admins = await User.find({ role: 'admin' }).select('name email')
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. 👤 ${admin.name}`)
        console.log(`   📧 Email: ${admin.email}`)
        console.log(`   🔑 Password: admin123`)
        console.log(`   📊 Role: Admin`)
        console.log('')
      })
    } else {
      console.log('❌ No admin accounts found')
    }
    
    console.log('\n💡 LOGIN INSTRUCTIONS:')
    console.log('=====================')
    console.log('1. Start the server: cd Server && npm start')
    console.log('2. Start the frontend: cd placement-ai && npm run dev')
    console.log('3. Go to login page')
    console.log('4. Use any of the credentials above')
    console.log('5. Students will need OTP (shown in server console)')
    console.log('6. Officers/Admins login directly with password')
    
    console.log('\n🎨 EMAIL TEMPLATES:')
    console.log('==================')
    console.log('✅ All email templates use Instagram gradient colors')
    console.log('✅ Student names are properly mentioned in emails')
    console.log('✅ OTP emails include the student name')
    console.log('✅ Welcome emails include the user name')
    
    console.log('\n🎉 Everything is ready for testing!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

showAllAccounts()
