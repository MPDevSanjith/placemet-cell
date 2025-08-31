const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Placement = require('../models/Placement');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboard = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCompanies = await User.countDocuments({ role: 'company' });
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const totalPlacements = await Placement.countDocuments();

    // Get recent activities
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentJobs = await Job.find()
      .populate('company', 'name companyDetails.companyName')
      .select('title company createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentApplications = await Application.find()
      .populate('student', 'name email')
      .populate('job', 'title')
      .select('student job status appliedDate')
      .sort({ appliedDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalStudents,
          totalCompanies,
          totalJobs,
          totalApplications,
          totalPlacements
        },
        recentActivities: {
          users: recentUsers,
          jobs: recentJobs,
          applications: recentApplications
        }
      }
    });

  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

module.exports = {
  getDashboard
};
