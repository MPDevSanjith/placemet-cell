import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateOtp } from '../utils/generateOtp.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'placement_officer'],
    default: 'placement_officer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: Date,
  
  // Login OTP (for placement officers/admins)
  loginOtp: String,
  loginOtpExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  // OTP-based password reset
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate login OTP method (for officers/admins)
userSchema.methods.generateLoginOtp = function() {
  const otp = generateOtp();
  this.loginOtp = otp;
  this.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify login OTP method (for officers/admins)
userSchema.methods.verifyLoginOtp = function(otp) {
  if (!this.loginOtp || !this.loginOtpExpires) {
    return false;
  }
  if (new Date() > this.loginOtpExpires) {
    return false;
  }
  return String(this.loginOtp) === String(otp);
};

// Clear login OTP method
userSchema.methods.clearLoginOtp = function() {
  this.loginOtp = undefined;
  this.loginOtpExpires = undefined;
};

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('User', userSchema);
