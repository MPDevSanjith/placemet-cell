import mongoose from 'mongoose'

const notificationDeliverySchema = new mongoose.Schema({
  notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['delivered', 'read'], default: 'delivered' },
  deliveredAt: { type: Date, default: Date.now },
  readAt: { type: Date },
})

notificationDeliverySchema.index({ student: 1, notification: 1 }, { unique: true })

const NotificationDelivery = mongoose.model('NotificationDelivery', notificationDeliverySchema)
export default NotificationDelivery


