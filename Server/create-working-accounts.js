// ==========================
// create-working-accounts.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const Student = require('./src/models/Student')
const User = require('./src/models/User')

async function createWorkingAccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔧 Creating Working Test Accounts:')
    console.log('==================================')
    
    // Clear existing test accounts
    await Student.deleteMany({ email: { $in: ['test@student.com', '23mca022@caias.in'] } })
    await User.deleteMany({ email: { $in: ['admin@placement.com', 'officer@placement.com'] } })
    console.log('🧹 Cleared existing test accounts')
    
    // Create a test student with known password
    const studentPassword = 'student123'
    const studentSalt = await bcrypt.genSalt(10)
    const studentHash = await bcrypt.hash(studentPassword, studentSalt)
    
    const testStudent = new Student({
      name: 'Test Student',
      email: 'test@student.com',
      password: studentHash,
      branch: 'Computer Science',
      year: '2024',
      cgpa: 8.5,
      phone: '9876543210'
    })
    
    await testStudent.save()
    console.log('✅ Created test student account')
    
    // Create a placement officer with known password
    const officerPassword = 'officer123'
    const officerSalt = await bcrypt.genSalt(10)
    const officerHash = await bcrypt.hash(officerPassword, officerSalt)
    
    const testOfficer = new User({
      name: 'Test Placement Officer',
      email: 'officer@placement.com',
      password: officerHash,
      role: 'placement_officer',
      status: 'active',
      phone: '9876543211'
    })
    
    await testOfficer.save()
    console.log('✅ Created test placement officer account')
    
    // Create an admin account
    const adminPassword = 'admin123'
    const adminSalt = await bcrypt.genSalt(10)
    const adminHash = await bcrypt.hash(adminPassword, adminSalt)
    
    const testAdmin = new User({
      name: 'System Admin',
      email: 'admin@placement.com',
      password: adminHash,
      role: 'admin',
      status: 'active',
      phone: '9876543212'
    })
    
    await testAdmin.save()
    console.log('✅ Created test admin account')
    
    // Verify all accounts work
    console.log('\n🔍 Verifying Accounts:')
    console.log('======================')
    
    // Test student login
    const student = await Student.findOne({ email: 'test@student.com' })
    const studentLoginWorks = await student.comparePassword(studentPassword)
    console.log(`📚 Student Login: ${studentLoginWorks ? '✅ Works' : '❌ Failed'}`)
    
    // Test officer login
    const officer = await User.findOne({ email: 'officer@placement.com' })
    const officerLoginWorks = await officer.comparePassword(officerPassword)
    console.log(`👨‍💼 Officer Login: ${officerLoginWorks ? '✅ Works' : '❌ Failed'}`)
    
    // Test admin login
    const admin = await User.findOne({ email: 'admin@placement.com' })
    const adminLoginWorks = await admin.comparePassword(adminPassword)
    console.log(`👨‍💼 Admin Login: ${adminLoginWorks ? '✅ Works' : '❌ Failed'}`)
    
    console.log('\n🎉 WORKING CREDENTIALS:')
    console.log('=======================')
    console.log('\n📚 STUDENT ACCOUNT:')
    console.log('📧 Email: test@student.com')
    console.log('🔑 Password: student123')
    console.log('📊 Role: Student (requires OTP)')
    
    console.log('\n👨‍💼 PLACEMENT OFFICER ACCOUNT:')
    console.log('📧 Email: officer@placement.com')
    console.log('🔑 Password: officer123')
    console.log('📊 Role: Placement Officer')
    
    console.log('\n👨‍💼 ADMIN ACCOUNT:')
    console.log('📧 Email: admin@placement.com')
    console.log('🔑 Password: admin123')
    console.log('📊 Role: Admin')
    
    console.log('\n🚀 Ready to test login!')
    console.log('💡 Use these credentials in your frontend login form.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

createWorkingAccounts()
