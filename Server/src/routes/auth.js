import express from 'express'
const router = express.Router()
import {
  login,
  verifyOtp,
  registerOfficer,
  bulkRegisterStudents,
  forgotPassword,
  resetPassword,
  getProfile,
  verify
} from '../controllers/authController.js'
import { protect, authorize, authenticateToken } from '../middleware/auth.js'

// const { authenticateToken } = authModule

// Public routes
router.post('/login', login)
router.post('/verify-otp', verifyOtp)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

// Logout destroys cookie session
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  return res.json({ success: true, message: 'Logged out' });
});

// Token verification route
router.get('/verify', verify)

// Protected routes (admin only)
router.post('/register-officer', authenticateToken, registerOfficer)
router.post('/bulk-register-students', authenticateToken, bulkRegisterStudents)

// Protected routes (authenticated users)
router.get('/profile', authenticateToken, getProfile)

export default router
