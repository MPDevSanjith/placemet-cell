import express from 'express'
import Notification from '../models/Notification.js'
import Student from '../models/Student.js'
import { authenticateToken, authorize } from '../middleware/auth.js'

const router = express.Router()

// Build student query from targeting
function buildTargetQuery(target) {
  if (!target || target.all) return { isActive: true }
  const query = { isActive: true }
  if (Array.isArray(target.years) && target.years.length) query.year = { $in: target.years }
  if (Array.isArray(target.departments) && target.departments.length) query.branch = { $in: target.departments }
  if (Array.isArray(target.sections) && target.sections.length) query.section = { $in: target.sections }
  if (Array.isArray(target.specializations) && target.specializations.length) query['onboardingData.academicInfo.specialization'] = { $in: target.specializations }
  return query
}

// Create notification and deliver
router.post('/', authenticateToken, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { title, message, links, attachments, target } = req.body || {}
    if (!title || !message) return res.status(400).json({ success: false, error: 'Title and message are required' })

    const query = buildTargetQuery(target)
    const recipients = await Student.find(query).select('_id email name')

    const notification = new Notification({
      title,
      message,
      links: Array.isArray(links) ? links : [],
      attachments: Array.isArray(attachments) ? attachments : [],
      target: target && typeof target === 'object' ? target : { all: true },
      recipientCount: recipients.length,
      deliveredTo: recipients.map(r => r._id),
      createdBy: req.user.id
    })
    await notification.save()

    // TODO: integrate real delivery channels (email/push/websocket). For now, just acknowledge.

    return res.json({ success: true, message: 'Notification created', id: notification._id, recipientCount: recipients.length })
  } catch (error) {
    console.error('Create notification error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// List notifications (with optional filters)
router.get('/', authenticateToken, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const items = await Notification.find({}).sort({ createdAt: -1 }).limit(100)
    return res.json({ success: true, items })
  } catch (error) {
    console.error('List notifications error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router


