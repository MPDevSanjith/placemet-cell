import express from 'express';
import {
  createExternalJob,
  getAllExternalJobs,
  getExternalJobById,
  updateExternalJob,
  deleteExternalJob,
  updateJobStatus,
  getExternalJobsStats,
  bulkUpdateExpiredJobs
} from '../controllers/externalJobController.js';
import authModule from '../middleware/auth.js';
const { protect, authorize } = authModule;

// Public routes
router.get('/', getAllExternalJobs);
router.get('/:id', getExternalJobById);

// Protected routes (require authentication)
router.use(protect);

// Routes for Placement Officers and Admins
router.post('/', authorize('placement_officer', 'admin'), createExternalJob);
router.put('/:id', authorize('placement_officer', 'admin'), updateExternalJob);
router.delete('/:id', authorize('placement_officer', 'admin'), deleteExternalJob);
router.patch('/:id/status', authorize('placement_officer', 'admin'), updateJobStatus);

// Statistics and analytics routes
router.get('/stats/overview', authorize('placement_officer', 'admin'), getExternalJobsStats);

// Admin only routes
router.post('/bulk-update-expired', authorize('admin'), bulkUpdateExpiredJobs);

export default router;
