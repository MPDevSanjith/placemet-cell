import mongoose from 'mongoose'

const companyRequestSchema = new mongoose.Schema({
  company: { type: String, required: true },
  jobRole: { type: String, required: true },
  description: { type: String, required: true },
  studentsRequired: { type: Number, default: 1 },
  minimumCGPA: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  formLinkId: { type: String }, // Reference to the form link
  formData: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true })

export default mongoose.model('CompanyRequest', companyRequestSchema)


