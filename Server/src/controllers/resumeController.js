// ==========================
// controllers/resumeController.js
// ==========================

import multer from 'multer';
import Student from '../models/Student.js';
import Resume from '../models/Resume.js';
import cloudinaryService from '../utils/cloudinaryService.js';
import geminiClient from '../utils/geminiClient.js';
import logger from '../utils/logger.js';
import fetch from 'node-fetch';

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF and Word documents
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.includes('word') || 
        file.mimetype.includes('docx')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
});

// Upload resume with Cloudinary integration
export const uploadResume = async (req, res) => {
  try {
    // Use multer middleware
    upload.single('resume')(req, res, async (err) => {
      if (err) {
        logger.error('File upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { file } = req;
      const studentId = req.user.id;

      // Validate file size
      if (file.size > 1 * 1024 * 1024) { // 1MB limit
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum allowed size is 1MB. Please compress your resume and try again.'
        });
      }

      logger.info(`Resume upload started for student ${studentId}: ${file.originalname}`);

      try {
        // Get student details
        const student = await Student.findById(studentId);
        if (!student) {
          return res.status(404).json({
            success: false,
            error: 'Student not found'
          });
        }

        // Extract student name safely
        let studentName = 'Unknown';
        try {
          if (student.basicInfo && student.basicInfo.name) {
            studentName = student.basicInfo.name;
          } else if (student.name) {
            studentName = student.name;
          }
        } catch (nameError) {
          logger.warn(`Could not extract student name for ${studentId}, using default`);
          studentName = 'Unknown';
        }

        // Check resume count limit (max 2 resumes per student)
        const existingResumeCount = await Resume.countDocuments({ student: studentId });
        if (existingResumeCount >= 2) {
          return res.status(400).json({
            success: false,
            error: 'Maximum resume limit reached. You can only upload 2 resumes. Please delete an existing resume before uploading a new one.'
          });
        }

        logger.info(`Resume count check: ${existingResumeCount}/2 resumes for student ${studentId}`);

        // Upload to Cloudinary
        let cloudinaryResult;
        try {
          cloudinaryResult = await cloudinaryService.uploadResume(
            file.buffer,
            file.originalname,
            studentId,
            studentName,
            file.mimetype
          );
        } catch (cloudinaryError) {
          logger.error(`Cloudinary upload failed for student ${studentId}:`, cloudinaryError.message);
          
          return res.status(500).json({
            success: false,
            error: `Cloudinary upload failed: ${cloudinaryError.message}`,
            details: 'Please check Cloudinary configuration or try again later.'
          });
        }

        // Create new Resume document
        const newResume = new Resume({
          student: studentId,
          fileName: cloudinaryResult.fileName,
          cloudinaryId: cloudinaryResult.cloudinaryId,
          url: cloudinaryResult.cloudinaryUrl, // Fixed: use cloudinaryUrl instead of url
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          cloudinaryFolder: cloudinaryResult.cloudinaryFolder // Fixed: use cloudinaryFolder instead of folder
        });

        // Save the resume
        await newResume.save();

        // Add resume reference to student's profile
        if (!student.resumes) {
          student.resumes = [];
        }
        student.resumes.push(newResume._id);
        await student.save();

        logger.info(`✅ Resume uploaded successfully for student ${studentId}: ${file.originalname}`);

        res.status(201).json({
          success: true,
          message: 'Resume uploaded successfully',
          resume: {
            id: newResume._id,
            filename: newResume.fileName, // Frontend expects 'filename' not 'fileName'
            originalName: newResume.originalName,
            cloudinaryUrl: newResume.url, // Frontend expects cloudinaryUrl
            cloudinaryId: newResume.cloudinaryId,
            size: newResume.size,
            uploadDate: newResume.createdAt
          }
        });

      } catch (error) {
        logger.error(`❌ Resume upload failed for student ${studentId}:`, error);
        res.status(500).json({
          success: false,
          error: 'Failed to save resume data',
          details: error.message
        });
      }
    });
  } catch (error) {
    logger.error('❌ Resume upload controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }

  // Helper method to get resume buffer from Cloudinary
  async getResumeBuffer(cloudinaryId) {
    try {
      // Generate a signed URL for the resume
      const resumeUrl = cloudinaryService.generateSignedDownloadUrl(cloudinaryId, { ttlSeconds: 300 });
      
      // Fetch the resume file
      const response = await fetch(resumeUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch resume: ${response.status} ${response.statusText}`);
      }
      
      // Convert to buffer
      const buffer = await response.buffer();
      return buffer;
      
    } catch (error) {
      logger.error('Failed to get resume buffer:', error);
      return null;
    }
  }
};

// Analyze resume with ATS
export const analyzeResumeATS = async (req, res) => {
  try {
    const { resumeId, jobRole } = req.body;
    const studentId = req.user.id;

    if (!resumeId || !jobRole) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID and job role are required'
      });
    }

    logger.info(`🔍 Starting ATS analysis for resume ${resumeId}, role: ${jobRole}`);

    // Find the resume
    const resume = await Resume.findOne({ _id: resumeId, student: studentId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Get student details for context
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    try {
      // Get the resume file from Cloudinary for analysis
      const resumeBuffer = await this.getResumeBuffer(resume.cloudinaryId);
      
      if (!resumeBuffer) {
        throw new Error('Failed to retrieve resume file for analysis');
      }

      // Analyze with ATS using enhanced Gemini client
      const atsAnalysis = await geminiClient.analyzeResumeATS(
        resumeBuffer, 
        resume.mimeType, 
        resume.originalName, 
        jobRole
      );

      // Update resume with ATS analysis
      resume.atsAnalysis = atsAnalysis;
      resume.hasAtsAnalysis = true;
      await resume.save();

      logger.info(`✅ ATS analysis completed for resume ${resumeId}`);

      res.json({
        success: true,
        message: 'ATS analysis completed successfully',
        atsAnalysis: atsAnalysis
      });

    } catch (analysisError) {
      logger.error(`❌ ATS analysis failed for resume ${resumeId}:`, analysisError);
      
      res.status(500).json({
        success: false,
        error: 'ATS analysis failed',
        details: analysisError.message
      });
    }

  } catch (error) {
    logger.error('❌ ATS analysis controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Get resume ATS analysis
export const getResumeAnalysis = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const studentId = req.user.id;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required'
      });
    }

    // Find the resume with ATS analysis
    const resume = await Resume.findOne({ _id: resumeId, student: studentId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    if (!resume.hasAtsAnalysis) {
      return res.status(404).json({
        success: false,
        error: 'No ATS analysis available for this resume'
      });
    }

    res.json({
      success: true,
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        originalName: resume.originalName,
        atsAnalysis: resume.atsAnalysis,
        hasAtsAnalysis: resume.hasAtsAnalysis
      }
    });

  } catch (error) {
    logger.error('❌ Get resume analysis controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// List all resumes for a student
export const listResumes = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all resumes for the student
    const resumes = await Resume.find({ student: studentId, isActive: true })
      .sort({ createdAt: -1 });

    // Map to frontend format
    const formattedResumes = resumes.map(resume => ({
      id: resume._id,
      filename: resume.fileName,
      originalName: resume.originalName,
      cloudinaryUrl: resume.url,
      cloudinaryId: resume.cloudinaryId,
      size: resume.size,
      uploadDate: resume.createdAt,
      hasAtsAnalysis: resume.hasAtsAnalysis,
      atsAnalysis: resume.atsAnalysis
    }));

    res.json({
      success: true,
      resumes: formattedResumes
    });

  } catch (error) {
    logger.error('❌ List resumes controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Delete a resume
export const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const studentId = req.user.id;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required'
      });
    }

    // Find the resume
    const resume = await Resume.findOne({ _id: resumeId, student: studentId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinaryService.deleteFile(resume.cloudinaryId);
      logger.info(`✅ Resume deleted from Cloudinary: ${resume.cloudinaryId}`);
    } catch (cloudinaryError) {
      logger.warn(`⚠️ Failed to delete from Cloudinary: ${cloudinaryError.message}`);
      // Continue with database deletion even if Cloudinary fails
    }

    // Remove from student's resumes array
    await Student.findByIdAndUpdate(studentId, {
      $pull: { resumes: resumeId }
    });

    // Delete the resume document
    await Resume.findByIdAndDelete(resumeId);

    logger.info(`✅ Resume deleted successfully: ${resumeId}`);

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    logger.error('❌ Delete resume controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
