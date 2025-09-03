import express from 'express';
import { getJobs, getJob, createJob } from '../controllers/jobController.js';
import authModule from '../middleware/auth.js';
const { protect, authorize } = authModule;

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

export default router;
