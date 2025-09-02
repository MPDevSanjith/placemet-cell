const mongoose = require('mongoose')

const companyRequestSchema = new mongoose.Schema({
  company: { type: String, required: true },
  jobRole: { type: String, required: true },
  description: { type: String, required: true },
  studentsRequired: { type: Number, default: 1 },
  minimumCGPA: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  status: { type: String, enum: ['Open', 'Closed', 'Pending'], default: 'Open' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

module.exports = mongoose.model('CompanyRequest', companyRequestSchema)


