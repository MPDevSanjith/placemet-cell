const express = require('express')
const router = express.Router()

// Import MongoDB models
const PlacementDrive = require('../models/PlacementDrive')
const Company = require('../models/Company')

// Get drives list
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', company = '' } = req.query
    const skip = (page - 1) * limit

    let query = {}

    if (status) {
      query.status = status
    }

    if (company) {
      // Find companies that match the search term
      const companies = await Company.find({
        name: { $regex: company, $options: 'i' }
      }).select('_id')
      
      query.company = { $in: companies.map(c => c._id) }
    }

    const drives = await PlacementDrive.find(query)
      .populate('company', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await PlacementDrive.countDocuments(query)

    res.json({
      drives,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching drives:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new drive
router.post('/', async (req, res) => {
  try {
    const {
      companyId,
      title,
      position,
      description,
      requirements,
      packageMin,
      packageMax,
      location,
      deadline,
      eligibilityCriteria
    } = req.body

    if (!companyId || !title || !position || !deadline) {
      return res.status(400).json({ error: 'Company ID, title, position, and deadline are required' })
    }

    // Check if company exists
    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(400).json({ error: 'Company not found' })
    }

    // Create drive
    const drive = new PlacementDrive({
      company: companyId,
      title,
      position,
      description,
      requirements,
      packageMin,
      packageMax,
      location,
      deadline,
      eligibilityCriteria,
      createdBy: req.user?.id || 'system' // Would come from JWT in real app
    })

    await drive.save()

    res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      drive
    })

  } catch (error) {
    console.error('Error creating drive:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get drive details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const drive = await PlacementDrive.findById(id)
      .populate('company', 'name email phone website')

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' })
    }

    res.json({
      success: true,
      drive
    })

  } catch (error) {
    console.error('Error fetching drive details:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update drive
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const drive = await PlacementDrive.findById(id)

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' })
    }

    // Validate required fields
    if (!updateData.title || !updateData.position || !updateData.deadline) {
      return res.status(400).json({ error: 'Title, position, and deadline are required' })
    }

    Object.assign(drive, updateData)
    await drive.save()

    res.json({
      success: true,
      message: 'Drive updated successfully',
      drive
    })

  } catch (error) {
    console.error('Error updating drive:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete drive
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const drive = await PlacementDrive.findById(id)

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' })
    }

    // Check if drive has applications
    const Application = require('../models/Application')
    const applicationCount = await Application.countDocuments({ drive: id })

    if (applicationCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete drive with existing applications. Change status to closed instead.' 
      })
    }

    await PlacementDrive.findByIdAndDelete(id)

    res.json({
      success: true,
      message: 'Drive deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting drive:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
