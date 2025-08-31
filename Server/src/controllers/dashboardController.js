const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Placement = require('../models/Placement');
const logger = require('../utils/logger');

// @desc    Get user dashboard
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    let dashboardData = {};

    if (req.user.role === 'student') {
      // Student dashboard
      const applications = await Application.find({ student: req.user.id });
      const placements = await Placement.find({ student: req.user.id });
      
      const applicationStats = await Application.aggregate([
        { $match: { student: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      dashboardData = {
        totalApplications: applications.length,
        totalPlacements: placements.length,
        applicationStats,
        recentApplications: await Application.find({ student: req.user.id })
          .populate('job', 'title company')
          .populate('company', 'name companyDetails.companyName')
          .sort({ appliedDate: -1 })
          .limit(5)
      };

    } else if (req.user.role === 'company') {
      // Company dashboard
      const jobs = await Job.find({ company: req.user.id });
      const applications = await Application.find({ company: req.user.id });
      const placements = await Placement.find({ company: req.user.id });

      const jobStats = await Job.aggregate([
        { $match: { company: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      dashboardData = {
        totalJobs: jobs.length,
        totalApplications: applications.length,
        totalPlacements: placements.length,
        jobStats,
        recentApplications: await Application.find({ company: req.user.id })
          .populate('student', 'name email studentDetails')
          .populate('job', 'title')
          .sort({ appliedDate: -1 })
          .limit(5)
      };

    } else if (req.user.role === 'admin') {
      // Admin dashboard (redirect to admin routes)
      return res.redirect('/api/admin/dashboard');
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

module.exports = {
  getDashboard
};
