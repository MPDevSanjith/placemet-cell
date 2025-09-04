// routes/resume.js
import express from 'express';
import multer from 'multer';
import cloudinaryService from '../utils/cloudinaryService.js';
import { authenticateToken, authorizeStudent, authorizeAdmin } from '../middleware/auth.js';
import Student from '../models/Student.js';
import Resume from '../models/Resume.js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { analyzeATS } from '../services/atsAnalysis.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer file filter:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Accept PDF, DOC, DOCX files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('✅ File accepted by multer filter');
      cb(null, true);
    } else {
      console.log('❌ File rejected by multer filter:', file.mimetype);
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

// Simple file save test route (without Cloudinary)
router.post('/test-save', upload.single('resume'), (req, res) => {
  try {
    console.log('🧪 Test save route hit');
    console.log('🔍 Request file:', req.file ? 'Present' : 'Missing');
    
    if (req.file) {
      console.log('🔍 File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'No buffer'
      });
      
      // Try to save file to disk to verify buffer is valid
      try {
        const uploadDir = path.join(process.cwd(), 'uploads', 'test');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const testFilePath = path.join(uploadDir, `test_${Date.now()}_${req.file.originalname}`);
        fs.writeFileSync(testFilePath, req.file.buffer);
        console.log('✅ Test file saved to disk:', testFilePath);
        
        // Clean up test file after 5 seconds
        setTimeout(() => {
          try {
            fs.unlinkSync(testFilePath);
            console.log('🧹 Test file cleaned up');
          } catch (cleanupError) {
            console.log('⚠️ Could not cleanup test file:', cleanupError.message);
          }
        }, 5000);
        
      } catch (saveError) {
        console.error('❌ Error saving test file:', saveError);
      }
      
      res.json({
        success: true,
        message: 'Test save successful',
        fileInfo: {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          bufferLength: req.file.buffer ? req.file.buffer.length : 0
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No file received'
      });
    }
  } catch (error) {
    console.error('❌ Test save error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Minimal test route to debug file upload
router.post('/debug-upload', (req, res) => {
  try {
    console.log('🧪 Debug upload route hit');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body type:', typeof req.body);
    console.log('🔍 Request body keys:', Object.keys(req.body || {}));
    console.log('🔍 Content-Type:', req.headers['content-type']);
    
    // Check if this is multipart/form-data
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      console.log('✅ Content-Type is multipart/form-data');
    } else {
      console.log('❌ Content-Type is NOT multipart/form-data');
    }
    
    res.json({
      success: true,
      message: 'Debug upload route hit',
      headers: req.headers,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type']
    });
  } catch (error) {
    console.error('❌ Debug upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check Cloudinary service status
router.get('/cloudinary-status', (req, res) => {
  try {
    const status = cloudinaryService.getConfigurationStatus();
    res.json({
      success: true,
      message: 'Cloudinary service status',
      status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Resume service is running',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /health',
      'GET /debug-auth',
      'GET /cloudinary-status',
      'GET /list',
      'POST /debug-upload',
      'POST /test-upload',
      'POST /test-save',
      'POST /upload'
    ]
  });
});

// Simple test route to verify file upload
router.post('/test-upload', upload.single('resume'), (req, res) => {
  try {
    console.log('🧪 Test upload route hit');
    console.log('🔍 Request file:', req.file ? 'Present' : 'Missing');
    
    if (req.file) {
      console.log('🔍 File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'No buffer'
      });
      
      // Try to save file to disk to verify buffer is valid
      try {
        const uploadDir = path.join(process.cwd(), 'uploads', 'test');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const testFilePath = path.join(uploadDir, `test_${Date.now()}_${req.file.originalname}`);
        fs.writeFileSync(testFilePath, req.file.buffer);
        console.log('✅ Test file saved to disk:', testFilePath);
        
        // Clean up test file
        setTimeout(() => {
          try {
            fs.unlinkSync(testFilePath);
            console.log('🧹 Test file cleaned up');
          } catch (cleanupError) {
            console.log('⚠️ Could not cleanup test file:', cleanupError.message);
          }
        }, 5000);
        
      } catch (saveError) {
        console.error('❌ Error saving test file:', saveError);
      }
      
      res.json({
        success: true,
        message: 'Test upload successful',
        fileInfo: {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          bufferLength: req.file.buffer ? req.file.buffer.length : 0
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No file received'
      });
    }
  } catch (error) {
    console.error('❌ Test upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug route to check authentication
router.get('/debug-auth', authenticateToken, (req, res) => {
  console.log('🔍 Debug Auth - Request user:', req.user);
  console.log('🔍 Debug Auth - Request headers:', req.headers);
  
  res.json({
    success: true,
    message: 'Authentication debug info',
    user: req.user,
    headers: {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type']
    }
  });
});

// Analyze resume with ATS
router.post('/analyze-ats', authenticateToken, authorizeStudent, async (req, res) => {
  try {
    const { resumeId, jobRole } = req.body || {};
    if (!resumeId) return res.status(400).json({ success: false, error: 'resumeId is required' });

    // Fetch resume doc and download the file from Cloudinary raw url
    const resumeDoc = await Resume.findById(resumeId);
    if (!resumeDoc) return res.status(404).json({ success: false, error: 'Resume not found' });

    // Download file buffer from Cloudinary using a signed URL to avoid access issues
    if (!resumeDoc.cloudinaryId) {
      return res.status(400).json({ success: false, error: 'Resume missing Cloudinary id' });
    }
    const fileUrl = await cloudinaryService.generateAutoDownloadUrl(
      resumeDoc.cloudinaryId,
      { signed: true, ttlSeconds: 900, attachment: resumeDoc.fileName || 'resume.pdf' }
    );
    const dl = await fetch(fileUrl);
    if (!dl.ok) {
      return res.status(400).json({ success: false, error: `Failed to fetch resume content (${dl.status} ${dl.statusText})` });
    }
    const fileBuffer = Buffer.from(await dl.arrayBuffer());

    // Run ATS analysis (Gemini-backed with fallback)
    const result = await analyzeATS(fileBuffer, resumeDoc.originalName || resumeDoc.fileName, resumeDoc.mimeType || 'application/pdf');

    // Persist analysis on resume
    const analysisData = {
      ...(result.data || {}),
      jobRole: jobRole || (result.data && result.data.jobRole) || 'Not specified'
    };

    await Resume.findByIdAndUpdate(resumeId, {
      $set: { atsAnalysis: analysisData, hasAtsAnalysis: true }
    });

    return res.json({ success: true, message: 'ATS analysis completed', atsAnalysis: analysisData });
  } catch (error) {
    console.error('❌ ATS analyze error:', error);
    return res.status(500).json({ success: false, error: 'ATS analysis failed' });
  }
});

// Get ATS analysis for a specific resume
router.get('/analysis/:id', authenticateToken, authorizeStudent, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Resume id is required' });

    const resumeDoc = await Resume.findById(id).lean();
    if (!resumeDoc) return res.status(404).json({ success: false, error: 'Resume not found' });

    // Ensure ownership
    if (String(resumeDoc.student) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this resume' });
    }

    if (!resumeDoc.hasAtsAnalysis || !resumeDoc.atsAnalysis) {
      return res.status(404).json({ success: false, error: 'ATS analysis not found' });
    }

    return res.json({ success: true, resume: { atsAnalysis: resumeDoc.atsAnalysis } });
  } catch (error) {
    console.error('❌ Get ATS analysis error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get ATS analysis' });
  }
});

// Get ATS analysis for active resume of the current student (fallback)
router.get('/analysis', authenticateToken, authorizeStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const doc = await Resume.findOne({ student: studentId, isActive: true, hasAtsAnalysis: true }).sort({ updatedAt: -1 }).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'ATS analysis not found' });

    return res.json({ success: true, resume: { atsAnalysis: doc.atsAnalysis } });
  } catch (error) {
    console.error('❌ Get ATS analysis (active) error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get ATS analysis' });
  }
});

// List current student's resumes
router.get('/list', authenticateToken, authorizeStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const docs = await Resume.find({ student: studentId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const resumes = docs.map(d => ({
      id: d._id.toString(),
      filename: d.fileName,
      originalName: d.originalName,
      size: d.size, // Include file size
      // signed short-lived URL to avoid auth issues
      cloudinaryUrl: cloudinaryService.generateSignedDownloadUrl(d.cloudinaryId, { ttlSeconds: 1800 }),
      // view URL for embedding (no forced download)
      viewUrl: cloudinaryService.generateViewUrl(d.cloudinaryId, 'image', 'pdf'),
      uploadDate: d.createdAt?.toISOString?.() || new Date().toISOString(),
      hasAtsAnalysis: !!d.hasAtsAnalysis
    }));

    res.json({ success: true, resumes });
  } catch (error) {
    console.error('❌ List resumes error:', error);
    res.status(500).json({ success: false, error: 'Failed to list resumes' });
  }
});

// Admin/Officer: Get active resume view URL for a student
router.get('/admin/student/:studentId/active-view', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });

    // Find latest active resume for the student
    const doc = await Resume.findOne({ student: studentId, isActive: true }).sort({ createdAt: -1 }).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Active resume not found for student' });

    if (!doc.cloudinaryId) return res.status(400).json({ success: false, error: 'Resume missing Cloudinary id' });

    // Generate view URL for inline viewing
    const url = cloudinaryService.generateViewUrl(doc.cloudinaryId, 'image', 'pdf');
    return res.json({ success: true, url, resume: { id: doc._id, originalName: doc.originalName, fileName: doc.fileName } });
  } catch (error) {
    console.error('❌ Admin get active resume view url error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get resume view url' });
  }
});

