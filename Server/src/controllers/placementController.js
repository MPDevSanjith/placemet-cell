const Placement = require('../models/Placement');
const { createPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Get placements
// @route   GET /api/placements
// @access  Private
const getPlacements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const academicYear = req.query.academicYear;
    const status = req.query.status;

    let query = {};
    
    // Filter by user role
    if (req.user.role === 'student') {
      query.student = req.user.id;
    } else if (req.user.role === 'company') {
      query.company = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all placements
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view placements'
      });
    }
    
    if (academicYear) {
      query.academicYear = academicYear;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const placements = await Placement.find(query)
      .populate('student', 'name email studentDetails')
      .populate('company', 'name companyDetails.companyName')
      .populate('job', 'title description')
      .skip(skip)
      .limit(limit)
      .sort({ placementDate: -1 });

    const total = await Placement.countDocuments(query);

    res.json({
      success: true,
      data: createPaginationResponse(placements, total, page, limit)
    });

  } catch (error) {
    logger.error('Get placements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching placements'
    });
  }
};

module.exports = {
  getPlacements
};
