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
  course: String,
  // New academic meta
  programType: { type: String }, // free text (e.g., UG, PG, Diploma, PhD, etc.)
  programDurationYears: { type: Number },
  admissionYear: String, // e.g., 2025
  passOutYear: String, // computed when possible
  
  // Profile & Status
  isActive: { type: Boolean, default: true },
  isPlaced: { type: Boolean, default: false },
  lastLogin: Date,
  profileImage: String,
  
  // Placement Details
  placementDetails: {
    companyName: String,
    designation: String,
    ctc: Number, // Cost to Company in LPA
    workLocation: String,
    joiningDate: Date,
    remarks: String,
    offerLetterDriveLink: String,
    placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Placement officer who marked as placed
    placedAt: Date
  },
  
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
  
  // Eligibility Criteria
  eligibilityCriteria: {
    attendancePercentage: Number,
    backlogs: Number,
    academicRequirements: String,
    otherEligibility: String
  },
  
  // Comprehensive Biodata Fields
  // Physical & Personal Details
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  height: Number, // in cm
  weight: Number, // in kg
  nationality: String,
  religion: String,
  caste: String,
  category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
  
  // Family Information
  parentName: String,
  parentPhone: String,
  parentOccupation: String,
  familyIncome: Number, // in rupees
  
  // Academic History
  tenthPercentage: Number,
  twelfthPercentage: Number,
  diplomaPercentage: Number,
  entranceExamScore: Number,
  entranceExamRank: Number,
  
  // Living & Transportation
  hostelStatus: { type: String, enum: ['Day Scholar', 'Hostel Resident', 'Paying Guest', 'Own House'] },
  transportMode: { type: String, enum: ['Public Transport', 'College Bus', 'Own Vehicle', 'Walking', 'Cycling'] },
  
  // Medical Information
  medicalConditions: String,
  allergies: String,
  disabilities: String,
  
  // Skills & Languages
  languagesKnown: [String],
  hobbies: [String],
  extraCurricularActivities: [String],
  sports: [String],
  
  // Certifications & Achievements
  technicalCertifications: [String],
  nonTechnicalCertifications: [String],
  internships: [String],
  workshopsAttended: [String],
  paperPublications: [String],
  patentApplications: Number,
  startupExperience: Number,
  leadershipRoles: Number,
  communityService: Number,
  
  // Online Presence
  socialMediaPresence: [String],
  linkedinProfile: String,
  portfolioWebsite: String,
  githubProfile: String,
  
  // Career Preferences
  expectedSalary: Number, // in rupees
  preferredLocation: [String],
  willingToRelocate: { type: Boolean, default: false },
  
  // Documents & Identity
  passportNumber: String,
  drivingLicense: String,
  vehicleOwnership: { type: Boolean, default: false },
  bankAccount: String,
  panCard: String,
  aadharNumber: String,
  
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

  // Infer duration heuristically if not explicitly set
  if (!this.programDurationYears) {
    const src = `${(this.programType || '').toLowerCase()}`;
    let inferred;
    if (/phd|doctorate/.test(src)) inferred = 3; // variable, keep minimal default
    else if (/mba|msc|m\.tech|mtech|ma|mca|pg/.test(src)) inferred = 2;
    else if (/bsc|b\.sc|bcom|b\.com|ba|btech|b\.tech|be|ug|bca|bba/.test(src)) inferred = 3;
    else if (/diploma|poly/.test(src)) inferred = 3;
    if (inferred) this.programDurationYears = inferred;
  }

  // Compute pass-out year from admission and duration when possible
  if (!this.passOutYear && this.admissionYear && this.programDurationYears) {
    const ay = parseInt(this.admissionYear);
    if (!isNaN(ay)) {
      this.passOutYear = String(ay + this.programDurationYears);
    }
  }
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
  
  return String(this.loginOtp) === String(otp);
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

// Add indexes for better performance
studentSchema.index({ email: 1 });
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ branch: 1, course: 1 });
studentSchema.index({ isActive: 1, isPlaced: 1 });
studentSchema.index({ year: 1, course: 1 });
studentSchema.index({ 'placementDetails.companyName': 1 });
studentSchema.index({ 'onboardingData.academicInfo.gpa': 1 });
studentSchema.index({ 'eligibilityCriteria.attendancePercentage': 1 });
studentSchema.index({ 'eligibilityCriteria.backlogs': 1 });

// Compound indexes for AI analysis queries
studentSchema.index({ course: 1, branch: 1, year: 1 });
studentSchema.index({ isActive: 1, course: 1, branch: 1 });
studentSchema.index({ isPlaced: 1, course: 1, year: 1 });
studentSchema.index({ name: 1, email: 1, rollNumber: 1 });

// Text index for name search
studentSchema.index({ name: 'text', email: 'text', rollNumber: 'text' });

const Student = mongoose.model('Student', studentSchema);

export default Student;
