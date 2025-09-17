import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  jobType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], required: true },
  ctc: { type: String },
  minCtc: { type: String },
  deadline: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'closed'], default: 'active' },
  branches: [{ type: String }],
  skills: [{ type: String }],
  minCgpa: { type: Number, default: 0 },
  studentsRequired: { type: Number, default: 1 },
  jdUrl: { type: String },
  contactEmail: { type: String },
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

// Indexes to speed up common queries
jobSchema.index({ status: 1, createdAt: -1 })
jobSchema.index({ title: 'text', description: 'text', skills: 1 })
jobSchema.index({ minCgpa: 1 })
jobSchema.index({ location: 1 })
jobSchema.index({ jobType: 1 })

export default mongoose.model('Job', jobSchema)


