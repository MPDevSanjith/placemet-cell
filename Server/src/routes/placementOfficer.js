const express = require('express')
const multer = require('multer')
const csv = require('csv-parser')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const router = express.Router()

// Import MongoDB models
const Student = require('../models/Student')
const User = require('../models/User')

// Configure multer for CSV upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel']
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Email configuration
const { sendEmail, emailTemplates } = require('../config/email')

// Generate secure password
const generatePassword = (name, rollNumberOrSeed) => {
  // Create a simple 4-5 digit password
  const numbers = Math.floor(Math.random() * 90000) + 10000 // 5 digits (10000-99999)
  const specialChars = '@#$%&*'
  const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)]
  
  // Format: First 2 letters of name + 5 digits + special char
  return `${name.slice(0, 2).toUpperCase()}${numbers}${randomChar}`
}

// Validate CSV data
const validateCSVData = (data) => {
  const errors = []
  
  if (!data.name || !data.email) {
    errors.push('Missing required fields: name, email')
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push(`Invalid email format: ${data.email}`)
  }
  
  // Make branch and year optional
  if (!data.branch) {
    data.branch = 'Not Specified'
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

// Send officer welcome email
// Send welcome email to placement officer
const sendOfficerWelcomeEmail = async (email, password, name) => {
  const mailOptions = emailTemplates.welcomeOfficer(name, email, password)
  return await sendEmail(mailOptions)
}

// Register another placement officer
router.post('/create-officer', async (req, res) => {
  try {
    const { name, email } = req.body || {}
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' })
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() })
    if (existing) {
      return res.status(409).json({ success: false, error: 'User already exists' })
    }

    const password = generatePassword(name, '99')

    // Send email first
    const emailResult = await sendOfficerWelcomeEmail(email, password, name)
    if (!emailResult.success) {
      return res.status(502).json({ 
        success: false, 
        error: `Failed to send email: ${emailResult.error}` 
      })
    }

    // Create user account
    const user = new User({
      name,
      email: String(email).toLowerCase(),
      password,
      role: 'placement_officer',
      status: 'active'
    })
    await user.save()

    console.log('✅ Placement officer created successfully:', email)

    res.status(201).json({ 
      success: true, 
      message: 'Officer account created and email sent successfully',
      officer: { 
        id: user._id, 
        email: user.email, 
        name: user.name 
      } 
    })

  } catch (error) {
    console.error('Create officer error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create officer account' 
    })
  }
})

// Bulk upload students from CSV
router.post('/bulk-upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' })
    }

    console.log('Processing CSV upload:', req.file.originalname)

    const results = []
    const errors = []
    const students = []

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        const validationErrors = validateCSVData(data)
        if (validationErrors.length > 0) {
          errors.push({
            row: data,
            errors: validationErrors
          })
        } else {
          students.push(data)
        }
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path)

          if (students.length === 0) {
            return res.json({
              success: false,
              error: 'No valid student data found in CSV',
              errors
            })
          }

          // Create student accounts
          const createdStudents = []
          for (const studentData of students) {
            try {
              const password = generatePassword(studentData.name, studentData.rollNumber || Math.floor(Math.random() * 100))
              
              const student = new Student({
                name: studentData.name,
                email: studentData.email.toLowerCase(),
                password,
                branch: studentData.branch,
                year: studentData.year,
                cgpa: studentData.cgpa || null,
                phone: studentData.phone || null
              })

              await student.save()
              createdStudents.push({
                email: student.email,
                password,
                name: student.name
              })

            } catch (error) {
              errors.push({
                row: studentData,
                error: error.message
              })
            }
          }

          console.log(`✅ Created ${createdStudents.length} student accounts`)

          // Format response to match frontend expectations
          const accounts = createdStudents.map(student => ({
            email: student.email,
            password: student.password,
            status: 'created',
            name: student.name
          }))
          
          // Add failed accounts
          errors.forEach(error => {
            if (error.row) {
              accounts.push({
                email: error.row.email || 'Unknown',
                password: '',
                status: 'failed',
                error: error.errors ? error.errors.join(', ') : error.error || 'Unknown error'
              })
            }
          })

          res.json({
            success: true,
            message: `Successfully created ${createdStudents.length} student accounts`,
            successful: createdStudents.length,
            failed: errors.length,
            errors: errors.map(e => e.errors ? e.errors.join(', ') : e.error || 'Unknown error'),
            accounts
          })

        } catch (error) {
          console.error('Bulk upload processing error:', error)
          res.status(500).json({
            success: false,
            error: 'Failed to process bulk upload'
          })
        }
      })

  } catch (error) {
    console.error('Bulk upload error:', error)
    res.status(500).json({
      success: false,
      error: 'Bulk upload failed'
    })
  }
})

// Send welcome emails to students
router.post('/send-welcome-emails', async (req, res) => {
  try {
    const { students } = req.body

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        error: 'Students array is required'
      })
    }

    const results = []
    let successCount = 0
    let failureCount = 0

    for (const student of students) {
      try {
        const emailResult = await sendWelcomeEmail(
          student.email,
          student.password,
          student.name
        )

        if (emailResult.success) {
          successCount++
          results.push({
            email: student.email,
            status: 'sent',
            password: student.password
          })
        } else {
          failureCount++
          results.push({
            email: student.email,
            status: 'failed',
            error: emailResult.error
          })
        }

      } catch (error) {
        failureCount++
        results.push({
          email: student.email,
          status: 'failed',
          error: error.message
        })
      }
    }

    console.log(`✅ Sent ${successCount} welcome emails, ${failureCount} failed`)

    res.json({
      success: true,
      message: `Sent ${successCount} welcome emails successfully`,
      results: {
        total: students.length,
        success: successCount,
        failure: failureCount,
        details: results
      }
    })

  } catch (error) {
    console.error('Send welcome emails error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send welcome emails'
    })
  }
})

// Get student by email
router.get('/student-by-email', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      })
    }

    const student = await Student.findOne({ email: email.toLowerCase() })
    const exists = !!student

    res.json({
      success: true,
      exists,
      student: exists ? {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year
      } : null
    })

  } catch (error) {
    console.error('Get student by email error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get student information'
    })
  }
})

// Create student manually
router.post('/create-student', async (req, res) => {
  try {
    const { name, email, branch, year, cgpa, phone } = req.body

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      })
    }

    const existing = await Student.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Student with this email already exists'
      })
    }

    const password = generatePassword(name, Math.floor(Math.random() * 100))

    const student = new Student({
      name,
      email: email.toLowerCase(),
      password,
      branch: branch || 'Not Specified',
      year: year || new Date().getFullYear().toString(),
      cgpa: cgpa || null,
      phone: phone || null
    })

    await student.save()

    console.log('✅ Student created manually:', email)

    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year
      },
      password
    })

  } catch (error) {
    console.error('Create student error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create student account'
    })
  }
})

module.exports = router
