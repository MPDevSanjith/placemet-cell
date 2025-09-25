import Student from '../models/Student.js';
import logger from '../utils/logger.js';

// Calculate profile completion percentage
const calculateProfileCompletion = (student) => {
  let completedFields = 0;
  let totalFields = 0;

  // Basic Info (5 fields)
  totalFields += 5;
  if (student.name) completedFields++;
  if (student.email) completedFields++;
  if (student.phone) completedFields++;
  if (student.onboardingData?.personalInfo?.address) completedFields++;
  if (student.onboardingData?.personalInfo?.gender) completedFields++;

  // Academic Info (6 fields)
  totalFields += 6;
  if (student.rollNumber) completedFields++;
  if (student.branch) completedFields++;
  if (student.section) completedFields++;
  if (student.year) completedFields++;
  if (student.onboardingData?.academicInfo?.gpa) completedFields++;
  if (student.onboardingData?.academicInfo?.specialization) completedFields++;

  // Skills and Projects (2 fields)
  totalFields += 2;
  if (student.onboardingData?.academicInfo?.skills?.length > 0) completedFields++;
  if (student.onboardingData?.academicInfo?.projects?.length > 0) completedFields++;

  // Resume (1 field)
  totalFields += 1;
  if (student.resumes?.length > 0) completedFields++;

  return Math.round((completedFields / totalFields) * 100);
};

