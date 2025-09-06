import Student from '../models/Student.js';
import logger from '../utils/logger.js';

class ProfileService {
  // Calculate profile completion percentage
  static calculateProfileCompletion(student) {
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
  }

  // Get student profile with completion status
  static async getStudentProfile(studentId) {
    try {
      const student = await Student.findById(studentId)
        .select('-password -loginOtp -loginOtpExpires')
        .populate('resumes');

      if (!student) {
        throw new Error('Student not found');
      }

      const profileCompletion = this.calculateProfileCompletion(student);

      // Get latest resume
      const latestResume = student.resumes
        ?.filter(r => r.isActive)
        ?.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0];

      return {
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
    } catch (error) {
      logger.error('ProfileService.getStudentProfile error:', error);
      throw error;
    }
  }

  // Update student profile
  static async updateStudentProfile(studentId, updateData) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const { basicInfo, academicInfo, placementInfo } = updateData;

      // Update basic info
      if (basicInfo) {
        if (basicInfo.name !== undefined) student.name = basicInfo.name;
        if (basicInfo.phone !== undefined) student.phone = basicInfo.phone;
        
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
      
      const profileCompletion = this.calculateProfileCompletion(student);
      
      return {
        profileCompletion,
        updatedFields: Object.keys(updateData)
      };
    } catch (error) {
      logger.error('ProfileService.updateStudentProfile error:', error);
      throw error;
    }
  }

  // Update specific field
  static async updateProfileField(studentId, field, value) {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const fieldMappings = {
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
        'rollNumber': () => { student.rollNumber = value; },
        'branch': () => { student.branch = value; },
        'section': () => { student.section = value; },
        'year': () => { student.year = value; },
        'gpa': () => {
          if (!student.onboardingData) student.onboardingData = {};
          if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
          student.onboardingData.academicInfo.gpa = value;
        },
        'specialization': () => {
          if (!student.onboardingData) student.onboardingData = {};
          if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
          student.onboardingData.academicInfo.specialization = value;
        },
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

      if (!fieldMappings[field]) {
        throw new Error(`Field '${field}' is not supported`);
      }

      fieldMappings[field]();
      await student.save();
      
      const profileCompletion = this.calculateProfileCompletion(student);
      
      return {
        field,
        value,
        profileCompletion
      };
    } catch (error) {
      logger.error('ProfileService.updateProfileField error:', error);
      throw error;
    }
  }

  // Update skills
  static async updateSkills(studentId, skills) {
    try {
      if (!Array.isArray(skills)) {
        throw new Error('Skills must be an array');
      }

      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
      
      student.onboardingData.academicInfo.skills = skills;
      await student.save();
      
      const profileCompletion = this.calculateProfileCompletion(student);
      
      return {
        skills: student.onboardingData.academicInfo.skills,
        profileCompletion
      };
    } catch (error) {
      logger.error('ProfileService.updateSkills error:', error);
      throw error;
    }
  }

  // Update projects
  static async updateProjects(studentId, projects) {
    try {
      if (!Array.isArray(projects)) {
        throw new Error('Projects must be an array');
      }

      const student = await Student.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.onboardingData) student.onboardingData = {};
      if (!student.onboardingData.academicInfo) student.onboardingData.academicInfo = {};
      
      student.onboardingData.academicInfo.projects = projects;
      await student.save();
      
      const profileCompletion = this.calculateProfileCompletion(student);
      
      return {
        projects: student.onboardingData.academicInfo.projects,
        profileCompletion
      };
    } catch (error) {
      logger.error('ProfileService.updateProjects error:', error);
      throw error;
    }
  }
}

export default ProfileService;