// Admin/Officer: List all resumes for a student with inline view URLs
router.get('/admin/student/:studentId/list', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ success: false, error: 'studentId is required' });

    const docs = await Resume.find({ student: studentId })
      .sort({ createdAt: -1 })
      .lean();

    const resumes = docs.map(d => ({
      id: d._id.toString(),
      fileName: d.fileName,
      originalName: d.originalName,
      size: d.size, // Include file size
      // signed short-lived URL to avoid auth issues
      cloudinaryUrl: cloudinaryService.generateSignedDownloadUrl(d.cloudinaryId, { ttlSeconds: 1800 }),
      // view URL for embedding (no forced download)
      viewUrl: cloudinaryService.generateViewUrl(d.cloudinaryId, 'image', 'pdf'),
      uploadDate: d.createdAt?.toISOString?.() || new Date().toISOString(),
      hasAtsAnalysis: !!d.hasAtsAnalysis
    }));

    return res.json({ success: true, resumes });
  } catch (error) {
    console.error('❌ Admin list student resumes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list resumes' });
  }
});

// Download a resume by id (force download)
router.get('/:id/download', authenticateToken, authorizeStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Resume id is required' });
    }

    const resumeDoc = await Resume.findById(id);
    if (!resumeDoc) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Ensure ownership
    if (String(resumeDoc.student) !== String(studentId)) {
      return res.status(403).json({ success: false, error: 'Not authorized to download this resume' });
    }

    if (!resumeDoc.cloudinaryId) {
      return res.status(400).json({ success: false, error: 'Resume missing Cloudinary id' });
    }

    // Generate short-lived signed URL with attachment filename
    const attachmentName = resumeDoc.fileName || resumeDoc.originalName || 'resume.pdf';
    const fileUrl = await cloudinaryService.generateAutoDownloadUrl(
      resumeDoc.cloudinaryId,
      { signed: true, ttlSeconds: 300, attachment: attachmentName }
    );

    // Stream the file through our server to set headers consistently
    const dl = await fetch(fileUrl);
    if (!dl.ok) {
      return res.status(400).json({ success: false, error: `Failed to fetch resume (${dl.status} ${dl.statusText})` });
    }

    const contentType = dl.headers.get('content-type') || (resumeDoc.mimeType || 'application/pdf');
    const contentLength = dl.headers.get('content-length') || resumeDoc.size;
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachmentName}"`);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Pipe the response body to the client
    if (dl.body && typeof dl.body.pipe === 'function') {
      dl.body.pipe(res);
    } else {
      const buffer = Buffer.from(await dl.arrayBuffer());
      res.send(buffer);
    }
  } catch (error) {
    console.error('❌ Download resume error:', error);
    return res.status(500).json({ success: false, error: 'Failed to download resume' });
  }
});

