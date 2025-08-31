// ==========================
// routes/auth.js (clean & organized)
// ==========================
const express = require('express')
const router = express.Router()

// Import auth controller
const {
  login,
  verifyOtp,
  requestOtp,
  forgotPassword,
  resetPassword,
  clearAuth
} = require('../controllers/authController')

// ---------- Routes ----------
// Login (officers/admins: password; students: password + OTP)
router.post('/login', login)

// Verify OTP (students)
router.post('/verify-otp', verifyOtp)

// Request OTP for students
router.post('/request-otp', requestOtp)

// Forgot password (both collections)
router.post('/forgot-password', forgotPassword)

// Reset password with token (both collections)
router.post('/reset-password', resetPassword)

// Clear auth debug helper
router.post('/clear-auth', clearAuth)

module.exports = router
