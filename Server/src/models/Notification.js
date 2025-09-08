import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  links: [{ label: String, url: String }],
  attachments: [{ filename: String, url: String, mimeType: String, size: Number }],

  // Targeting metadata
  target: {
    all: { type: Boolean, default: false },
    years: [{ type: String }], // batch/year
    departments: [{ type: String }], // branch/department
    sections: [{ type: String }],
    specializations: [{ type: String }]
  },

  // Delivery info
  recipientCount: { type: Number, default: 0 },
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification


