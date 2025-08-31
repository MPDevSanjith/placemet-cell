
// ==========================
// models/Student.js (fixed)
// ==========================
const mongoose_student = require('mongoose')
const bcrypt_student = require('bcryptjs')

const studentSchema = new mongoose_student.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
  cgpa: { type: Number, min: 0, max: 10 },
  phone: String,
  onboardingCompleted: { type: Boolean, default: false },
  // OTP fields for login
  loginOtpCode: String,
  loginOtpExpires: Date,
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Optional lastLogin for symmetry
  lastLogin: Date,
  // --- resumes & profile (unchanged, trimmed for brevity) ---
  resumes: [{
    fileName: { type: String, required: true },
    driveId: { type: String, required: true },
    driveLink: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false },
    version: { type: String, default: '1.0' },
    description: String,
  }],
  atsScores: [{
    resumeId: { type: mongoose_student.Schema.Types.ObjectId, ref: 'Resume' },
    role: String,
    overall: { type: Number, min: 0, max: 100 },
    breakdown: { keywords: Number, formatting: Number, content: Number, experience: Number },
    matched: [String],
    missing: [String],
    date: { type: Date, default: Date.now },
  }],
  profile: {
    personal: { linkedin: String, github: String, portfolio: String, location: String, about: String },
    education: { highestQualification: String, university: String, graduationYear: String, relevantCoursework: [String] },
    skills: { technical: [String], soft: [String], languages: [String] },
    experience: [{ title: String, company: String, duration: String, description: String, skills: [String] }],
    preferences: { desiredRoles: [String], industries: [String], locations: [String], salaryRange: String, jobType: String, remotePreference: String },
  },
  analysisHistory: [{
    resumeId: String,
    analysisDate: { type: Date, default: Date.now },
    score: Number,
    improvements: [String],
    keywords: [String],
  }],
}, { timestamps: true })

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt_student.genSalt(10)
    this.password = await bcrypt_student.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

studentSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt_student.compare(candidatePassword, this.password)
}

studentSchema.methods.addResume = function (resumeData) {
  this.resumes.forEach((r) => (r.isActive = false))
  this.resumes.push({ ...resumeData, isActive: true, version: `${this.resumes.length + 1}.0` })
  return this.save()
}

studentSchema.methods.getActiveResume = function () {
  return this.resumes.find((r) => r.isActive)
}

studentSchema.methods.addAtsScore = function (atsData) {
  this.atsScores.push(atsData)
  return this.save()
}

module.exports = mongoose_student.model('Student', studentSchema)
