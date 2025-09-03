import express from 'express'
const router = express.Router()

// Import MongoDB models
import Company from '../models/Company.js'
import CompanyRequest from '../models/CompanyRequest.js'
import authModule from '../middleware/auth.js'
const { protect, authorize } = authModule

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
router.get('/:id', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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

router.post('/requests', protect, authorize('placement_officer', 'admin'), async (req, res) => {
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

export default router
 