// Upload resume route
router.post('/upload', authenticateToken, authorizeStudent, upload.single('resume'), async (req, res) => {
  try {
    console.log('🚀 Resume upload request received');
    console.log('🔍 Request user:', req.user);
    console.log('🔍 Request file:', req.file ? 'Present' : 'Missing');
    console.log('🔍 Request body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Debug file object
    console.log('🔍 File object details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'No buffer',
      bufferType: req.file.buffer ? typeof req.file.buffer : 'No buffer'
    });

    // Get student information from authenticated user
    const studentId = req.user.id;
    const studentName = req.user.name;
    
    console.log('🔍 Extracted student info:', { studentId, studentName });
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID not found in authentication token' });
    }

    // Validate file buffer
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      console.error('❌ Invalid file buffer:', {
        hasBuffer: !!req.file.buffer,
        bufferType: typeof req.file.buffer,
        isBuffer: Buffer.isBuffer(req.file.buffer)
      });
      return res.status(400).json({ error: 'Invalid file format - buffer not found' });
    }

    // Validate file size
    if (req.file.size === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.' 
      });
    }

    console.log('✅ File validation passed, proceeding with upload');

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadResume(
      req.file,
      req.file.originalname,
      studentId,
      studentName,
      req.file.mimetype
    );

    console.log('✅ Cloudinary upload successful:', uploadResult);

    // Persist to DB
    const resumeDoc = await Resume.create({
      student: studentId,
      fileName: uploadResult.fileName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size, // Use actual file size from multer
      cloudinaryId: uploadResult.fileId,
      url: cloudinaryService.generateSignedDownloadUrl(uploadResult.fileId, { ttlSeconds: 3600 }),
      cloudinaryFolder: uploadResult.folder
    });

    // Optionally attach to Student
    try {
    await Student.findByIdAndUpdate(studentId, {
      $addToSet: { resumes: resumeDoc._id },
      $set: { 'activeResume.resumeId': resumeDoc._id, 'activeResume.lastUpdated': new Date() }
    });
    } catch {}

    // Map to frontend expected shape
    const resume = {
      id: resumeDoc._id.toString(),
      filename: resumeDoc.fileName,
      originalName: resumeDoc.originalName,
      cloudinaryUrl: resumeDoc.url,
      uploadDate: resumeDoc.createdAt?.toISOString?.() || uploadResult.uploadDate
    };

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume,
      data: uploadResult
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload resume'
    });
  }
});

// Delete a resume by id
router.delete('/:id', authenticateToken, authorizeStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Resume id is required' });
    }

    const resumeDoc = await Resume.findById(id);
    if (!resumeDoc) {
      return res.status(404).json({ success: false, error: 'Resume not found' });
    }

    // Ensure ownership
    if (String(resumeDoc.student) !== String(studentId)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this resume' });
    }

    // Delete from Cloudinary (best effort)
    try {
      if (resumeDoc.cloudinaryId) {
        await cloudinaryService.deleteFile(resumeDoc.cloudinaryId);
      }
    } catch (e) {
      console.warn('⚠️ Cloudinary delete warning:', e?.message || e);
    }

    // Remove from DB
    await Resume.deleteOne({ _id: id });

    // Detach from student
    try {
      await Student.findByIdAndUpdate(studentId, {
        $pull: { resumes: id },
        // If active resume was this one, clear it
        $unset: { activeResume: '' }
      });
    } catch {}

    return res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    console.error('❌ Delete resume error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete resume' });
  }
});

export default router;