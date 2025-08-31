// ==========================
// controllers/authController.js
// ==========================
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// Models
const User = require('../models/User')
const Student = require('../models/Student')

// Email service
const { sendEmail, emailTemplates } = require('../config/email')

// ---------- Helpers ----------
const signJwt = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

const sendLoginOtpEmail = async (email, name, otp) => {
  const mailOptions = emailTemplates.loginOtp(name, email, otp)
  return await sendEmail(mailOptions)
}

const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
  const mailOptions = emailTemplates.passwordReset(name, email, resetUrl)
  return await sendEmail(mailOptions)
}

// ---------- Controller Methods ----------

// Login (officers/admins: password; students: password + OTP)
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // 1) Try placement officer/admin first by exact match
    const userAccount = await User.findOne({ email: normalizedEmail })

    if (userAccount) {
      if (userAccount.status !== 'active') {
        return res.status(401).json({ 
          success: false, 
          error: 'Account is not active' 
        })
      }

      const isValidPassword = await userAccount.comparePassword(password)
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        })
      }

      userAccount.lastLogin = new Date()
      await userAccount.save()

      const token = signJwt({ 
        id: userAccount._id, 
        email: userAccount.email, 
        role: userAccount.role, 
        name: userAccount.name 
      })

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: userAccount._id,
          name: userAccount.name,
          email: userAccount.email,
          role: userAccount.role || 'placement_officer',
        },
        requiresOtp: false
      })
    }

    // 2) Try student (requires OTP)
    const studentAccount = await Student.findOne({ email: normalizedEmail })
    if (studentAccount) {
      const isValidPassword = await studentAccount.comparePassword(password)
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        })
      }

      // Generate 6-digit OTP valid for 10 minutes
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const expires = new Date(Date.now() + 10 * 60 * 1000)

      studentAccount.loginOtpCode = otp
      studentAccount.loginOtpExpires = expires
      await studentAccount.save()

      const emailResult = await sendLoginOtpEmail(
        studentAccount.email, 
        studentAccount.name || 'Student', 
        otp
      )
      
      // In development, if email fails, still allow login and return OTP in response
      const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
      
      if (!emailResult.success && !isDevelopment) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to send OTP email' 
        })
      }

      return res.json({
        success: true,
        message: emailResult.success ? 'OTP sent to email' : 'OTP generated (email not configured)',
        otpRequired: true,
        otp: isDevelopment && !emailResult.success ? otp : undefined, // Include OTP in development
        user: { 
          id: studentAccount._id, 
          name: studentAccount.name, 
          email: studentAccount.email, 
          role: 'student' 
        },
      })
    }

    // Not found in either collection
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

// Verify OTP (students)
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {}
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP are required' 
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const student = await Student.findOne({ email: normalizedEmail })

    if (!student || !student.loginOtpCode || !student.loginOtpExpires) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP not found. Please login again.' 
      })
    }

    if (student.loginOtpCode !== String(otp)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP' 
      })
    }

    if (student.loginOtpExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP has expired. Please login again.' 
      })
    }

    // Clear OTP and update lastLogin
    student.loginOtpCode = undefined
    student.loginOtpExpires = undefined
    student.lastLogin = new Date()
    await student.save()

    const token = signJwt({ 
      id: student._id, 
      email: student.email, 
      role: 'student', 
      name: student.name 
    })

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: { 
        id: student._id, 
        name: student.name, 
        email: student.email, 
        role: 'student' 
      },
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

// Forgot password (both collections)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {}
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    let user = (await User.findOne({ email: normalizedEmail })) || 
               (await Student.findOne({ email: normalizedEmail }))

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = resetTokenExpiry
    await user.save()

    const emailResult = await sendPasswordResetEmail(
      user.email, 
      user.name || 'User', 
      resetToken
    )
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send password reset email' 
      })
    }

    return res.json({ 
      success: true, 
      message: 'Password reset email sent successfully' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

// Reset password with token (both collections)
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {}
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and new password are required' 
      })
    }

    let user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: new Date() } 
    })
    
    if (!user) {
      user = await Student.findOne({ 
        resetPasswordToken: token, 
        resetPasswordExpires: { $gt: new Date() } 
      })
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      })
    }

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

// Request OTP for student login
const requestOtp = async (req, res) => {
  try {
    const { email } = req.body || {}
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const student = await Student.findOne({ email: normalizedEmail })

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      })
    }

    // Generate 6-digit OTP valid for 10 minutes
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    student.loginOtpCode = otp
    student.loginOtpExpires = expires
    await student.save()

    const emailResult = await sendLoginOtpEmail(
      student.email, 
      student.name || 'Student', 
      otp
    )
    
    // In development, if email fails, still allow and return OTP in response
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
    
    if (!emailResult.success && !isDevelopment) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send OTP email' 
      })
    }

    return res.json({
      success: true,
      message: emailResult.success ? 'OTP sent to email' : 'OTP generated (email not configured)',
      otp: isDevelopment && !emailResult.success ? otp : undefined, // Include OTP in development
    })
  } catch (error) {
    console.error('Request OTP error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

// Clear auth debug helper
const clearAuth = async (req, res) => {
  try {
    const { email } = req.body || {}
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Clear OTP for student
    const student = await Student.findOne({ email: normalizedEmail })
    if (student) {
      student.loginOtpCode = undefined
      student.loginOtpExpires = undefined
      await student.save()
      console.log('✅ Cleared OTP data for student:', email)
    }

    // Properly unset reset token fields in both collections
    await User.updateMany(
      { email: normalizedEmail }, 
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
    )
    await Student.updateMany(
      { email: normalizedEmail }, 
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
    )

    return res.json({ 
      success: true, 
      message: 'Auth data cleared successfully' 
    })
  } catch (error) {
    console.error('Clear auth error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

module.exports = {
  login,
  verifyOtp,
  requestOtp,
  forgotPassword,
  resetPassword,
  clearAuth
}
