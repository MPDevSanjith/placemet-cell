const Application = require('../models/Application');
const { createPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Get applications by user
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let query = {};
    
    // Filter by user role
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'company') {
      query.company = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all applications
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications'
      });
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const applications = await Application.find(query)
      .populate('job', 'title description location salary')
      .populate('student', 'name email studentDetails')
      .populate('company', 'name companyDetails.companyName')
      .skip(skip)
      .limit(limit)
      .sort({ appliedDate: -1 });

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: createPaginationResponse(applications, total, page, limit)
    });

  } catch (error) {
    logger.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
};

module.exports = {
  getApplications
};
