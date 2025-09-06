import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  validateProfileUpdate,
  validateFieldUpdate,
  validateSkills,
  validateProjects
} from '../middleware/validation.js';
import { 
  getStudentProfile,
  updateStudentProfile,
  updateProfileField,
  getProfileCompletion,
  updateSkills,
  updateProjects
} from '../controllers/profileController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Profile routes
router.get('/comprehensive', getStudentProfile);
router.put('/comprehensive', validateProfileUpdate, updateStudentProfile);
router.put('/field', validateFieldUpdate, updateProfileField);
router.get('/completion', getProfileCompletion);

// Skills and Projects management
router.put('/skills', validateSkills, updateSkills);
router.put('/projects', validateProjects, updateProjects);

export default router;
