const jwt = require('jsonwebtoken')
const Student = require('../models/Student')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
<<<<<<< HEAD
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
=======
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    // Fallback to cookie-based session
    if (!token && req.cookies && typeof req.cookies.auth_token === 'string') {
      token = req.cookies.auth_token;
    }
>>>>>>> 3da8d6aa0e12f39bcc5fc1199e86f94589560efe

    if (!token) {
      return res.status(401).json({ success: false, error: 'Access token required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')

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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token - please login again' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' })
    }
    res.status(500).json({ success: false, error: 'Authentication failed' })
  }
}

const authorize = (...roles) => {
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

module.exports = {
  protect,
  authorize,
  authenticateToken: protect
}
