const express = require('express')
const router = express.Router()

// Import MongoDB models
const Company = require('../models/Company')

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

module.exports = router
