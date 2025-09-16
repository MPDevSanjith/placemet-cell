import express from 'express'
const router = express.Router()
import multer from 'multer'
import cloudinaryService from '../utils/cloudinaryService.js'

// Import MongoDB models
import Company from '../models/Company.js'
import CompanyRequest from '../models/CompanyRequest.js'
import CompanyFormLink from '../models/CompanyFormLink.js'
import Job from '../models/Job.js'
import { protect, authorize } from '../middleware/auth.js'

// Get companies list
// Configure multer for JD uploads (5MB, PDF/DOC/DOCX)
const jdUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Only PDF, DOC, and DOCX files are allowed for JD'));
  }
})
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', industry = '' } = req.query
    const skip = (page - 1) * limit

    let query = {}

    if (status) {
      query.status = status
    }

    if (industry) {
      query.industry = { $regex: industry, $options: 'i' }
    }

    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Company.countDocuments(query)

    res.json({
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new company
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      website,
      address,
      description,
      industry,
      foundedYear,
      employeeCount,
      contactPerson
    } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Company name and email are required' })
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ email })
    if (existingCompany) {
      return res.status(400).json({ error: 'Company with this email already exists' })
    }

    const company = new Company({
      name,
      email,
      phone,
      website,
      address,
      description,
      industry,
      foundedYear,
      employeeCount,
      contactPerson
    })

    await company.save()

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company
    })

  } catch (error) {
    console.error('Error creating company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get company details
// Use ObjectId regex to avoid conflicting with '/requests'
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const { id } = req.params

    const company = await Company.findById(id)

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json({
      success: true,
      company
    })

  } catch (error) {
    console.error('Error fetching company details:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update company
router.put('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const company = await Company.findById(id)

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    // Check if email is being updated and if it's already taken
    if (updateData.email && updateData.email !== company.email) {
      const existingCompany = await Company.findOne({ email: updateData.email })
      if (existingCompany) {
        return res.status(400).json({ error: 'Company with this email already exists' })
      }
    }

    Object.assign(company, updateData)
    await company.save()

    res.json({
      success: true,
      message: 'Company updated successfully',
      company
    })

  } catch (error) {
    console.error('Error updating company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete company
router.delete('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    const { id } = req.params

    const company = await Company.findById(id)

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    await Company.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'Company deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting company:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Company Requests CRUD (used by NewJobPost UI)
router.get('/requests', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const items = await CompanyRequest.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
    const total = await CompanyRequest.countDocuments()

    res.json({
      success: true,
      data: items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching company requests:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get single company request (full details)
router.get('/requests/:id', async (req, res) => {
  try {
    const found = await CompanyRequest.findById(req.params.id)
    if (!found) return res.status(404).json({ success: false, error: 'Request not found' })
    return res.json({ success: true, data: found })
  } catch (error) {
    console.error('Error fetching company request:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.post('/requests', async (req, res) => {
  try {
    const { company, jobRole, description, studentsRequired, minimumCGPA, startDate, endDate } = req.body
    if (!company || !jobRole || !description) {
      return res.status(400).json({ success: false, error: 'company, jobRole, description are required' })
    }

    const request = new CompanyRequest({
      company,
      jobRole,
      description,
      studentsRequired: Number(studentsRequired) || 1,
      minimumCGPA: Number(minimumCGPA) || 0,
      startDate,
      endDate,
      createdBy: req.user.id
    })
    await request.save()
    res.status(201).json({ success: true, data: request })
  } catch (error) {
    console.error('Error creating company request:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.put('/requests/:id', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const updated = await CompanyRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ success: false, error: 'Request not found' })
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating company request:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

router.delete('/requests/:id', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const found = await CompanyRequest.findById(req.params.id)
    if (!found) return res.status(404).json({ success: false, error: 'Request not found' })
    await CompanyRequest.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Request deleted' })
  } catch (error) {
    console.error('Error deleting company request:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Create form link (placement officer only)
router.post('/form-links', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { companyName } = req.body

    if (!companyName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Company name is required' 
      })
    }

    // Generate unique link ID from company only
    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const linkId = `${companySlug}-${Date.now()}`

    // Create form link (store only company name; other meta removed)
    const formLink = new CompanyFormLink({
      linkId,
      companyName,
      createdBy: req.user.id
    })

    await formLink.save()

    // Use frontend URL from environment or fallback to request host
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`
    const fullLink = `${frontendUrl}/company-form/${linkId}`

    res.status(201).json({ 
      success: true, 
      message: 'Form link created successfully',
      data: {
        linkId,
        companyName,
        link: fullLink,
        createdAt: formLink.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating form link:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get all form links (placement officer only)
router.get('/form-links', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const formLinks = await CompanyFormLink.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')

    const total = await CompanyFormLink.countDocuments({ isActive: true })

    // Add full link URL to each form link
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`
    const formLinksWithLinks = formLinks.map(link => ({
      ...link.toObject(),
      link: `${frontendUrl}/company-form/${link.linkId}`
    }))

    res.json({
      success: true,
      data: formLinksWithLinks,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    })

  } catch (error) {
    console.error('Error fetching form links:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Get form link details by linkId (public)
router.get('/form-links/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params

    const formLink = await CompanyFormLink.findOne({ linkId, isActive: true })
      .populate('createdBy', 'name email')

    if (!formLink) {
      return res.status(404).json({ 
        success: false, 
        error: 'Form link not found or expired' 
      })
    }

    res.json({
      success: true,
      data: {
        companyName: formLink.companyName
      }
    })

  } catch (error) {
    console.error('Error fetching form link:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Public endpoint for company form submissions
router.post('/requests/submit', jdUpload.single('jdFile'), async (req, res) => {
  try {
    const body = req.body || {}
    const {
      linkId,
      // Company Information
      companyName,
      companyWebsite,
      hqLocation,
      otherLocations,
      industryDomain,
      companySize,
      companyDescription,
      transportFacility,
      // Job/Placement Details
      jobTitle,
      jobResponsibilities,
      minCTC,
      maxCTC,
      salaryStructure,
      jobLocation,
      bondDetails,
      vacancies,
      interviewMode,
      expectedJoiningDate,
      employmentType,
      // HR Details
      hrName,
      hrDesignation,
      hrEmail,
      hrPhone,
      hrLinkedIn,
      alternateContact,
      // Additional Information
      socialHandles,
      jobDescriptionLink,
      studentInstructions,
      questionsForStudents,
      jdDescription,
      minimumCGPA
    } = body

    if (!companyName || !hrName || !hrEmail || !hrPhone || !jobTitle || !jobResponsibilities) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: companyName, hrName, hrEmail, hrPhone, jobTitle, jobResponsibilities'
      })
    }

    // Verify the form link exists
    const formLink = await CompanyFormLink.findOne({ linkId, isActive: true })
    if (!formLink) {
      return res.status(404).json({ success: false, error: 'Invalid or expired form link' })
    }

    // Optional JD upload
    let jdFileInfo = null
    if (req.file) {
      jdFileInfo = await cloudinaryService.uploadCompanyJD(req.file, companyName)
    }

    const request = new CompanyRequest({
      company: companyName,
      jobRole: jobTitle,
      description: jobResponsibilities,
      studentsRequired: Number(vacancies) || 1,
      minimumCGPA: Number(minimumCGPA) || 0,
      startDate: '',
      endDate: '',
      formLinkId: linkId,
      formData: {
        companyWebsite,
        hqLocation,
        otherLocations,
        industryDomain,
        companySize,
        companyDescription,
        transportFacility,
        minCTC,
        maxCTC,
        salaryStructure,
        jobLocation,
        bondDetails,
        vacancies,
        interviewMode,
        expectedJoiningDate,
        employmentType,
        hrName,
        hrDesignation,
        hrEmail,
        hrPhone,
        hrLinkedIn,
        alternateContact,
        socialHandles,
        jobDescriptionLink,
        studentInstructions,
        questionsForStudents,
        jdDescription,
        jdFile: jdFileInfo,
        submittedAt: new Date().toISOString()
      }
    })

    await request.save()
    formLink.submissions.push(request._id)
    await formLink.save()

    res.status(201).json({ success: true, message: 'Company request submitted successfully', requestId: request._id, linkId })
  } catch (error) {
    console.error('Error submitting company form:', error)
    res.status(500).json({ success: false, error: error.message || 'Internal server error' })
  }
})

// Approve company request (creates job posting)
router.put('/requests/:id/approve', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const request = await CompanyRequest.findById(req.params.id)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' })
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Request has already been processed' })
    }

    // Update request status
    request.status = 'Approved'
    await request.save()

    // Create job posting from the approved request
    const jobData = {
      company: request.company,
      title: request.jobRole,
      description: request.description || 'Job opportunity from ' + request.company,
      location: request.formData?.jobLocation || request.formData?.location || '',
      jobType: (() => {
        const e = (request.formData?.employmentType || request.formData?.jobType || '').toString()
        if (/internship/i.test(e)) return 'Internship'
        if (/part[- ]?time/i.test(e)) return 'Part-time'
        if (/contract/i.test(e)) return 'Contract'
        return 'Full-time'
      })(),
      ctc: (() => {
        const min = (request.formData?.minCTC || '').toString().trim()
        const max = (request.formData?.maxCTC || '').toString().trim()
        const struct = (request.formData?.salaryStructure || '').toString().trim()
        const range = (request.formData?.salaryRange || '').toString().trim()
        if (min && max) return `${min}-${max} LPA`
        if (min && !max) return `${min} LPA`
        if (!min && max) return `${max} LPA`
        return struct || range || ''
      })(),
      minCtc: (request.formData?.minCTC || '').toString().trim() || undefined,
      deadline: request.endDate || null,
      minCgpa: Number(request.minimumCGPA ?? request.formData?.minimumCGPA) || 0,
      studentsRequired: Number(request.formData?.vacancies || request.studentsRequired) || 1,
      jdUrl: (() => {
        try {
          const jd = request.formData?.jdFile
          if (!jd) return ''
          const fileId = jd.fileId || jd.public_id
          if (fileId) {
            try {
              return cloudinaryService.generateViewUrl(fileId, 'image', 'pdf')
            } catch {}
          }
          const candidate = jd.url || jd.fileUrl
          return candidate || ''
        } catch { return '' }
      })(),
      skills: (() => {
        const raw = request.formData?.requirements
        if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean)
        if (typeof raw === 'string' && raw.trim().length) {
          return raw.split(/[\,\n]/).map((s) => s.trim()).filter(Boolean)
        }
        return []
      })(),
      createdBy: req.user.id
    }

    const job = new Job(jobData)
    await job.save()

    res.json({ 
      success: true, 
      message: 'Company request approved and job posting created successfully',
      data: {
        request,
        job: {
          id: job._id,
          title: job.title,
          company: job.company
        }
      }
    })

  } catch (error) {
    console.error('Error approving company request:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Reject company request
router.put('/requests/:id/reject', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const request = await CompanyRequest.findById(req.params.id)
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' })
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Request has already been processed' })
    }

    // Update request status
    request.status = 'Rejected'
    await request.save()

    res.json({ 
      success: true, 
      message: 'Company request rejected',
      data: request
    })

  } catch (error) {
    console.error('Error rejecting company request:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router
 
