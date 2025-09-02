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
