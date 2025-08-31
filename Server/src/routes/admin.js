const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard
} = require('../controllers/adminController');

const router = express.Router();

// All routes require admin access
router.use(protect, authorize('admin'));

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', getDashboard);

module.exports = router;
