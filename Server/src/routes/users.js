const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), getUsers);

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, getUser);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid phone number')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
}, updateUser);

// @desc    Update user role (Admin only)
// @route   PATCH /api/users/:id/role
// @access  Private (Admin only)
router.patch('/:id/role', protect, authorize('admin'), [
  body('role').isIn(['student', 'admin', 'company', 'faculty']).withMessage('Invalid role')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
}, updateUserRole);

// @desc    Toggle user active status (Admin only)
// @route   PATCH /api/users/:id/status
// @access  Private (Admin only)
router.patch('/:id/status', protect, authorize('admin'), toggleUserStatus);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteUser);

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Admin only)
router.get('/stats/overview', protect, authorize('admin'), getUserStats);

module.exports = router;
