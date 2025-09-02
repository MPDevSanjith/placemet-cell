// ==========================
// middleware/auth.js
// ==========================
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { verifyJwt } from '../config/jwt.js';

<<<<<<< HEAD
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    console.log('🔐 Auth Debug - Headers:', {
      authorization: authHeader,
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    })
    
    const token = authHeader && authHeader.split(' ')[1]
    console.log('🔐 Auth Debug - Token:', token ? `${token.substring(0,20)}...` : 'No token')
=======
// JWT authentication middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    const decoded = verifyJwt(token);
    
    // Check if user exists in either Student or User collection
    let user = await Student.findById(decoded.id).select('-password -loginOtp -loginOtpExpires');
    let userType = 'student';
    
    if (!user) {
      user = await User.findById(decoded.id).select('-password -passwordResetToken -passwordResetExpires');
      userType = 'user';
    }

    if (!user) {
      logger.warn(`Authentication failed: User not found for ID ${decoded.id}`);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token - user not found' 
      });
    }

    // Add user info to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
<<<<<<< HEAD
      role: user.role || 'student', // Add role for authorization
=======
      role: decoded.role || userType,
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892
      type: userType
    };

    logger.debug(`Authentication successful: ${user.email} (${userType})`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token - please login again'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

<<<<<<< HEAD
// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
=======
// Role-based authorization middleware
export const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892
      });
    }

    if (!roles.includes(req.user.role)) {
<<<<<<< HEAD
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
=======
      logger.warn(`Authorization failed: User ${req.user.email} attempted to access ${req.path} with role ${req.user.role}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892
      });
    }

    next();
  };
};

<<<<<<< HEAD
module.exports = {
  protect,
  authorize,
  authenticateToken: protect // Keep backward compatibility
}
=======
// Student-only middleware
export const authorizeStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }

  if (req.user.type !== 'student') {
    logger.warn(`Authorization failed: Non-student user ${req.user.email} attempted to access student route`);
    return res.status(403).json({ 
      success: false, 
      error: 'Student access only' 
    });
  }

  next();
};

// Admin/placement officer middleware
export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }

  if (req.user.type !== 'user' || !['admin', 'placement_officer'].includes(req.user.role)) {
    logger.warn(`Authorization failed: User ${req.user.email} attempted to access admin route`);
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access only' 
    });
  }

  next();
};
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892
