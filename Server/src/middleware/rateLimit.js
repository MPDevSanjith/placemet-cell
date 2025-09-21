import express from 'express'

// Simple in-memory rate limiter
const requestCounts = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per minute per IP

export function rateLimit() {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    
    // Clean up old entries
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(key)
      }
    }
    
    const current = requestCounts.get(clientId)
    
    if (!current) {
      // First request
      requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return next()
    }
    
    if (current.resetTime < now) {
      // Window expired, reset
      requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return next()
    }
    
    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limit exceeded
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      })
    }
    
    // Increment counter
    current.count++
    next()
  }
}

// Stricter rate limiting for auth endpoints
export function authRateLimit() {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    const authKey = `auth:${clientId}`
    
    const current = requestCounts.get(authKey)
    const AUTH_RATE_LIMIT_MAX = 10 // 10 auth requests per minute
    
    if (!current) {
      requestCounts.set(authKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return next()
    }
    
    if (current.resetTime < now) {
      requestCounts.set(authKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      return next()
    }
    
    if (current.count >= AUTH_RATE_LIMIT_MAX) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      })
    }
    
    current.count++
    next()
  }
}
