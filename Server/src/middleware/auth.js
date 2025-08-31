const jwt = require('jsonwebtoken')
const Student = require('../models/Student')
const User = require('../models/User')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    console.log('🔐 Auth Debug - Headers:', {
      authorization: authHeader,
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    })
    
    const token = authHeader && authHeader.split(' ')[1]
    console.log('🔐 Auth Debug - Token:', token ? `${token.substring(0, 20)}...` : 'No token')

    if (!token) {
      console.log('🔐 Auth Debug - No token provided')
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    console.log('🔐 Auth Debug - Decoded token:', { id: decoded.id, email: decoded.email, role: decoded.role })
    
    // Check if user exists in either Student or User collection
    let user = await Student.findById(decoded.id).select('-password')
    let userType = 'student'
    
    if (!user) {
      console.log('🔐 Auth Debug - Student not found, checking User collection')
      user = await User.findById(decoded.id).select('-password')
      userType = 'user'
    }

    if (!user) {
      console.log('🔐 Auth Debug - User not found in either collection')
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token - user not found' 
      })
    }

    console.log('🔐 Auth Debug - User found:', { id: user._id, email: user.email, type: userType })

    // Add user info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      type: userType
    }

    next()
  } catch (error) {
    console.error('🔐 Auth Debug - Authentication error:', error.message)
    console.error('🔐 Auth Debug - Error details:', {
      name: error.name,
      stack: error.stack
    })
    
    if (error.name === 'JsonWebTokenError') {
      console.log('🔐 Auth Debug - JWT Secret used:', process.env.JWT_SECRET ? 'From env' : 'Fallback')
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token - please login again',
        details: 'Token signature verification failed'
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      })
    }

    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    })
  }
}

module.exports = {
  authenticateToken
}
