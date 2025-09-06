import mongoose from 'mongoose';

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number format (basic validation)
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it has 10-15 digits (common phone number lengths)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

/**
 * Validate date format and if it's in the future
 * @param {string|Date} date - The date to validate
 * @returns {boolean} - True if valid future date, false otherwise
 */
const validateFutureDate = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  
  const now = new Date();
  return dateObj > now;
};

/**
 * Sanitize string input (remove HTML tags and trim)
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Validated pagination object
 */
const validatePagination = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    skip: (validatedPage - 1) * validatedLimit
  };
};

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {string[]} allowedFields - Array of allowed fields to sort by
 * @returns {object} - Validated sort object
 */
const validateSort = (sortBy, sortOrder, allowedFields = []) => {
  const validSortOrder = ['asc', 'desc', '1', '-1'];
  const validatedSortOrder = validSortOrder.includes(sortOrder?.toLowerCase()) ? sortOrder : 'desc';
  
  let validatedSortBy = sortBy || 'createdAt';
  
  // If allowedFields is specified, validate sortBy
  if (allowedFields.length > 0 && !allowedFields.includes(validatedSortBy)) {
    validatedSortBy = 'createdAt';
  }
  
  return {
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder === 'desc' || validatedSortOrder === '-1' ? -1 : 1
  };
};

/**
 * Build MongoDB filter object from query parameters
 * @param {object} query - Query parameters
 * @param {object} allowedFilters - Object mapping query params to filter fields
 * @returns {object} - MongoDB filter object
 */
const buildFilter = (query, allowedFilters = {}) => {
  const filter = {};
  
  Object.keys(allowedFilters).forEach(queryParam => {
    if (query[queryParam]) {
      const filterField = allowedFilters[queryParam];
      
      if (filterField.type === 'regex') {
        filter[filterField.field] = { 
          $regex: query[queryParam], 
          $options: filterField.options || 'i' 
        };
      } else if (filterField.type === 'array') {
        filter[filterField.field] = { $in: query[queryParam].split(',') };
      } else if (filterField.type === 'range') {
        const [min, max] = query[queryParam].split('-');
        if (min && max) {
          filter[filterField.field] = { $gte: parseFloat(min), $lte: parseFloat(max) };
        } else if (min) {
          filter[filterField.field] = { $gte: parseFloat(min) };
        } else if (max) {
          filter[filterField.field] = { $lte: parseFloat(max) };
        }
      } else {
        filter[filterField.field] = query[queryParam];
      }
    }
  });
  
  return filter;
};

export {
  validateObjectId,
  validateEmail,
  validateUrl,
  validatePhone,
  validateFutureDate,
  sanitizeString,
  validatePagination,
  validateSort,
  buildFilter
};
