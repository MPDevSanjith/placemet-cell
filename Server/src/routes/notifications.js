import express from 'express'
import Notification from '../models/Notification.js'
import Student from '../models/Student.js'
import NotificationDelivery from '../models/NotificationDelivery.js'
import { sendEmail, isEmailConfigured } from '../email/email.js'
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
    const { title, message, links, attachments, target, sendEmail: sendEmailFlag } = req.body || {}
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

    // Create delivery records per student (ignore duplicates)
    const deliveries = recipients.map(r => ({ notification: notification._id, student: r._id }))
    try {
      await NotificationDelivery.insertMany(deliveries, { ordered: false })
    } catch (e) {
      // ignore bulk dup errors
    }

    // Optionally send emails
    if (sendEmailFlag && recipients.length) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      const subject = `[Placement] ${title}`
      const html = `<!DOCTYPE html><html><body>
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:16px;border:1px solid #eee;border-radius:8px">
          <h2 style="margin:0 0 12px 0;color:#111">${title}</h2>
          <p style="white-space:pre-wrap;color:#333;line-height:1.5">${message}</p>
          <p style="margin-top:16px"><a href="${frontendUrl}/student/notifications">View in portal</a></p>
        </div>
      </body></html>`
      const batches = recipients.map(r => ({
        to: r.email,
        subject,
        html,
        from: process.env.EMAIL_USER
      }))
      Promise.allSettled(batches.map(opts => sendEmail(opts))).catch(() => {})
    }

    return res.json({ success: true, message: 'Notification created', id: notification._id, recipientCount: recipients.length, emailEnqueued: Boolean(sendEmailFlag && isEmailConfigured()) })
  } catch (error) {
    console.error('Create notification error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// List notifications (with optional filters)
router.get('/', authenticateToken, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const items = await Notification.find({}).sort({ createdAt: -1 }).limit(200)
    return res.json({ success: true, items })
  } catch (error) {
    console.error('List notifications error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Update a notification (title, message, links, attachments, target not editable post-send)
router.put('/:id', authenticateToken, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { title, message, links, attachments } = req.body || {}
    const notification = await Notification.findById(id)
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' })
    if (title !== undefined) notification.title = title
    if (message !== undefined) notification.message = message
    if (Array.isArray(links)) notification.links = links
    if (Array.isArray(attachments)) notification.attachments = attachments
    await notification.save()
    return res.json({ success: true, message: 'Updated', notification })
  } catch (error) {
    console.error('Update notification error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Delete a notification and its deliveries
router.delete('/:id', authenticateToken, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params
    const notification = await Notification.findById(id)
    if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' })
    await NotificationDelivery.deleteMany({ notification: id })
    await Notification.deleteOne({ _id: id })
    return res.json({ success: true, message: 'Deleted' })
  } catch (error) {
    console.error('Delete notification error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Student: list my notifications (targeted to the authenticated student)
router.get('/my', authenticateToken, authorize('student', 'placement_officer', 'admin'), async (req, res) => {
  try {
    const studentId = req.user.id
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const deliveries = await NotificationDelivery.find({
      student: studentId,
      $or: [
        { status: 'delivered' },
        { status: 'read', readAt: { $gte: oneDayAgo } }
      ]
    }).sort({ deliveredAt: -1 }).limit(100).lean()

    const notificationIds = deliveries.map(d => d.notification)
    const notifications = await Notification.find({ _id: { $in: notificationIds } }).lean()
    const notificationById = new Map(notifications.map(n => [String(n._id), n]))

    const items = deliveries
      .map(d => {
        const n = notificationById.get(String(d.notification))
        if (!n) return null
        return {
          _id: n._id,
          title: n.title,
          message: n.message,
          links: n.links || [],
          attachments: n.attachments || [],
          createdAt: n.createdAt,
          read: d.status === 'read',
          readAt: d.readAt || null,
        }
      })
      .filter(Boolean)

    return res.json({ success: true, items })
  } catch (error) {
    console.error('List my notifications error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Student: unread count (deliveries not yet read)
router.get('/my/unread-count', authenticateToken, authorize('student', 'placement_officer', 'admin'), async (req, res) => {
  try {
    const studentId = req.user.id
    const count = await NotificationDelivery.countDocuments({ student: studentId, status: 'delivered' })
    return res.json({ success: true, unread: count })
  } catch (error) {
    console.error('My notifications count error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Student: mark notifications as read
router.post('/my/mark-read', authenticateToken, authorize('student', 'placement_officer', 'admin'), async (req, res) => {
  try {
    const studentId = req.user.id
    const { ids } = req.body || {}
    const notificationIds = Array.isArray(ids) ? ids : []
    if (!notificationIds.length) return res.json({ success: true, updated: 0 })
    const result = await NotificationDelivery.updateMany(
      { student: studentId, notification: { $in: notificationIds } },
      { $set: { status: 'read', readAt: new Date() } }
    )
    return res.json({ success: true, updated: result.modifiedCount || 0 })
  } catch (error) {
    console.error('Mark notifications read error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Fetch distinct filter options from students
router.get('/filters', authenticateToken, authorize('placement_officer', 'admin'), async (_req, res) => {
  try {
    const [years, departments, sections, specializations] = await Promise.all([
      Student.distinct('year', { isActive: true }),
      Student.distinct('branch', { isActive: true }),
      Student.distinct('section', { isActive: true }),
      Student.distinct('onboardingData.academicInfo.specialization', { isActive: true })
    ])
    return res.json({ success: true, filters: {
      years: (years || []).filter(Boolean).map(String).sort(),
      departments: (departments || []).filter(Boolean).map(String).sort(),
      sections: (sections || []).filter(Boolean).map(String).sort(),
      specializations: (specializations || []).filter(Boolean).map(String).sort()
    }})
  } catch (error) {
    console.error('Filters fetching error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Preview recipient count for a targeting config
router.post('/preview', authenticateToken, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { target } = req.body || {}
    const query = buildTargetQuery(target)
    const count = await Student.countDocuments(query)
    return res.json({ success: true, recipientCount: count })
  } catch (error) {
    console.error('Preview recipients error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

export default router


