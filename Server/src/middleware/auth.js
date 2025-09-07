import jwt from 'jsonwebtoken'
import { verifyJwt } from '../config/jwt.js'
import Student from '../models/Student.js'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // Fallback to cookie-based session
    if (!token && req.cookies && typeof req.cookies.auth_token === 'string') {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' })
    }

    const decoded = verifyJwt(token)

    let user = await Student.findById(decoded.id).select('-password')
    let userType = 'student'

    if (!user) {
      user = await User.findById(decoded.id).select('-password')
      userType = 'user'
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token - user not found' })
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role || decoded.role || 'student',
      type: userType
    }

    next()
  } catch (error) {
    console.warn('Auth protect error:', {
      name: error.name,
      message: error.message,
      headerPresent: !!req.headers['authorization'],
      cookiePresent: !!(req.cookies && req.cookies.auth_token),
      tokenPrefix: (req.headers['authorization'] || '').slice(0, 20)
    })
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token - please login again' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' })
    }
    res.status(500).json({ success: false, error: 'Authentication failed' })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this resource' })
    }
    next()
  }
}





export const authenticateToken = protect
export const authorizeStudent = authorize('student')
export const authorizeAdmin = authorize('admin')
