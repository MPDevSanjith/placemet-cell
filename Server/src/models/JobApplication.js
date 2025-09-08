import mongoose from 'mongoose'

const jobApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  status: { type: String, enum: ['applied', 'reviewed', 'shortlisted', 'rejected', 'hired'], default: 'applied' },
  note: { type: String },
}, { timestamps: true })

jobApplicationSchema.index({ student: 1, job: 1 }, { unique: true })

export default mongoose.model('JobApplication', jobApplicationSchema)


