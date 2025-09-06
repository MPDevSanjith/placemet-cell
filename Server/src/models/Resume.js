// ==========================
// models/Resume.js
// ==========================

import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  // Reference to Student (required)
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },

  // File information (required)
  fileName: {
    type: String,
    required: true,
    trim: true
  },

  // Cloudinary information (required)
  cloudinaryId: {
    type: String,
    required: true,
    trim: true
  },

  // URL for accessing the resume (required)
  url: {
    type: String,
    required: true,
    trim: true
  },

  // Additional metadata
  originalName: {
    type: String,
    trim: true
  },

  mimeType: {
    type: String,
    trim: true
  },

  size: {
    type: Number
  },

  cloudinaryFolder: {
    type: String,
    trim: true
  },

  // ATS Analysis data
  atsAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  hasAtsAnalysis: {
    type: Boolean,
    default: false
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  // Enable timestamps
  timestamps: true,
  
  // Add collection name
  collection: 'resumes'
});

// Indexes for better query performance
resumeSchema.index({ student: 1, isActive: 1 });
resumeSchema.index({ cloudinaryId: 1 });
resumeSchema.index({ createdAt: -1 });

// Virtual for formatted file size
resumeSchema.virtual('formattedSize').get(function() {
  if (!this.size) return 'Unknown';
  
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for upload date
resumeSchema.virtual('uploadDateFormatted').get(function() {
  if (!this.createdAt) return 'Unknown';
  return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
resumeSchema.set('toJSON', { virtuals: true });
resumeSchema.set('toObject', { virtuals: true });

// Pre-save middleware to ensure required fields
resumeSchema.pre('save', function(next) {
  // Ensure fileName is always set
  if (!this.fileName) {
    this.fileName = this.originalName || 'resume.pdf';
  }
  
  // Ensure url is always set
  if (!this.url && this.cloudinaryId) {
    // This will be set by the controller before saving
    this.url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/v1/${this.cloudinaryId}`;
  }
  
  next();
});

// Static method to find resumes by student
resumeSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to find active resumes
resumeSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Instance method to deactivate resume
resumeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to update ATS analysis
resumeSchema.methods.updateAtsAnalysis = function(analysis) {
  this.atsAnalysis = analysis;
  this.hasAtsAnalysis = true;
  return this.save();
};

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
