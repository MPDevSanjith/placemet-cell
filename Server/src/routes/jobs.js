const express = require('express');
const {
  getJobs,
  getJob
} = require('../controllers/jobController');

const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', getJobs);

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', getJob);

module.exports = router;
