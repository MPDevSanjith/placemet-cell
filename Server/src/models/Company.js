import mongoose from 'mongoose'

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  phone: { type: String },
  website: { type: String },
  address: { type: String },
  description: { type: String },
  industry: { type: String },
  foundedYear: { type: Number },
  employeeCount: { type: Number },
  contactPerson: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true })

export default mongoose.model('Company', companySchema)


