const express = require('express');
const { getJobs, getJob, createJob } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', getJobs);

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', getJob);

// Protected create
router.post('/', protect, authorize('placement_officer', 'admin'), createJob);

module.exports = router;
