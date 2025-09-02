<<<<<<< HEAD
module.exports = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
}


=======
// ==========================
// utils/logger.js
// ==========================

// Simple logger utility
const logger = {
  info: (message, ...args) => {
    console.log(`ℹ️ ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  success: (message, ...args) => {
    console.log(`✅ ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    console.warn(`⚠️ ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  error: (message, ...args) => {
    console.error(`❌ ${new Date().toISOString()} - ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
};

export default logger;
>>>>>>> 119d8bb2feb1f30304868cdece1789d6b85bf892