// Get comprehensive student profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .select('-password -loginOtp -loginOtpExpires')
      .populate('resumes');

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    // Calculate profile completion percentage
    const profileCompletion = calculateProfileCompletion(student);

    // Normalize course values
    const normalizeCourse = (course) => {
      if (!course || typeof course !== 'string') return course;
      
      const normalized = course.trim().toLowerCase();
      
      // Common course mappings
      const courseMap = {
        'btech': 'B.Tech',
        'b.tech': 'B.Tech', 
        'be': 'BE',
        'bsc': 'BSc',
        'b.sc': 'BSc',
        'bca': 'BCA',
        'bcom': 'BCom',
        'b.com': 'BCom',
        'ba': 'BA',
        'mca': 'MCA',
        'msc': 'MSc',
        'm.sc': 'MSc',
        'mba': 'MBA',
        'm.tech': 'M.Tech',
        'mtech': 'M.Tech',
        'ma': 'MA',
        'diploma': 'Diploma',
        'phd': 'PhD',
        'ph.d': 'PhD',
        'other': 'Other'
      };
      
      return courseMap[normalized] || course.trim();
    };

    // Backfill course if only one copy exists
    try {
      const topLevelCourse = student.course;
      const nestedCourse = student.onboardingData?.academicInfo?.course;
      console.log('🛠️ BACKFILL CHECK:', { 
        studentId: student._id, 
        topLevelCourse, 
        nestedCourse, 
        'topLevel exists': !!topLevelCourse,
        'nested exists': !!nestedCourse 
      });
      
      if (nestedCourse && !topLevelCourse) {
        const normalizedCourse = normalizeCourse(nestedCourse);
        student.course = normalizedCourse;
        await student.save();
        console.log('🛠️ BACKFILL: Persisted top-level course from nested', { studentId: student._id, course: normalizedCourse });
      } else if (topLevelCourse && !nestedCourse) {
        if (!student.onboardingData) student.onboardingData = { personalInfo: {}, academicInfo: {}, placementInfo: {}, onboardingStep: 'pending' };
        if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
        const normalizedCourse = normalizeCourse(topLevelCourse);
        student.onboardingData.academicInfo.course = normalizedCourse;
        await student.save();
        console.log('🛠️ BACKFILL: Persisted nested course from top-level', { studentId: student._id, course: normalizedCourse });
      } else {
        console.log('🛠️ BACKFILL: No backfill needed - both or neither exist');
      }
    } catch (bfErr) {
      console.warn('Course backfill skipped:', bfErr?.message);
    }

    // Get latest resume
    const latestResume = student.resumes
      ?.filter(r => r.isActive)
      ?.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0];

    // Debug course data
    console.log('🔍 BACKEND COURSE DEBUG:', {
      studentId: student._id,
      topLevelCourse: student.course,
      nestedCourse: student.onboardingData?.academicInfo?.course,
      fullStudent: {
        course: student.course,
        onboardingData: student.onboardingData
      }
    });
    
    // More detailed debugging
    console.log('🔍 DETAILED COURSE DEBUG:', {
      studentId: student._id,
      'student.course': student.course,
      'typeof student.course': typeof student.course,
      'student.course === undefined': student.course === undefined,
      'student.course === null': student.course === null,
      'student.course === ""': student.course === "",
      'onboardingData exists': !!student.onboardingData,
      'academicInfo exists': !!student.onboardingData?.academicInfo,
      'nested course': student.onboardingData?.academicInfo?.course,
      'typeof nested course': typeof student.onboardingData?.academicInfo?.course,
      'nested course === undefined': student.onboardingData?.academicInfo?.course === undefined
    });

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
        course: student.course || student.onboardingData?.academicInfo?.course,
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
        uploadDate: latestResume.uploadDate,
        size: latestResume.size,
        hasAtsAnalysis: !!latestResume.atsAnalysis
      } : null,
      status: {
        profileCompletion,
        onboardingCompleted: student.onboardingCompleted,
        lastUpdated: student.updatedAt
      }
    };

    logger.success(`Student profile retrieved: ${student.email}`);
    res.json({ 
      success: true, 
      profile: profileData 
    });

  } catch (err) {
    logger.error('Get student profile error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Update student profile (comprehensive)
export const updateStudentProfile = async (req, res) => {
  try {
    const {
      basicInfo,
      academicInfo,
      placementInfo
    } = req.body;

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    // Update basic info
    if (basicInfo) {
      if (basicInfo.name !== undefined) student.name = basicInfo.name;
      if (basicInfo.phone !== undefined) student.phone = basicInfo.phone;
      
      // Initialize onboarding data if not exists
      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.personalInfo) student.onboardingData.personalInfo = {};
      
      if (basicInfo.gender !== undefined) student.onboardingData.personalInfo.gender = basicInfo.gender;
      if (basicInfo.dateOfBirth !== undefined) student.onboardingData.personalInfo.dateOfBirth = basicInfo.dateOfBirth;
      if (basicInfo.address !== undefined) student.onboardingData.personalInfo.address = basicInfo.address;
    }

    // Update academic info
    if (academicInfo) {
      if (academicInfo.rollNumber !== undefined) student.rollNumber = academicInfo.rollNumber;
      if (academicInfo.branch !== undefined) student.branch = academicInfo.branch;
      if (academicInfo.section !== undefined) student.section = academicInfo.section;
      if (academicInfo.year !== undefined) student.year = academicInfo.year;
      
      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
      
      if (academicInfo.gpa !== undefined) student.onboardingData.academicInfo.gpa = academicInfo.gpa;
      if (academicInfo.specialization !== undefined) student.onboardingData.academicInfo.specialization = academicInfo.specialization;
    }

    // Update placement info
    if (placementInfo) {
      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.placementInfo) student.onboardingData.placementInfo = {};
      
      if (placementInfo.jobRole !== undefined) student.onboardingData.placementInfo.jobRole = placementInfo.jobRole;
      if (placementInfo.preferredDomain !== undefined) student.onboardingData.placementInfo.preferredDomain = placementInfo.preferredDomain;
      if (placementInfo.certifications !== undefined) student.onboardingData.placementInfo.certifications = placementInfo.certifications;
      
      if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
      if (placementInfo.skills !== undefined) student.onboardingData.academicInfo.skills = placementInfo.skills;
      if (placementInfo.projects !== undefined) student.onboardingData.academicInfo.projects = placementInfo.projects;
    }

    await student.save();
    
    // Get updated completion status
    const profileCompletion = calculateProfileCompletion(student);
    
    logger.success(`Student profile updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profileCompletion
    });

  } catch (err) {
    logger.error('Update student profile error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Update specific field in profile
export const updateProfileField = async (req, res) => {
  try {
    const { field, value } = req.body;
    
    if (!field) {
      return res.status(400).json({ 
        success: false, 
        error: 'Field is required' 
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    // Map field names to their locations in the schema
    const fieldMappings = {
      // Basic info fields
      'name': () => { student.name = value; },
      'phone': () => { student.phone = value; },
      'address': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.personalInfo) student.onboardingData.personalInfo = {};
        student.onboardingData.personalInfo.address = value;
      },
      'gender': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.personalInfo) student.onboardingData.personalInfo = {};
        student.onboardingData.personalInfo.gender = value;
      },
      'dateOfBirth': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.personalInfo) student.onboardingData.personalInfo = {};
        student.onboardingData.personalInfo.dateOfBirth = value;
      },
      
      // Academic info fields
      'rollNumber': () => { student.rollNumber = value; },
      'branch': () => { student.branch = value; },
      'section': () => { student.section = value; },
      'course': () => { student.course = value; },
      'year': () => { student.year = value; },
      'gpa': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
        student.onboardingData.academicInfo.gpa = value;
      },
      'course': () => {
        // Set both top-level course and nested academicInfo.course for consistency
        student.course = value;
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
        student.onboardingData.academicInfo.course = value;
      },
      'specialization': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
        student.onboardingData.academicInfo.specialization = value;
      },
      
      // Skills and projects
      'skills': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
        student.onboardingData.academicInfo.skills = Array.isArray(value) ? value : [];
      },
      'projects': () => {
        if (!student.onboardingData) student.onboardingData = {};
        if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
        student.onboardingData.academicInfo.projects = Array.isArray(value) ? value : [];
      }
    };

    // Check if field is supported
    if (!fieldMappings[field]) {
      return res.status(400).json({ 
        success: false, 
        error: `Field '${field}' is not supported` 
      });
    }

    // Update the field
    fieldMappings[field]();

    await student.save();
    
    // Get updated completion status
    const profileCompletion = calculateProfileCompletion(student);
    
    logger.success(`Student profile field '${field}' updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: `Field '${field}' updated successfully`,
      field,
      value,
      profileCompletion
    });

  } catch (err) {
    logger.error('Update profile field error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get profile completion status
export const getProfileCompletion = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    const profileCompletion = calculateProfileCompletion(student);
    
    res.json({ 
      success: true, 
      profileCompletion,
      onboardingCompleted: student.onboardingCompleted
    });

  } catch (err) {
    logger.error('Get profile completion error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Update skills specifically
export const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;
    
    if (!Array.isArray(skills)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Skills must be an array' 
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    if (!student.onboardingData) student.onboardingData = {};
    if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
    
    student.onboardingData.academicInfo.skills = skills;
    await student.save();
    
    const profileCompletion = calculateProfileCompletion(student);
    
    logger.success(`Student skills updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: 'Skills updated successfully',
      skills: student.onboardingData.academicInfo.skills,
      profileCompletion
    });

  } catch (err) {
    logger.error('Update skills error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Update projects specifically
export const updateProjects = async (req, res) => {
  try {
    const { projects } = req.body;
    
    if (!Array.isArray(projects)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Projects must be an array' 
      });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      });
    }

    if (!student.onboardingData) student.onboardingData = {};
    if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
    
    student.onboardingData.academicInfo.projects = projects;
    await student.save();
    
    const profileCompletion = calculateProfileCompletion(student);
    
    logger.success(`Student projects updated: ${student.email}`);
    res.json({ 
      success: true, 
      message: 'Projects updated successfully',
      projects: student.onboardingData.academicInfo.projects,
      profileCompletion
    });

  } catch (err) {
    logger.error('Update projects error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};
