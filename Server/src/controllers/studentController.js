const User = require('../models/User');
const { createPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin, Faculty)
const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const branch = req.query.branch;
    const year = req.query.year;
    const search = req.query.search;

    // Build query
    let query = { role: 'student' };
    
    if (branch) {
      query['studentDetails.branch'] = branch;
    }
    
    if (year) {
      query['studentDetails.year'] = parseInt(year);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentDetails.rollNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const students = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ 'studentDetails.rollNumber': 1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: createPaginationResponse(students, total, page, limit)
    });

  } catch (error) {
    logger.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
};

// @desc    Get student profile
// @route   GET /api/students/:id
// @access  Private
const getStudent = async (req, res) => {
  try {
    const student = await User.findOne({ 
      _id: req.params.id, 
      role: 'student' 
    }).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student profile'
      });
    }

    res.json({
      success: true,
      data: { student }
    });

  } catch (error) {
    logger.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student'
    });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this student profile'
      });
    }

    const student = await User.findOne({ 
      _id: req.params.id, 
      role: 'student' 
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update basic fields
    const { name, phone, profilePicture } = req.body;
    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (profilePicture) student.profilePicture = profilePicture;

    // Update student details
    const { studentDetails } = req.body;
    if (studentDetails) {
      Object.keys(studentDetails).forEach(key => {
        if (studentDetails[key] !== undefined) {
          student.studentDetails[key] = studentDetails[key];
        }
      });
    }

    await student.save();

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: { student }
    });

  } catch (error) {
    logger.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating student profile'
    });
  }
};

// @desc    Get student statistics
// @route   GET /api/students/stats/overview
// @access  Private (Admin, Faculty)
const getStudentStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$studentDetails.branch',
          count: { $sum: 1 },
          avgCGPA: { $avg: '$studentDetails.cgpa' },
          totalBacklogs: { $sum: '$studentDetails.backlogCount' }
        }
      }
    ]);

    const yearStats = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$studentDetails.year',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const verifiedStudents = await User.countDocuments({ role: 'student', isEmailVerified: true });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        verifiedStudents,
        branchStats: stats,
        yearStats
      }
    });

  } catch (error) {
    logger.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student statistics'
    });
  }
};

module.exports = {
  getStudents,
  getStudent,
  updateStudent,
  getStudentStats
};
