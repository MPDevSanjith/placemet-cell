import express from 'express'
const router = express.Router()

// Import MongoDB models
import Company from '../models/Company.js'
import CompanyRequest from '../models/CompanyRequest.js'
import CompanyFormLink from '../models/CompanyFormLink.js'
import Job from '../models/Job.js'
import { protect, authorize } from '../middleware/auth.js'

// Get companies list
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
    const { companyName, jobRole, description, studentsRequired, minimumCGPA, startDate, endDate } = req.body

    if (!companyName || !jobRole) {
      return res.status(400).json({ 
        success: false, 
        error: 'Company name and job role are required' 
      })
    }

    // Generate unique link ID
    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const jobSlug = jobRole.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const linkId = `${companySlug}-${jobSlug}-${Date.now()}`

    // Create form link
    const formLink = new CompanyFormLink({
      linkId,
      companyName,
      jobRole,
      description,
      studentsRequired: Number(studentsRequired) || 1,
      minimumCGPA: Number(minimumCGPA) || 0,
      startDate,
      endDate,
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
        jobRole,
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
        companyName: formLink.companyName,
        jobRole: formLink.jobRole,
        description: formLink.description,
        studentsRequired: formLink.studentsRequired,
        minimumCGPA: formLink.minimumCGPA,
        startDate: formLink.startDate,
        endDate: formLink.endDate
      }
    })

  } catch (error) {
    console.error('Error fetching form link:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Public endpoint for company form submissions
router.post('/requests/submit', async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      jobTitle,
      jobDescription,
      requirements,
      location,
      jobType,
      salaryRange,
      studentsRequired,
      minimumCGPA,
      startDate,
      endDate,
      additionalInfo,
      linkId
    } = req.body

    // Validate required fields
    if (!companyName || !contactPerson || !email || !phone || !jobTitle || !jobDescription || !location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: companyName, contactPerson, email, phone, jobTitle, jobDescription, location' 
      })
    }

    // Verify the form link exists
    const formLink = await CompanyFormLink.findOne({ linkId, isActive: true })
    if (!formLink) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid or expired form link' 
      })
    }

    // Create company request from form submission
    const request = new CompanyRequest({
      company: companyName,
      jobRole: jobTitle,
      description: jobDescription,
      studentsRequired: Number(studentsRequired) || 1,
      minimumCGPA: Number(minimumCGPA) || 0,
      startDate,
      endDate,
      formLinkId: linkId,
      formData: {
        contactPerson,
        email,
        phone,
        requirements,
        location,
        jobType,
        salaryRange,
        additionalInfo,
        linkId,
        submittedAt: new Date().toISOString()
      }
    })

    await request.save()

    // Add submission to form link
    formLink.submissions.push(request._id)
    await formLink.save()

    res.status(201).json({ 
      success: true, 
      message: 'Company request submitted successfully',
      requestId: request._id,
      linkId
    })

  } catch (error) {
    console.error('Error submitting company form:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
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
      location: request.formData?.location || 'Not specified',
      jobType: request.formData?.jobType || 'Full-time',
      ctc: request.formData?.salaryRange || 'Not specified',
      deadline: request.endDate || null,
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
 
