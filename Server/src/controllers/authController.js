// ==========================
// controllers/authController.js
// ==========================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Models
import User from '../models/User.js';
import Student from '../models/Student.js';

// Email service
import { sendEmail, emailTemplates } from '../email/email.js';

// JWT service
import { signJwt, verifyJwt } from '../config/jwt.js';

// Utils
import logger from '../utils/logger.js';

// ---------- Helpers ----------
const sendLoginOtpEmail = async (email, name, otp) => {
  const mailOptions = emailTemplates.loginOtp(name, email, otp);
  return await sendEmail(mailOptions);
};

const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const mailOptions = emailTemplates.passwordReset(name, email, resetUrl);
  return await sendEmail(mailOptions);
};

// ---------- Controller Methods ----------

// Verify JWT token and return user info
export const verify = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    try {
      const decoded = verifyJwt(token);
      
      // Check if user exists and is active
      let user = null;
      let userRole = 'student';
      
      if (decoded.role === 'placement_officer' || decoded.role === 'admin') {
        user = await User.findById(decoded.id);
        userRole = decoded.role;
      } else {
        user = await Student.findById(decoded.id);
        userRole = 'student';
      }

      if (!user || (user.status && user.status !== 'active')) {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive'
        });
      }

      logger.success(`Token verified for user: ${user.email}`);
      
      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userRole
        }
      });
      
    } catch (jwtError) {
      logger.error('JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
  } catch (error) {
    logger.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Login (officers/admins: password; students: password + OTP)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 1) Try placement officer/admin first by exact match
    const userAccount = await User.findOne({ email: normalizedEmail });

    if (userAccount) {
      if (userAccount.status !== 'active') {
        return res.status(401).json({ 
          success: false, 
          error: 'Account is not active' 
        });
      }

      const isValidPassword = await userAccount.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      userAccount.lastLogin = new Date();
      await userAccount.save();

      const token = signJwt({ 
        id: userAccount._id, 
        email: userAccount.email, 
        role: userAccount.role, 
        name: userAccount.name 
      });

      // Issue cookie session
      const isProd = process.env.NODE_ENV === 'production'
      res.cookie('auth_token', token, {
        httpOnly: true,
        // In dev, allow cross-site POSTs from Vite (5173)
        sameSite: isProd ? 'lax' : 'none',
        secure: isProd ? true : false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      logger.success(`User login successful: ${userAccount.email}`);
      return res.json({
        success: true,
        message: 'Login successful',
        token, // still return token for backward compatibility
        user: {
          id: userAccount._id,
          name: userAccount.name,
          email: userAccount.email,
          role: userAccount.role || 'placement_officer',
        },
        requiresOtp: false
      });
    }

    // 2) Try student (requires OTP)
    const studentAccount = await Student.findOne({ email: normalizedEmail });
    if (studentAccount) {
      const isValidPassword = await studentAccount.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
      }

      // Try to clean up any invalid data before proceeding
      try {
        if (studentAccount.resumes && studentAccount.resumes.length > 0) {
          studentAccount.cleanupResumes();
        }
      } catch (cleanupError) {
        logger.warn(`Resume cleanup failed for student ${studentAccount.email}:`, cleanupError.message);
        // Continue with login even if cleanup fails
      }

      // Generate OTP for student login
      const otp = studentAccount.generateLoginOtp();
      await studentAccount.save();

      // Send OTP email
      await sendLoginOtpEmail(studentAccount.email, studentAccount.name, otp);

      const response = {
        success: true,
        message: 'OTP sent to your email',
        requiresOtp: true,
        email: studentAccount.email
      };

      logger.success(`OTP sent to student: ${studentAccount.email}`);
      return res.json(response);
    }

    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Verify OTP for student login
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP are required' 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const studentAccount = await Student.findOne({ email: normalizedEmail });

    if (!studentAccount) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    if (!studentAccount.verifyLoginOtp(otp)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired OTP' 
      });
    }

    // Clear OTP after successful verification
    studentAccount.clearLoginOtp();
    studentAccount.lastLogin = new Date();
    await studentAccount.save();

    const token = signJwt({ 
      id: studentAccount._id, 
      email: studentAccount.email, 
      role: 'student', 
      name: studentAccount.name 
    });

    // Issue cookie session
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('auth_token', token, {
      httpOnly: true,
      sameSite: isProd ? 'lax' : 'none',
      secure: isProd ? true : false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    logger.success(`Student login successful: ${studentAccount.email}`);
    return res.json({
      success: true,
      message: 'Login successful',
      token, // still return token for backward compatibility
      user: {
        id: studentAccount._id,
        name: studentAccount.name,
        email: studentAccount.email,
        role: 'student',
      },
      requiresOtp: false
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Register new placement officer (admin only)
export const registerOfficer = async (req, res) => {
  try {
    const { name, email, password, role = 'placement_officer' } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Create new user
    const newUser = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role
    });

    await newUser.save();

    logger.success(`New placement officer registered: ${newUser.email}`);
    return res.status(201).json({
      success: true,
      message: 'Placement officer registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Bulk register students
export const bulkRegisterStudents = async (req, res) => {
  try {
    const { students } = req.body || {};

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Students array is required' 
      });
    }

    const results = [];
    const errors = [];

    for (const studentData of students) {
      try {
        const { name, email, password, branch, section, rollNumber, phone, year } = studentData;

        if (!name || !email || !password) {
          errors.push({ email, error: 'Name, email, and password are required' });
          continue;
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // Check if student already exists
        const existingStudent = await Student.findOne({ email: normalizedEmail });
        if (existingStudent) {
          errors.push({ email, error: 'Student with this email already exists' });
          continue;
        }

        // Create new student
        const newStudent = new Student({
          name: String(name).trim(),
          email: normalizedEmail,
          password,
          branch: branch || '',
          section: section || '',
          rollNumber: rollNumber || '',
          phone: phone || '',
          year: year || ''
        });

        await newStudent.save();

        // Send welcome email
        try {
          const mailOptions = emailTemplates.welcomeStudent(name, email, password);
          await sendEmail(mailOptions);
        } catch (emailError) {
          logger.warn(`Failed to send welcome email to ${email}:`, emailError.message);
        }

        results.push({
          id: newStudent._id,
          name: newStudent.name,
          email: newStudent.email
        });

      } catch (studentError) {
        errors.push({ 
          email: studentData.email || 'unknown', 
          error: studentError.message 
        });
      }
    }

    logger.success(`Bulk registration completed. Success: ${results.length}, Errors: ${errors.length}`);
    return res.json({
      success: true,
      message: `Bulk registration completed. ${results.length} students registered successfully.`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('Bulk registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    logger.success(`Password reset email sent to: ${user.email}`);
    return res.json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and new password are required' 
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.success(`Password reset successful for: ${user.email}`);
    return res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;

    if (role === 'student') {
      const student = await Student.findById(id).select('-password -loginOtp -loginOtpExpires');
      if (!student) {
        return res.status(404).json({ 
          success: false, 
          error: 'Student not found' 
        });
      }
      return res.json({
        success: true,
        user: student
      });
    } else {
      const user = await User.findById(id).select('-password -passwordResetToken -passwordResetExpires');
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }
      return res.json({
        success: true,
        user: user
      });
    }

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
