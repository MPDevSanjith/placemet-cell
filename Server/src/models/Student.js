import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateOtp } from '../utils/generateOtp.js';

// models/Student.js (Updated for comprehensive resume and ATS analysis)

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  branch: String,
  section: String,
  rollNumber: String,
  phone: String,
  year: String,
  
  // Profile & Status
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  profileImage: String,
  
  // OTP fields
  loginOtp: String,
  loginOtpExpires: Date,
  
  // Resume references - Now using separate Resume model
  resumes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }],
  
  // Current active resume
  activeResume: {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    lastUpdated: Date
  },
  
  // Onboarding Data
  onboardingCompleted: { type: Boolean, default: false },
  onboardingData: {
    personalInfo: {
      address: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] }
    },
    academicInfo: {
      gpa: Number,
      specialization: String,
      skills: [String],
      projects: [String]
    },
    onboardingStep: { type: String, enum: ['pending', 'personal_info', 'academic_info', 'completed'], default: 'pending' }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook for password hashing
studentSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate login OTP method
studentSchema.methods.generateLoginOtp = function() {
  const otp = generateOtp();
  this.loginOtp = otp;
  this.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify login OTP method
studentSchema.methods.verifyLoginOtp = function(otp) {
  if (!this.loginOtp || !this.loginOtpExpires) {
    return false;
  }
  
  if (new Date() > this.loginOtpExpires) {
    return false;
  }
  
  return this.loginOtp === otp;
};

// Clear login OTP method
studentSchema.methods.clearLoginOtp = function() {
  this.loginOtp = undefined;
  this.loginOtpExpires = undefined;
};

// Cleanup resumes method
studentSchema.methods.cleanupResumes = function() {
  if (this.resumes && this.resumes.length > 0) {
    this.resumes = this.resumes.filter(resume => resume.isActive);
  }
};

// Add resume method
studentSchema.methods.addResume = function(resumeData) {
  const newResume = {
    filename: resumeData.filename,
    originalName: resumeData.originalName,
    mimeType: resumeData.mimeType,
    size: resumeData.size,
    uploadDate: new Date(),
    isActive: true,
    cloudinaryId: resumeData.cloudinaryId,
    cloudinaryUrl: resumeData.cloudinaryUrl,
    cloudinaryFolder: resumeData.cloudinaryFolder
  };
  
  this.resumes.push(newResume);
  this.activeResume = {
    resumeId: newResume._id,
    lastUpdated: new Date()
  };
  
  return newResume;
};

// Update ATS analysis method
studentSchema.methods.updateAtsAnalysis = function(resumeId, atsData) {
  const resume = this.resumes.id(resumeId);
  if (resume) {
    resume.atsAnalysis = {
      score: atsData.score,
      lastAnalyzed: new Date(),
      jobRole: atsData.jobRole,
      improvements: atsData.improvements,
      suggestions: atsData.suggestions,
      mistakes: atsData.mistakes,
      keywords: atsData.keywords,
      overall: atsData.overall
    };
  }
  return resume;
};

const Student = mongoose.model('Student', studentSchema);

export default Student;
