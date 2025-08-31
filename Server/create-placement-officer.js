// ==========================
// create-placement-officer.js
// ==========================
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

// Import models
const User = require('./src/models/User')

async function createPlacementOfficer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_erp')
    console.log('✅ Connected to MongoDB')
    
    console.log('\n🔧 Creating Placement Officer Account:')
    console.log('=====================================')
    
    const officerEmail = '200936@sdmcujire.in'
    const officerPassword = 'Officer123@'
    const officerName = 'Placement Officer'
    
    // Check if officer already exists
    const existingOfficer = await User.findOne({ email: officerEmail.toLowerCase() })
    if (existingOfficer) {
      console.log('⚠️ Officer already exists, updating password...')
      existingOfficer.password = officerPassword
      existingOfficer.name = officerName
      await existingOfficer.save()
      console.log('✅ Password and name updated successfully')
    } else {
      // Create new placement officer
      const newOfficer = new User({
        name: officerName,
        email: officerEmail,
        password: officerPassword,
        role: 'placement_officer',
        status: 'active',
        phone: '9876543210'
      })
      
      await newOfficer.save()
      console.log('✅ Created new placement officer account')
    }
    
    // Verify the account works
    const officer = await User.findOne({ email: officerEmail.toLowerCase() })
    const loginWorks = await officer.comparePassword(officerPassword)
    
    console.log('\n🔍 Verification:')
    console.log('================')
    console.log(`📧 Email: ${officerEmail}`)
    console.log(`🔑 Password: ${officerPassword}`)
    console.log(`👤 Name: ${officerName}`)
    console.log(`🔐 Login Test: ${loginWorks ? '✅ Works' : '❌ Failed'}`)
    
    if (loginWorks) {
      console.log('\n🎉 SUCCESS: Placement officer account is ready!')
      console.log('📧 Email: 200936@sdmcujire.in')
      console.log('🔑 Password: Officer123@')
      console.log('👤 Name: Placement Officer')
      console.log('📊 Role: Placement Officer')
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

createPlacementOfficer()
