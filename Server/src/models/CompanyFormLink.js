import mongoose from 'mongoose'

const companyFormLinkSchema = new mongoose.Schema({
  linkId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  jobRole: { type: String, required: false },
  description: { type: String },
  studentsRequired: { type: Number, default: 1 },
  minimumCGPA: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CompanyRequest' }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // Optional expiration date
}, { timestamps: true })

export default mongoose.model('CompanyFormLink', companyFormLinkSchema)
