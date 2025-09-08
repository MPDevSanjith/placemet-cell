import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  onboarding, 
  onboardingComplete, 
  getOnboardingStatus,
  getProfile, 
  updateProfile, 
  atsAnalysis,
  getStudentProfile,
  getCompletionStatus,
  updateStudentProfile,
  updateSkills,
  updateProjects,
  getDashboardData
} from '../controllers/studentController.js';

const router = express.Router();

// Onboarding
router.post('/onboarding', authenticateToken, onboarding);
router.post('/onboarding-complete', authenticateToken, onboardingComplete);
router.get('/onboarding-status', authenticateToken, getOnboardingStatus);

// Profile (legacy endpoints for backward compatibility)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Profile (new comprehensive endpoints)
router.get('/profile/comprehensive', authenticateToken, getStudentProfile);
router.get('/profile/completion', authenticateToken, getCompletionStatus);
router.put('/profile/comprehensive', authenticateToken, updateStudentProfile);

// Skills and Projects management
router.put('/profile/skills', authenticateToken, updateSkills);
router.put('/profile/projects', authenticateToken, updateProjects);

// ATS
router.post('/ats-analysis', authenticateToken, atsAnalysis);

// Dashboard
router.get('/dashboard', authenticateToken, getDashboardData);

export default router;
