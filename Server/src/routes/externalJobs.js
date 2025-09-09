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
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import { sendEmail } from '../email/email.js';

const router = express.Router();

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

// Broadcast external job link to all students
router.post('/:id/send-email', authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const job = await (await import('../models/ExternalJob.js')).default.findById(id)
    if (!job) return res.status(404).json({ success: false, error: 'External job not found' })

    const students = await Student.find({}).select('email name')
    let sent = 0
    for (const s of students) {
      if (!s.email) continue
      await sendEmail({
        to: s.email,
        subject: `External Opportunity: ${job.jobTitle} at ${job.companyName}`,
        html: `<p>Dear ${s.name || 'Student'},</p>
<p>A new external job has been posted:</p>
<p><strong>${job.jobTitle}</strong> at <strong>${job.companyName}</strong></p>
<p>Location: ${job.location || '—'} | Type: ${job.jobType || '—'}</p>
<p>Apply here: <a href="${job.externalUrl}" target="_blank" rel="noopener">${job.externalUrl}</a></p>
<p>Good luck!</p>`
      })
      sent++
    }
    return res.json({ success: true, sent, total: students.length })
  } catch (e) {
    console.error('Send external job email error', e)
    return res.status(500).json({ success: false, error: 'Failed to send emails' })
  }
})

export default router;
