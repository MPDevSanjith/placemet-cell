// ==========================
// routes/placementOfficer.js (clean version)
// ==========================
const express = require('express')
const multer = require('multer')
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')
const router = express.Router()

// Models
const Student = require('../models/Student')
const User = require('../models/User')

// Email configuration
const { sendEmail, emailTemplates } = require('../config/email')

// Multer configuration for CSV upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'), false)
    }
  }
})

// ---------- Helper Functions ----------

// Generate password for new accounts
const generatePassword = (name, rollNumberOrSeed) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter1 = letters[Math.floor(Math.random() * letters.length)]
  const letter2 = letters[Math.floor(Math.random() * letters.length)]
  const numbers = Math.floor(Math.random() * 90000) + 10000 // 5 digits
  return `${letter1}${letter2}${numbers}@`
}

// Validate CSV data
const validateCSVData = (data) => {
  const errors = []
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required')
  }
  
  if (!data.email || data.email.trim() === '') {
    errors.push('Email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    }
  }
  
  if (!data.branch) {
    data.branch = 'Computer Science'
  }
  
  if (!data.year) {
    data.year = new Date().getFullYear().toString()
  }
  
  return errors
}

// Send welcome email to student
const sendWelcomeEmail = async (email, password, name) => {
  const mailOptions = emailTemplates.welcomeStudent(name, email, password)
  return await sendEmail(mailOptions)
}

// Send welcome email to placement officer
const sendOfficerWelcomeEmail = async (email, password, name) => {
  const mailOptions = emailTemplates.welcomeOfficer(name, email, password)
  return await sendEmail(mailOptions)
}

// ---------- Routes ----------

// Bulk upload students via CSV
router.post('/bulk-upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' })
    }

    const results = []
    const errors = []
    const successful = []
    const failed = []

    // Read CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const row of results) {
            try {
              // Validate data
              const validationErrors = validateCSVData(row)
              if (validationErrors.length > 0) {
                failed.push({
                  email: row.email || 'N/A',
                  name: row.name || 'N/A',
                  errors: validationErrors
                })
                continue
              }

              // Check if student already exists
              const existingStudent = await Student.findOne({ email: row.email.toLowerCase() })
              if (existingStudent) {
                failed.push({
                  email: row.email,
                  name: row.name,
                  errors: ['Student already exists']
                })
                continue
              }

              // Generate password
              const password = generatePassword(row.name, row.rollNumber || '99')

              // Create student
              const student = new Student({
                name: row.name.trim(),
                email: row.email.toLowerCase().trim(),
                password,
                branch: row.branch || 'Computer Science',
                year: row.year || new Date().getFullYear().toString(),
                cgpa: parseFloat(row.cgpa) || 0,
                phone: row.phone || '',
                rollNumber: row.rollNumber || ''
              })

              await student.save()

              // Send welcome email
              const emailResult = await sendWelcomeEmail(row.email, password, row.name)
              if (!emailResult.success && !emailResult.skipped) {
                console.log(`⚠️ Failed to send email to ${row.email}: ${emailResult.error}`)
              }

              successful.push({
                email: row.email,
                name: row.name,
                password
              })

            } catch (error) {
              failed.push({
                email: row.email || 'N/A',
                name: row.name || 'N/A',
                errors: [error.message]
              })
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path)

          res.json({
            success: true,
            message: `Bulk upload completed. ${successful.length} successful, ${failed.length} failed.`,
            data: {
              successful,
              failed,
              total: results.length
            }
          })

        } catch (error) {
          console.error('Bulk upload error:', error)
          res.status(500).json({ success: false, error: 'Internal server error during bulk upload' })
        }
      })

  } catch (error) {
    console.error('Bulk upload error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Create individual student
router.post('/create', async (req, res) => {
  try {
    const { name, email, branch, year, cgpa, phone, rollNumber } = req.body || {}

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' })
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase() })
    if (existingStudent) {
      return res.status(409).json({ success: false, error: 'Student already exists' })
    }

    // Generate password
    const password = generatePassword(name, rollNumber || '99')

    // Create student
    const student = new Student({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      branch: branch || 'Computer Science',
      year: year || new Date().getFullYear().toString(),
      cgpa: parseFloat(cgpa) || 0,
      phone: phone || '',
      rollNumber: rollNumber || ''
    })

    await student.save()

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email, password, name)
    if (!emailResult.success && !emailResult.skipped) {
      console.log(`⚠️ Failed to send email to ${email}: ${emailResult.error}`)
    }

    console.log('✅ Student created successfully:', email)

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          branch: student.branch,
          year: student.year
        },
        password
      }
    })

  } catch (error) {
    console.error('Create student error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({}).select('-password -loginOtpCode -loginOtpExpires -resetPasswordToken -resetPasswordExpires')
    
    res.json({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Send welcome emails to existing students
router.post('/send-welcome-emails', async (req, res) => {
  try {
    const { emails } = req.body || {}
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: 'Email list is required' })
    }

    const results = []
    
    for (const email of emails) {
      try {
        const student = await Student.findOne({ email: email.toLowerCase() })
        if (!student) {
          results.push({ email, success: false, error: 'Student not found' })
          continue
        }

        // Generate new password
        const newPassword = generatePassword(student.name, student.rollNumber || '99')
        
        // Update password
        student.password = newPassword
        await student.save()

        // Send welcome email
        const emailResult = await sendWelcomeEmail(email, newPassword, student.name)
        
        results.push({
          email,
          success: emailResult.success,
          error: emailResult.error || null,
          password: newPassword
        })

      } catch (error) {
        results.push({ email, success: false, error: error.message })
      }
    }

    res.json({
      success: true,
      message: 'Welcome emails sent',
      data: results
    })

  } catch (error) {
    console.error('Send welcome emails error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

module.exports = router
