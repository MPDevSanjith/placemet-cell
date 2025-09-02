const express = require('express')
const multer = require('multer')
const router = express.Router()
const Student = require('../models/Student')
const { authenticateToken } = require('../middleware/auth')
// Google Drive integration removed

// Multer setup for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'))
    }
  }
})

// Resume upload route - supports multiple resumes
router.post('/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No resume file provided' })
    }

    const timestamp = Date.now()
    const originalName = req.file.originalname
    const fileName = `resume_${timestamp}_${originalName}`

    // Store file locally or mark as uploaded without external storage
    const uploadResult = { success: true, fileId: null, fileUrl: null, id: null, link: null }

    // Get student and add new resume
    const student = await Student.findById(req.user.id)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    // Add new resume using the model method
    await student.addResume({
      fileName: fileName,
      driveId: '',
      driveLink: '',
      description: req.body.description || 'Resume uploaded'
    })

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        fileName: fileName,
        driveLink: '',
        driveId: ''
      }
    })

  } catch (error) {
    console.error('Resume upload error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get all resumes for a student
router.get('/resumes', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('resumes')
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({
      success: true,
      resumes: student.resumes
    })
  } catch (error) {
    console.error('Get resumes error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Set active resume
router.put('/resume/:resumeId/activate', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params
    const student = await Student.findById(req.user.id)
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    // Set all resumes to inactive
    student.resumes.forEach(resume => resume.isActive = false)
    
    // Set the specified resume as active
    const resume = student.resumes.id(resumeId)
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' })
    }
    
    resume.isActive = true
    await student.save()

    res.json({
      success: true,
      message: 'Active resume updated',
      activeResume: resume
    })
  } catch (error) {
    console.error('Activate resume error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete resume
router.delete('/resume/:resumeId', authenticateToken, async (req, res) => {
  try {
    const { resumeId } = req.params
    const student = await Student.findById(req.user.id)
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    const resume = student.resumes.id(resumeId)
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume not found' })
    }

    // Remove resume from array
    student.resumes.pull(resumeId)
    await student.save()

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    })
  } catch (error) {
    console.error('Delete resume error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Onboarding submission route - simplified
router.post('/onboarding', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      resumeUploaded,
      resumeLink,
      atsScore
    } = req.body

    // Update student with minimal onboarding data
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      {
        onboardingCompleted: true,
        profile: {
          personal: {
            linkedin: '',
            github: '',
            portfolio: ''
          },
          education: {
            highestQualification: '',
            university: '',
            graduationYear: '',
            relevantCoursework: []
          },
          skills: {
            technical: [],
            soft: [],
            languages: []
          },
          experience: [],
          preferences: {
            desiredRoles: [],
            industries: [],
            locations: [],
            salaryRange: '',
            jobType: '',
            remotePreference: ''
          }
        }
      },
      { new: true }
    )

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      student: {
        id: student._id,
        onboardingCompleted: student.onboardingCompleted
      }
    })

  } catch (error) {
    console.error('Onboarding submission error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ATS score submission route
router.post('/ats-score', authenticateToken, async (req, res) => {
  try {
    const { 
      resumeId, 
      role, 
      overall, 
      breakdown, 
      matched, 
      missing 
    } = req.body

    const student = await Student.findById(req.user.id)
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    // Add ATS score using the model method
    await student.addAtsScore({
      resumeId: resumeId,
      role,
      overall,
      breakdown,
      matched,
      missing
    })

    res.json({
      success: true,
      message: 'ATS score saved successfully'
    })

  } catch (error) {
    console.error('ATS score save error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ATS analysis route
router.post('/ats-analyze', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No resume file provided' })
    }

    // Simulate ATS analysis with realistic data
    const analysis = {
      score: Math.floor(Math.random() * 40) + 60, // Score between 60-100
      mistakes: [
        'Missing quantifiable achievements (e.g., "increased sales by 25%")',
        'Generic action verbs (use "implemented" instead of "did")',
        'Missing relevant keywords for target role',
        'Inconsistent formatting and spacing',
        'Too much text in single bullet points'
      ],
      suggestions: [
        'Add specific metrics and numbers to achievements',
        'Use industry-specific keywords from job descriptions',
        'Keep bullet points concise (1-2 lines max)',
        'Use strong action verbs at the beginning of each point',
        'Ensure consistent formatting throughout the document'
      ],
      keywords: [
        'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express',
        'Git', 'REST API', 'TypeScript', 'HTML', 'CSS',
        'Problem Solving', 'Team Collaboration', 'Agile'
      ],
      overall: 'Good with room for improvement'
    }

    // Adjust score based on file quality
    if (req.file.size > 500000) { // If file is large
      analysis.score = Math.max(analysis.score - 10, 50)
      analysis.mistakes.push('File size is too large - consider optimizing')
    }

    if (req.file.mimetype === 'application/pdf') {
      analysis.score = Math.min(analysis.score + 5, 100)
      analysis.suggestions.push('Great choice using PDF format!')
    }

    res.json({
      success: true,
      analysis
    })

  } catch (error) {
    console.error('ATS analysis error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get student profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select('-password')
      .populate('resumes')
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }
    
    res.json({ success: true, student })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { profile } = req.body
    
    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { profile },
      { new: true }
    ).select('-password')

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      student
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get ATS scores history
router.get('/ats-scores', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('atsScores')
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' })
    }

    res.json({
      success: true,
      atsScores: student.atsScores
    })
  } catch (error) {
    console.error('Get ATS scores error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
