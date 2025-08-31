const express = require('express')
const router = express.Router()

// Import MongoDB models
const Application = require('../models/Application')
const Student = require('../models/Student')
const PlacementDrive = require('../models/PlacementDrive')

// Get applications list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', studentId = '', driveId = '' } = req.query
    const skip = (page - 1) * limit

    let query = {}

    if (status) {
      query.status = status
    }

    if (studentId) {
      query.student = studentId
    }

    if (driveId) {
      query.drive = driveId
    }

    const applications = await Application.find(query)
      .populate('student', 'name email branch rollNumber')
      .populate({
        path: 'drive',
        populate: {
          path: 'company',
          select: 'name'
        }
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Application.countDocuments(query)

    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Submit application
router.post('/', async (req, res) => {
  try {
    const { studentId, driveId } = req.body

    if (!studentId || !driveId) {
      return res.status(400).json({ error: 'Student ID and Drive ID are required' })
    }

    // Check if student exists
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(400).json({ error: 'Student not found or inactive' })
    }

    // Check if drive exists and is active
    const drive = await PlacementDrive.findById(driveId)
    if (!drive || drive.status !== 'active') {
      return res.status(400).json({ error: 'Drive not found or inactive' })
    }

    // Check if application already exists
    const existingApplication = await Application.findOne({
      student: studentId,
      drive: driveId
    })

    if (existingApplication) {
      return res.status(400).json({ error: 'Application already exists for this drive' })
    }

    // Create application
    const application = new Application({
      student: studentId,
      drive: driveId,
      status: 'pending'
    })

    await application.save()

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    })

  } catch (error) {
    console.error('Error submitting application:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get application details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const application = await Application.findById(id)
      .populate('student', 'name email branch rollNumber')
      .populate({
        path: 'drive',
        populate: {
          path: 'company',
          select: 'name email'
        }
      })

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    res.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('Error fetching application details:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update application status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes, packageOffered } = req.body

    if (!status || !['pending', 'shortlisted', 'rejected', 'placed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' })
    }

    const application = await Application.findById(id)
      .populate('student', 'name email')
      .populate({
        path: 'drive',
        populate: {
          path: 'company',
          select: 'name'
        }
      })

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    // Update application
    application.status = status
    application.notes = notes || application.notes
    application.packageOffered = packageOffered || application.packageOffered

    // Add timestamp based on status
    if (status === 'shortlisted') {
      application.shortlistedAt = new Date()
    } else if (status === 'placed') {
      application.placedAt = new Date()
    }

    await application.save()

    // Send email notification to student (placeholder)
    console.log(`Status update email would be sent to ${application.student.email} for application ${id}`)

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application
    })

  } catch (error) {
    console.error('Error updating application status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get student's applications
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const applications = await Application.find({ student: studentId })
      .populate({
        path: 'drive',
        populate: {
          path: 'company',
          select: 'name email'
        }
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Application.countDocuments({ student: studentId })

    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching student applications:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
