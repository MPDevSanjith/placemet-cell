import express from 'express';
import { getJobs, getJob, createJob, updateJob } from '../controllers/jobController.js';
import { cacheSeconds } from '../middleware/cache.js'
import { protect, authorize } from '../middleware/auth.js';
import JobApplication from '../models/JobApplication.js'
import Resume from '../models/Resume.js'
import cloudinaryService from '../utils/cloudinaryService.js'
import Job from '../models/Job.js'
import { sendEmail } from '../email/email.js'

const router = express.Router();

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', cacheSeconds(10), getJobs);

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', cacheSeconds(15), getJob);

// Protected create
router.post('/', protect, authorize('placement_officer', 'admin'), createJob);

// Protected update
router.put('/:id', protect, authorize('placement_officer', 'admin'), updateJob);

// Student: apply to a job
router.post('/:id/apply', protect, authorize('student'), async (req, res) => {
  try {
    const jobId = req.params.id
    const studentId = req.user.id
    const { resumeId } = req.body || {}
    if (!resumeId) return res.status(400).json({ success: false, message: 'resumeId is required' })

    const resume = await Resume.findOne({ _id: resumeId, student: studentId })
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' })

    const app = await JobApplication.findOneAndUpdate(
      { student: studentId, job: jobId },
      { $setOnInsert: { resume: resumeId, status: 'applied' } },
      { upsert: true, new: true }
    )

    return res.json({ success: true, message: 'Applied successfully', data: { id: app._id } })
  } catch (e) {
    if (e && e.code === 11000) {
      return res.json({ success: true, message: 'Already applied' })
    }
    console.error('Apply error', e)
    return res.status(500).json({ success: false, message: 'Failed to apply' })
  }
})

// Student: list my applications
router.get('/applications/mine', protect, authorize('student'), async (req, res) => {
  try {
    const items = await JobApplication.find({ student: req.user.id })
      .populate('job')
      .populate('resume')
      .sort({ createdAt: -1 })

    const enriched = items.map((app) => {
      try {
        // @ts-ignore
        const r = app.resume && app.resume.toObject ? app.resume.toObject() : app.resume
        if (r && r.cloudinaryId) {
          const viewUrl = cloudinaryService.generateViewUrl(r.cloudinaryId, 'image', 'pdf')
          const signedViewUrl = cloudinaryService.generateSignedViewUrl(r.cloudinaryId, 'image', 'pdf')
          // @ts-ignore
          app = app.toObject ? app.toObject() : app
          app.resume = { ...(r || {}), viewUrl, signedViewUrl }
        }
      } catch {}
      return app
    })

    return res.json({ success: true, items: enriched })
  } catch (e) {
    console.error('List my applications error', e)
    return res.status(500).json({ success: false, message: 'Failed to load applications' })
  }
})

// Officer: list applications for a job
router.get('/:id/applications', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const jobId = req.params.id
    const items = await JobApplication.find({ job: jobId })
      .populate('student')
      .populate('resume')
      .sort({ createdAt: -1 })

    // Enrich resume with a view URL for inline viewing
    const enriched = items.map((app) => {
      try {
        // @ts-ignore
        const r = app.resume && app.resume.toObject ? app.resume.toObject() : app.resume
        if (r && r.cloudinaryId) {
          const viewUrl = cloudinaryService.generateViewUrl(r.cloudinaryId, 'image', 'pdf')
          const signedViewUrl = cloudinaryService.generateSignedViewUrl(r.cloudinaryId, 'image', 'pdf')
          // attach fields for frontend convenience
          // @ts-ignore
          app = app.toObject ? app.toObject() : app
          app.resume = { ...(r || {}), viewUrl, signedViewUrl }
        }
      } catch {}
      return app
    })

    return res.json({ success: true, items: enriched })
  } catch (e) {
    console.error('List job applications error', e)
    return res.status(500).json({ success: false, message: 'Failed to load applications' })
  }
})

