const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getPlacements
} = require('../controllers/placementController');

const router = express.Router();

// @desc    Get placements
// @route   GET /api/placements
// @access  Private
router.get('/', protect, getPlacements);

module.exports = router;
