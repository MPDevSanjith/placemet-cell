import { body, validationResult } from 'express-validator';

// Validation middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Profile validation rules
export const validateProfileUpdate = [
  body('basicInfo.name').optional().isString().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('basicInfo.phone').optional().isString().isLength({ min: 10, max: 15 }).withMessage('Phone must be between 10 and 15 characters'),
  body('basicInfo.address').optional().isString().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  body('basicInfo.gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('basicInfo.dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date'),
  
  body('academicInfo.rollNumber').optional().isString().isLength({ min: 1, max: 20 }).withMessage('Roll number must be between 1 and 20 characters'),
  body('academicInfo.branch').optional().isString().isLength({ min: 2, max: 50 }).withMessage('Branch must be between 2 and 50 characters'),
  body('academicInfo.section').optional().isString().isLength({ min: 1, max: 10 }).withMessage('Section must be between 1 and 10 characters'),
  body('academicInfo.year').optional().isString().isLength({ min: 1, max: 10 }).withMessage('Year must be between 1 and 10 characters'),
  body('academicInfo.gpa').optional().isFloat({ min: 0, max: 10 }).withMessage('GPA must be between 0 and 10'),
  body('academicInfo.specialization').optional().isString().isLength({ max: 100 }).withMessage('Specialization must be less than 100 characters'),
  
  body('placementInfo.jobRole').optional().isString().isLength({ max: 100 }).withMessage('Job role must be less than 100 characters'),
  body('placementInfo.preferredDomain').optional().isString().isLength({ max: 100 }).withMessage('Preferred domain must be less than 100 characters'),
  body('placementInfo.skills').optional().isArray().withMessage('Skills must be an array'),
  body('placementInfo.projects').optional().isArray().withMessage('Projects must be an array'),
  body('placementInfo.certifications').optional().isArray().withMessage('Certifications must be an array'),
  
  handleValidationErrors
];

// Field update validation
export const validateFieldUpdate = [
  body('field').notEmpty().isString().withMessage('Field is required'),
  body('value').notEmpty().withMessage('Value is required'),
  handleValidationErrors
];

// Skills validation
export const validateSkills = [
  body('skills').isArray().withMessage('Skills must be an array'),
  body('skills.*').isString().isLength({ min: 1, max: 50 }).withMessage('Each skill must be between 1 and 50 characters'),
  handleValidationErrors
];

// Projects validation
export const validateProjects = [
  body('projects').isArray().withMessage('Projects must be an array'),
  body('projects.*').isString().isLength({ min: 1, max: 200 }).withMessage('Each project must be between 1 and 200 characters'),
  handleValidationErrors
];