// Officer: email all applications to company's contact email
router.post('/:id/applications/send-email', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const jobId = req.params.id
    const job = await Job.findById(jobId).lean()
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' })
    const requestedTo = (req.body && req.body.to) ? String(req.body.to).trim() : ''
    const to = requestedTo || job.contactEmail || job.company || ''
    if (!to || !/@/.test(String(to))) return res.status(400).json({ success: false, error: 'Contact email not set for this job' })

    const apps = await JobApplication.find({ job: jobId }).populate('student').populate('resume').sort({ createdAt: -1 })
    // Derive absolute base URL for email links (handles proxies and non-local devices)
    const envPublicBase = (process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || process.env.SERVER_PUBLIC_URL || '').trim()
    let baseUrl = ''
    if (envPublicBase) {
      baseUrl = /^https?:\/\//i.test(envPublicBase) ? envPublicBase : `https://${envPublicBase}`
      baseUrl = baseUrl.replace(/\/$/, '')
    } else {
      const forwardedProto = req.headers['x-forwarded-proto']
      const forwardedHost = req.headers['x-forwarded-host'] || req.headers['x-forwarded-server']
      const hostHeader = (typeof forwardedHost === 'string' && forwardedHost) ? forwardedHost : (req.headers['host'] || req.get('host'))
      const host = Array.isArray(hostHeader) ? hostHeader[0] : (typeof hostHeader === 'string' ? hostHeader.split(',')[0].trim() : '')
      const protocol = (typeof forwardedProto === 'string' && forwardedProto) ? forwardedProto.split(',')[0] : req.protocol
      baseUrl = `${protocol}://${host}`
      baseUrl = baseUrl.replace(/\/$/, '')
    }

    const rows = apps.map((a) => {
      const s = a.student || {}
      const r = a.resume || {}
      const generatedView = r.cloudinaryId ? cloudinaryService.generateViewUrl(r.cloudinaryId, 'image', 'pdf') : ''
      const generatedSigned = r.cloudinaryId ? cloudinaryService.generateSignedViewUrl(r.cloudinaryId, 'image', 'pdf') : ''
      const candidate = r.signedViewUrl || r.viewUrl || r.cloudinaryUrl || generatedSigned || generatedView || ''
      const absoluteResumeUrl = candidate
        ? (String(candidate).startsWith('http') ? String(candidate) : `${baseUrl}${candidate}`)
        : ''
      return {
        name: s.name || '',
        email: s.email || '',
        phone: s.phone || '',
        branch: s.branch || '',
        year: s.year || '',
        cgpa: s.onboardingData?.academicInfo?.gpa || s.gpa || '',
        resume: absoluteResumeUrl
      }
    })

    const table = `
      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
        <thead>
          <tr style="background:#f3f4f6">
            <th align="left">Name</th><th align="left">Email</th><th align="left">Phone</th><th align="left">Branch</th><th align="left">Year</th><th align="left">CGPA</th><th align="left">Resume</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>
            <td>${r.name}</td><td>${r.email}</td><td>${r.phone}</td><td>${r.branch}</td><td>${r.year}</td><td>${r.cgpa}</td><td>${r.resume ? `<a href="${r.resume}">View</a>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `

    const html = `
      <p>Dear ${job.company || 'Hiring Team'},</p>
      <p>Please find below the list of student applicants for the position <strong>${job.title}</strong>.</p>
      ${table}
      <p>Regards,<br/>Placement Office</p>
    `

    const result = await sendEmail({ to, subject: `Applicants for ${job.title}`, html })
    if (result?.success === false) return res.status(500).json({ success: false, error: result?.error || 'Failed to send email' })
    return res.json({ success: true, sent: rows.length })
  } catch (e) {
    console.error('Email applications error', e)
    return res.status(500).json({ success: false, error: 'Failed to send applications email' })
  }
})

export default router;
