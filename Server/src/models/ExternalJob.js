const mongoose = require('mongoose');

const externalJobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [2000, 'Job description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'],
      message: 'Job type must be one of: Full-time, Part-time, Internship, Contract, Freelance'
    }
  },
  externalUrl: {
    type: String,
    required: [true, 'External URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'External URL must be a valid HTTP/HTTPS URL'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Expired', 'Filled'],
      message: 'Status must be one of: Active, Inactive, Expired, Filled'
    },
    default: 'Active'
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    }
  },
  requirements: {
    experience: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    skills: [String],
    education: String
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by user is required']
  },
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  applicationDeadline: {
    type: Date,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Application deadline must be in the future'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
externalJobSchema.index({ companyName: 1, jobTitle: 1 });
externalJobSchema.index({ status: 1, createdAt: -1 });
externalJobSchema.index({ location: 1 });
externalJobSchema.index({ jobType: 1 });
externalJobSchema.index({ tags: 1 });

// Virtual for formatted salary range
externalJobSchema.virtual('salaryRange').get(function() {
  if (!this.salary.min && !this.salary.max) return 'Not specified';
  if (this.salary.min && this.salary.max) {
    return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()}`;
  }
  if (this.salary.min) {
    return `${this.salary.currency} ${this.salary.min.toLocaleString()}+`;
  }
  if (this.salary.max) {
    return `Up to ${this.salary.currency} ${this.salary.max.toLocaleString()}`;
  }
});

// Virtual for days until deadline
externalJobSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.applicationDeadline) return null;
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if job is expired
externalJobSchema.methods.isExpired = function() {
  if (!this.applicationDeadline) return false;
  return new Date() > this.applicationDeadline;
};

// Method to update status based on deadline
externalJobSchema.methods.updateStatus = function() {
  if (this.isExpired() && this.status === 'Active') {
    this.status = 'Expired';
  }
  return this.save();
};

// Pre-save middleware to update status
externalJobSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'Active') {
    this.status = 'Expired';
  }
  next();
});

module.exports = mongoose.model('ExternalJob', externalJobSchema);
