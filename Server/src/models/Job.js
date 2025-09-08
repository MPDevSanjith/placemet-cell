import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  jobType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], required: true },
  ctc: { type: String },
  deadline: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'closed'], default: 'active' },
  branches: [{ type: String }],
  skills: [{ type: String }],
  minCgpa: { type: Number, default: 0 },
  contactEmail: { type: String },
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

export default mongoose.model('Job', jobSchema)


