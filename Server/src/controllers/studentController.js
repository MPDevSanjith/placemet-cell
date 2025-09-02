// ==========================
// controllers/studentController.js
// ==========================
import Student from '../models/Student.js';
import logger from '../utils/logger.js';

// Student onboarding
export const onboarding = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    logger.info(`Student onboarding started: ${student.email}`);
    res.json({ success: true, message: 'Onboarding started', studentId: student._id });
  } catch (err) {
    logger.error('Onboarding error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Complete onboarding
export const onboardingComplete = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    student.onboardingCompleted = true;
    student.onboardingData.onboardingStep = 'completed';
    await student.save();
    
    logger.success(`Student onboarding completed: ${student.email}`);
    res.json({ success: true, message: 'Onboarding complete' });
  } catch (err) {
    logger.error('Onboarding complete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get onboarding status
export const getOnboardingStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ 
      success: true, 
      status: student.onboardingData.onboardingStep || 'pending',
      completed: student.onboardingCompleted || false
    });
  } catch (err) {
    logger.error('Get onboarding status error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get comprehensive student profile with completion status
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password -loginOtp -loginOtpExpires');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Calculate profile completion percentage
    const completionStatus = calculateProfileCompletion(student);

    // Get latest resume
    const latestResume = student.resumes
      .filter(r => r.isActive)
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0];

    // Prepare profile data
    const profileData = {
      basicInfo: {
        name: student.name,
        email: student.email,
        phone: student.phone,
        gender: student.onboardingData?.personalInfo?.gender,
        dateOfBirth: student.onboardingData?.personalInfo?.dateOfBirth,
        address: student.onboardingData?.personalInfo?.address
      },
      academicInfo: {
        rollNumber: student.rollNumber,
        branch: student.branch,
        section: student.section,
        year: student.year,
        gpa: student.onboardingData?.academicInfo?.gpa,
        specialization: student.onboardingData?.academicInfo?.specialization
      },
      placementInfo: {
        jobRole: student.onboardingData?.placementInfo?.jobRole || 'Not specified',
        preferredDomain: student.onboardingData?.placementInfo?.preferredDomain || 'Not specified',
        skills: student.onboardingData?.academicInfo?.skills || [],
        certifications: student.onboardingData?.placementInfo?.certifications || [],
        projects: student.onboardingData?.academicInfo?.projects || []
      },
      resume: latestResume ? {
        id: latestResume._id,
        filename: latestResume.filename,
        originalName: latestResume.originalName,
        googleDriveUrl: latestResume.googleDriveUrl,
        uploadDate: latestResume.uploadDate,
        hasAtsAnalysis: !!latestResume.atsAnalysis?.score,
        atsScore: latestResume.atsAnalysis?.score || 0
      } : null,
      status: {
        isActive: student.isActive,
        onboardingCompleted: student.onboardingCompleted,
        lastLogin: student.lastLogin,
        profileCompletion: completionStatus.percentage,
        completionBreakdown: completionStatus.breakdown
      },
      statistics: {
        applicationsCount: 0, // TODO: implement applications tracking
        eligibilityTestsTaken: 0, // TODO: implement eligibility tests
        unreadNotifications: 0 // TODO: implement notifications
      }
    };

    logger.info(`Student profile retrieved: ${student.email}`);
    res.json({ 
      success: true, 
      profile: profileData,
      studentId: student._id
    });
  } catch (err) {
    logger.error('Get student profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Calculate profile completion percentage - Updated to match frontend logic
const calculateProfileCompletion = (student) => {
  const breakdown = {
    personal: 0,
    academic: 0,
    skills: 0,
    projects: 0,
    resume: 0
  };

  // Personal Info (25% weight)
  const personalFields = [
    student.name,
    student.phone,
    student.onboardingData?.personalInfo?.address,
    student.onboardingData?.personalInfo?.dateOfBirth
  ];
  const personalScore = Math.min(
    (personalFields.filter(field => field && field.toString().trim()).length / 4) * 25, 
    25
  );
  breakdown.personal = Math.round(personalScore);

  // Academic Info (30% weight)
  const academicFields = [
    student.branch,
    student.year,
    student.onboardingData?.academicInfo?.gpa,
    student.onboardingData?.academicInfo?.specialization
  ];
  const academicScore = Math.min(
    (academicFields.filter(field => field && field.toString().trim()).length / 4) * 30, 
    30
  );
  breakdown.academic = Math.round(academicScore);

  // Skills (10% weight)
  const hasSkills = student.onboardingData?.academicInfo?.skills?.length > 0;
  breakdown.skills = hasSkills ? 10 : 0;

  // Projects (10% weight)
  const hasProjects = student.onboardingData?.academicInfo?.projects?.length > 0;
  breakdown.projects = hasProjects ? 10 : 0;

  // Resume (25% weight)
  const hasResume = student.resumes && student.resumes.filter(r => r.isActive).length > 0;
  breakdown.resume = hasResume ? 25 : 0;

  const totalPercentage = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  logger.info(`Profile completion calculation for ${student.email}:`, {
    personal: breakdown.personal,
    academic: breakdown.academic,
    skills: breakdown.skills,
    projects: breakdown.projects,
    resume: breakdown.resume,
    total: totalPercentage
  });

  return {
    percentage: Math.round(totalPercentage),
    breakdown
  };
};

// Get completion status
export const getCompletionStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const completionStatus = calculateProfileCompletion(student);

    res.json({ 
      success: true, 
      completion: completionStatus
    });
  } catch (err) {
    logger.error('Get completion status error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update comprehensive student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const {
      basicInfo,
      academicInfo,
      placementInfo
    } = req.body;

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Update basic info
    if (basicInfo) {
      if (basicInfo.name) student.name = basicInfo.name;
      if (basicInfo.email) student.email = basicInfo.email;
      if (basicInfo.phone) student.phone = basicInfo.phone;
      
      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.personalInfo) student.onboardingData.personalInfo = {};
      
      if (basicInfo.gender) student.onboardingData.personalInfo.gender = basicInfo.gender;
      if (basicInfo.dateOfBirth) student.onboardingData.personalInfo.dateOfBirth = basicInfo.dateOfBirth;
      if (basicInfo.address) student.onboardingData.personalInfo.address = basicInfo.address;
    }

    // Update academic info
    if (academicInfo) {
      if (academicInfo.rollNumber) student.rollNumber = academicInfo.rollNumber;
      if (academicInfo.branch) student.branch = academicInfo.branch;
      if (academicInfo.section) student.section = academicInfo.section;
      if (academicInfo.year) student.year = academicInfo.year;
      
      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
      
      if (academicInfo.gpa) student.onboardingData.academicInfo.gpa = academicInfo.gpa;
      if (academicInfo.specialization) student.onboardingData.academicInfo.specialization = academicInfo.specialization;
    }

    // Update placement info
    if (placementInfo) {
      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.placementInfo) student.onboardingData.placementInfo = {};
      
      if (placementInfo.jobRole) student.onboardingData.placementInfo.jobRole = placementInfo.jobRole;
      if (placementInfo.preferredDomain) student.onboardingData.placementInfo.preferredDomain = placementInfo.preferredDomain;
      if (placementInfo.certifications) student.onboardingData.placementInfo.certifications = placementInfo.certifications;
      
      if (placementInfo.skills) student.onboardingData.academicInfo.skills = placementInfo.skills;
      if (placementInfo.projects) student.onboardingData.academicInfo.projects = placementInfo.projects;
    }

    await student.save();
    
    // Get updated completion status
    const completionStatus = calculateProfileCompletion(student);
    
    logger.success(`Student profile updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      completion: completionStatus
    });
  } catch (err) {
    logger.error('Update student profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add or update skills
export const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    
    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, error: 'Skills must be an array' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (!student.onboardingData) student.onboardingData = {};
    if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
    
    student.onboardingData.academicInfo.skills = skills;
    await student.save();
    
    const completionStatus = calculateProfileCompletion(student);
    
    logger.success(`Student skills updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: 'Skills updated successfully',
      skills: student.onboardingData.academicInfo.skills,
      completion: completionStatus
    });
  } catch (err) {
    logger.error('Update skills error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add or update projects
export const updateProjects = async (req, res) => {
  try {
    const { projects } = req.body;
    
    if (!Array.isArray(projects)) {
      return res.status(400).json({ success: false, error: 'Projects must be an array' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (!student.onboardingData) student.onboardingData = {};
    if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
    
    student.onboardingData.academicInfo.projects = projects;
    await student.save();
    
    const completionStatus = calculateProfileCompletion(student);
    
    logger.success(`Student projects updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: 'Projects updated successfully',
      projects: student.onboardingData.academicInfo.projects,
      completion: completionStatus
    });
  } catch (err) {
    logger.error('Update projects error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get student profile (legacy - for backward compatibility)
export const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password -loginOtp -loginOtpExpires');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (err) {
    logger.error('Get profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update student profile (legacy - for backward compatibility)
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, branch, section, rollNumber, year } = req.body;
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Update fields
    if (name) student.name = name;
    if (email) student.email = email;
    if (phone) student.phone = phone;
    if (branch) student.branch = branch;
    if (section) student.section = section;
    if (rollNumber) student.rollNumber = rollNumber;
    if (year) student.year = year;

    await student.save();
    
    logger.success(`Student profile updated: ${student.email}`);
    res.json({ success: true, message: 'Profile updated successfully', student });
  } catch (err) {
    logger.error('Update profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ATS analysis
export const atsAnalysis = async (req, res) => {
  try {
    // TODO: implement ATS analysis
    logger.info('ATS analysis requested');
    res.json({ success: true, result: [] });
  } catch (err) {
    logger.error('ATS analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
