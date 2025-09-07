// ==========================
// middleware/errorHandler.js
// ==========================
import logger from '../utils/logger.js';

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);

  // Default error
  let error = {
    success: false,
    error: 'Internal server error'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      error: 'Validation failed',
      details: messages
    };
    return res.status(400).json(error);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      error: `${field} already exists`
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      error: 'Invalid token'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      error: 'Token expired'
    };
    return res.status(401).json(error);
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      success: false,
      error: 'Invalid ID format'
    };
    return res.status(400).json(error);
  }

  // Development error details
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(500).json(error);
};

// Not found middleware
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
