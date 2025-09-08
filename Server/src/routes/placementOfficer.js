import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { Readable } from 'stream';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Import MongoDB models
import Student from '../models/Student.js';
import User from '../models/User.js';

// Import email service
import { sendEmail, emailTemplates } from '../email/email.js';

const router = express.Router();

// Configure multer for CSV upload (memory storage for serverless/Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Generate secure password
const generatePassword = (name, rollNumberOrSeed) => {
  // Create a simple 4-5 digit password
  const numbers = Math.floor(Math.random() * 90000) + 10000; // 5 digits (10000-99999)
  const specialChars = '@#$%&*';
  const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Format: First 2 letters of name + 5 digits + special char
  return `${name.slice(0, 2).toUpperCase()}${numbers}${randomChar}`;
};

// Validate CSV data
const validateCSVData = (data) => {
  const errors = [];
  
  if (!data.name || !data.email) {
    errors.push('Missing required fields: name, email');
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push(`Invalid email format: ${data.email}`);
  }
  
  // Make branch and year optional
  if (!data.branch) {
    data.branch = 'Not Specified';
  }
  
  if (!data.year) {
    data.year = new Date().getFullYear().toString();
  }
  
  return errors;
};

// Send welcome email to student
const sendWelcomeEmail = async (email, password, name) => {
  const mailOptions = emailTemplates.welcomeStudent(name, email, password);
  return await sendEmail(mailOptions);
};

// Send welcome emails in bulk
router.post('/send-welcome-emails', async (req, res) => {
  try {
    const { studentIds, students, emails } = req.body || {};

    // Case 1: Direct list of students with credentials
    if (Array.isArray(students) && students.length > 0) {
      const results = [];
      for (const s of students) {
        if (!s.email || !s.password) {
          results.push({ email: s?.email || 'unknown', status: 'failed', error: 'email and password required' });
          continue;
        }
        try {
          await sendWelcomeEmail(s.email, s.password, s.name || 'Student');
          results.push({ email: s.email, status: 'sent' });
        } catch (err) {
          results.push({ email: s.email, status: 'failed', error: err.message });
        }
      }
      return res.json({ success: true, results });
    }

    // Case 2: Only studentIds provided – generate a temporary password and email it
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const results = [];
      for (const id of studentIds) {
        try {
          const student = await Student.findById(id);
          if (!student) {
            results.push({ id, status: 'failed', error: 'Student not found' });
            continue;
          }

          // Generate a fresh temporary password, set it, save (hashing handled by pre-save hook)
          const tempPassword = generatePassword(student.name || 'ST', student.rollNumber || '00');
          student.password = tempPassword;
          await student.save();

          await sendWelcomeEmail(student.email, tempPassword, student.name || 'Student');
          results.push({ id, email: student.email, status: 'sent' });
        } catch (err) {
          results.push({ id, status: 'failed', error: err.message });
        }
      }
      return res.json({ success: true, results });
    }

    // Case 3: Emails array provided – look up students by email, generate temp password and email it
    if (Array.isArray(emails) && emails.length > 0) {
      const results = [];
      for (const email of emails) {
        try {
          const student = await Student.findOne({ email: String(email).toLowerCase() });
          if (!student) {
            results.push({ email, status: 'failed', error: 'Student not found' });
            continue;
          }
          const tempPassword = generatePassword(student.name || 'ST', student.rollNumber || '00');
          student.password = tempPassword;
          await student.save();
          await sendWelcomeEmail(student.email, tempPassword, student.name || 'Student');
          results.push({ email: student.email, status: 'sent' });
        } catch (err) {
          results.push({ email, status: 'failed', error: err.message });
        }
      }
      return res.json({ success: true, results });
    }

    return res.status(400).json({ success: false, error: 'Provide students[] or studentIds[]' });
  } catch (error) {
    console.error('Send welcome emails error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register another placement officer
router.post('/create-officer', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    const password = generatePassword(name, '99');

    // Create user
    const user = new User({
      name,
      email: String(email).toLowerCase(),
      password,
      role: 'placement_officer'
    });

    await user.save();

    // Send welcome email
    await sendWelcomeEmail(email, password, name);

    res.json({
      success: true,
      message: 'Placement officer created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Create officer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upload students from CSV
router.post('/bulk-upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    const createdStudents = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each row
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2; // +2 because CSV starts at row 2 (row 1 is header)

      try {
        // Validate data
        const validationErrors = validateCSVData(row);
        if (validationErrors.length > 0) {
          errors.push(`Row ${rowNumber}: ${validationErrors.join(', ')}`);
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ 
          email: String(row.email).toLowerCase() 
        });

        if (existingStudent) {
          errors.push(`Row ${rowNumber}: Student with email ${row.email} already exists`);
          continue;
        }

        // Generate password
        const password = generatePassword(row.name, row.rollNumber || '123');

        // Create student
        const student = new Student({
          name: row.name,
          email: String(row.email).toLowerCase(),
          password,
          branch: row.branch,
          year: row.year,
          phone: row.phone || '',
          cgpa: row.cgpa ? parseFloat(row.cgpa) : null
        });

        await student.save();
        createdStudents.push({
          name: student.name,
          email: student.email,
          password
        });

        // Send welcome email
        await sendWelcomeEmail(student.email, password, student.name);

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    // No file cleanup needed for memory storage

    res.json({
      success: true,
      message: `Bulk upload completed. ${createdStudents.length} students created.`,
      created: createdStudents.length,
      errors: errors.length > 0 ? errors : null,
      students: createdStudents
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    
    // No file cleanup needed for memory storage

    res.status(500).json({ success: false, error: error.message });
  }
});

// (Deprecated) Legacy list endpoint removed in favor of filtered listing below

// Get student by ID
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password -loginOtpCode -loginOtpExpires');
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student
router.put('/students/:id', async (req, res) => {
  try {
    const { name, email, branch, year, phone, cgpa } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Update fields if provided
    if (name) student.name = name;
    if (email) student.email = String(email).toLowerCase();
    if (branch) student.branch = branch;
    if (year) student.year = year;
    if (phone !== undefined) student.phone = phone;
    if (cgpa !== undefined) student.cgpa = cgpa;

    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        year: student.year,
        phone: student.phone,
        cgpa: student.cgpa
      }
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const completedOnboarding = await Student.countDocuments({ onboardingCompleted: true });
    const studentsWithResumes = await Student.countDocuments({ 'resumes.0': { $exists: true } });

    res.json({
      success: true,
      stats: {
        totalStudents,
        completedOnboarding,
        studentsWithResumes,
        pendingOnboarding: totalStudents - completedOnboarding
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student by email
router.get('/student-by-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const student = await Student.findOne({ email: String(email).toLowerCase() }).select('-password -loginOtp -loginOtpExpires');
    
    res.json({
      success: true,
      exists: !!student,
      student: student || null
    });

  } catch (error) {
    console.error('Get student by email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List students with filters and search
router.get('/students', async (req, res) => {
  try {
    const {
      q,
      batch,
      course,
      year,
      department,
      section,
      rollNumber,
      placed,
      blocked,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: String(q), $options: 'i' } },
        { email: { $regex: String(q), $options: 'i' } },
        { rollNumber: { $regex: String(q), $options: 'i' } }
      ];
    }
    if (batch) filter.year = String(batch);
    if (course) filter.course = String(course);
    if (year) filter.year = String(year);
    if (department) filter.branch = String(department);
    if (section) filter.section = String(section);
    if (rollNumber) filter.rollNumber = { $regex: String(rollNumber), $options: 'i' };
    if (placed !== undefined) filter.isPlaced = String(placed).toLowerCase() === 'true';
    if (blocked !== undefined) filter.isActive = !(String(blocked).toLowerCase() === 'true');

    const pageNum = Math.max(parseInt(String(page)), 1);
    const pageSize = Math.min(Math.max(parseInt(String(limit)), 1), 100);

    const listQuery = Student.find(filter)
      .select('-password -loginOtp -loginOtpExpires')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const [items, total, placedCount, blockedCount, activeCount] = await Promise.all([
      String(limit).toLowerCase() === 'all' ? Student.find(filter).select('-password -loginOtp -loginOtpExpires').sort({ createdAt: -1 }).lean() : listQuery,
      Student.countDocuments(filter),
      Student.countDocuments({ ...filter, isPlaced: true }),
      Student.countDocuments({ ...filter, isActive: false }),
      Student.countDocuments({ ...filter, isActive: true })
    ]);

    res.json({
      success: true,
      items,
      total,
      page: pageNum,
      limit: String(limit).toLowerCase() === 'all' ? items.length : pageSize,
      metrics: {
        total,
        placed: placedCount,
        blocked: blockedCount,
        active: activeCount
      }
    });
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk actions: block/unblock, place/unplace
router.post('/students/bulk', async (req, res) => {
  try {
    const { action, ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    if (!['block','unblock','place','unplace'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    let update = {};
    if (action === 'block') update = { isActive: false };
    if (action === 'unblock') update = { isActive: true };
    if (action === 'place') update = { isPlaced: true };
    if (action === 'unplace') update = { isPlaced: false };

    const result = await Student.updateMany({ _id: { $in: ids } }, { $set: update });
    res.json({ success: true, updated: result.modifiedCount || result.nModified || 0 });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create student manually
router.post('/create-student', async (req, res) => {
  try {
    const { name, email, branch, section, rollNumber, phone, year } = req.body;
    
    if (!name || !email || !branch || !rollNumber) {
      return res.status(400).json({ success: false, error: 'Name, email, branch, and roll number are required' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email: String(email).toLowerCase() });
    if (existingStudent) {
      return res.status(409).json({ success: false, error: 'Student with this email already exists' });
    }

    // Generate password
    const password = generatePassword(name, rollNumber);

    // Create student
    const student = new Student({
      name,
      email: String(email).toLowerCase(),
      password,
      branch,
      section: section || 'Not Specified',
      rollNumber,
      phone: phone || '',
      year: year || new Date().getFullYear().toString()
    });

    await student.save();

    // Send welcome email
    await sendWelcomeEmail(student.email, password, student.name);

    res.json({
      success: true,
      message: 'Student created successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        section: student.section,
        rollNumber: student.rollNumber,
        phone: student.phone,
        year: student.year
      },
      password
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upload biodata from CSV
router.post('/bulk-biodata', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    const successful = [];
    const failed = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each row
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowNumber = i + 2; // +2 because CSV starts at row 2 (row 1 is header)

      try {
        // Validate required fields
        if (!row.name || !row.email || !row.branch || !row.rollnumber) {
          errors.push(`Row ${rowNumber}: Missing required fields (name, email, branch, roll number)`);
          failed.push({
            email: row.email || 'Unknown',
            status: 'failed',
            error: 'Missing required fields'
          });
          continue;
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push(`Row ${rowNumber}: Invalid email format`);
          failed.push({
            email: row.email,
            status: 'failed',
            error: 'Invalid email format'
          });
          continue;
        }

        // Find existing student
        const student = await Student.findOne({ email: String(row.email).toLowerCase() });
        if (!student) {
          errors.push(`Row ${rowNumber}: Student with email ${row.email} not found`);
          failed.push({
            email: row.email,
            status: 'failed',
            error: 'Student not found'
          });
          continue;
        }

        // Update student with biodata
        student.name = row.name;
        student.branch = row.branch;
        student.section = row.section || student.section || 'Not Specified';
        student.rollNumber = row.rollnumber;
        student.phone = row.phone || student.phone || '';
        student.year = row.year || student.year || new Date().getFullYear().toString();

        // Initialize onboarding data if not exists
        if (!student.onboardingData) {
          student.onboardingData = {
            personalInfo: {},
            academicInfo: {},
            placementInfo: {}
          };
        }

        // Update personal info
        if (row.gender) {
          student.onboardingData.personalInfo.gender = row.gender;
        }
        if (row.dateofbirth || row.dob || row.birth) {
          student.onboardingData.personalInfo.dateOfBirth = row.dateofbirth || row.dob || row.birth;
        }
        if (row.address) {
          student.onboardingData.personalInfo.address = row.address;
        }

        // Update academic info
        if (row.gpa || row.cgpa) {
          student.onboardingData.academicInfo.gpa = parseFloat(row.gpa || row.cgpa);
        }
        if (row.specialization || row.special) {
          student.onboardingData.academicInfo.specialization = row.specialization || row.special;
        }
        if (row.skills) {
          student.onboardingData.academicInfo.skills = row.skills.split(';').map(s => s.trim()).filter(s => s);
        }
        if (row.projects) {
          student.onboardingData.academicInfo.projects = row.projects.split(';').map(p => p.trim()).filter(p => p);
        }

        // Add eligibility criteria
        if (!student.eligibilityCriteria) {
          student.eligibilityCriteria = {};
        }
        if (row.attendance) {
          student.eligibilityCriteria.attendancePercentage = parseFloat(row.attendance);
        }
        if (row.backlog || row.backlogs) {
          student.eligibilityCriteria.backlogs = parseInt(row.backlog || row.backlogs);
        }
        if (row.academic || row.requirement) {
          student.eligibilityCriteria.academicRequirements = row.academic || row.requirement;
        }
        if (row.eligibility || row.other) {
          student.eligibilityCriteria.otherEligibility = row.eligibility || row.other;
        }

        // Update comprehensive biodata fields from CSV
        if (row.bloodgroup) student.bloodGroup = row.bloodgroup;
        if (row.height) student.height = parseInt(row.height);
        if (row.weight) student.weight = parseInt(row.weight);
        if (row.nationality) student.nationality = row.nationality;
        if (row.religion) student.religion = row.religion;
        if (row.caste) student.caste = row.caste;
        if (row.category) student.category = row.category;
        
        // Family Information
        if (row.parentname) student.parentName = row.parentname;
        if (row.parentphone) student.parentPhone = row.parentphone;
        if (row.parentoccupation) student.parentOccupation = row.parentoccupation;
        if (row.familyincome) student.familyIncome = parseInt(row.familyincome);
        
        // Academic History
        if (row.tenthpercentage) student.tenthPercentage = parseFloat(row.tenthpercentage);
        if (row.twelfthpercentage) student.twelfthPercentage = parseFloat(row.twelfthpercentage);
        if (row.diplomapercentage) student.diplomaPercentage = parseFloat(row.diplomapercentage);
        if (row.entranceexamscore) student.entranceExamScore = parseInt(row.entranceexamscore);
        if (row.entranceexamrank) student.entranceExamRank = parseInt(row.entranceexamrank);
        
        // Living & Transportation
        if (row.hostelstatus) student.hostelStatus = row.hostelstatus;
        if (row.transportmode) student.transportMode = row.transportmode;
        
        // Medical Information
        if (row.medicalconditions) student.medicalConditions = row.medicalconditions;
        if (row.allergies) student.allergies = row.allergies;
        if (row.disabilities) student.disabilities = row.disabilities;
        
        // Skills & Languages
        if (row.languagesknown) student.languagesKnown = row.languagesknown.split(';').map(l => l.trim()).filter(l => l);
        if (row.hobbies) student.hobbies = row.hobbies.split(';').map(h => h.trim()).filter(h => h);
        if (row.extracurricularactivities) student.extraCurricularActivities = row.extracurricularactivities.split(';').map(a => a.trim()).filter(a => a);
        if (row.sports) student.sports = row.sports.split(';').map(s => s.trim()).filter(s => s);
        
        // Certifications & Achievements
        if (row.technicalcertifications) student.technicalCertifications = row.technicalcertifications.split(';').map(c => c.trim()).filter(c => c);
        if (row.nontechnicalcertifications) student.nonTechnicalCertifications = row.nontechnicalcertifications.split(';').map(c => c.trim()).filter(c => c);
        if (row.internships) student.internships = row.internships.split(';').map(i => i.trim()).filter(i => i);
        if (row.workshopsattended) student.workshopsAttended = row.workshopsattended.split(';').map(w => w.trim()).filter(w => w);
        if (row.paperpublications) student.paperPublications = row.paperpublications.split(';').map(p => p.trim()).filter(p => p);
        if (row.patentapplications) student.patentApplications = parseInt(row.patentapplications);
        if (row.startupexperience) student.startupExperience = parseInt(row.startupexperience);
        if (row.leadershiproles) student.leadershipRoles = parseInt(row.leadershiproles);
        if (row.communityservice) student.communityService = parseInt(row.communityservice);
        
        // Online Presence
        if (row.socialmediapresence) student.socialMediaPresence = row.socialmediapresence.split(';').map(s => s.trim()).filter(s => s);
        if (row.linkedinprofile) student.linkedinProfile = row.linkedinprofile;
        if (row.portfoliowebsite) student.portfolioWebsite = row.portfoliowebsite;
        if (row.githubprofile) student.githubProfile = row.githubprofile;
        
        // Career Preferences
        if (row.expectedsalary) student.expectedSalary = parseInt(row.expectedsalary);
        if (row.preferredlocation) student.preferredLocation = row.preferredlocation.split(';').map(l => l.trim()).filter(l => l);
        if (row.willingtorelocate) student.willingToRelocate = row.willingtorelocate.toLowerCase() === 'yes' || row.willingtorelocate.toLowerCase() === 'true';
        
        // Documents & Identity
        if (row.passportnumber) student.passportNumber = row.passportnumber;
        if (row.drivinglicense) student.drivingLicense = row.drivinglicense;
        if (row.vehicleownership) student.vehicleOwnership = row.vehicleownership.toLowerCase() === 'yes' || row.vehicleownership.toLowerCase() === 'true';
        if (row.bankaccount) student.bankAccount = row.bankaccount;
        if (row.pancard) student.panCard = row.pancard;
        if (row.aadharnumber) student.aadharNumber = row.aadharnumber;

        await student.save();
        successful.push({
          email: student.email,
          status: 'success',
          studentId: student._id
        });

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
        failed.push({
          email: row.email || 'Unknown',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Biodata upload completed. ${successful.length} students updated.`,
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      errors: errors.length > 0 ? errors : [],
      results: [...successful, ...failed]
    });

  } catch (error) {
    console.error('Bulk biodata upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// Create biodata manually
router.post('/create-biodata', async (req, res) => {
  try {
    const {
      email, name, branch, section, rollNumber, phone, year,
      gender, dateOfBirth, address, gpa, specialization,
      skills, projects, attendancePercentage, backlogs,
      academicRequirements, otherEligibility,
      // Comprehensive biodata fields
      bloodGroup, height, weight, nationality, religion, caste, category,
      parentName, parentPhone, parentOccupation, familyIncome,
      tenthPercentage, twelfthPercentage, diplomaPercentage, entranceExamScore, entranceExamRank,
      hostelStatus, transportMode, medicalConditions, allergies, disabilities,
      languagesKnown, hobbies, extraCurricularActivities, sports,
      technicalCertifications, nonTechnicalCertifications, internships, workshopsAttended,
      paperPublications, patentApplications, startupExperience, leadershipRoles, communityService,
      socialMediaPresence, linkedinProfile, portfolioWebsite, githubProfile,
      expectedSalary, preferredLocation, willingToRelocate,
      passportNumber, drivingLicense, vehicleOwnership, bankAccount, panCard, aadharNumber
    } = req.body;
    
    if (!name || !email || !branch || !rollNumber) {
      return res.status(400).json({ success: false, error: 'Name, email, branch, and roll number are required' });
    }

    // Find existing student
    const student = await Student.findOne({ email: String(email).toLowerCase() });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student with this email not found' });
    }

    // Update student with biodata
    student.name = name;
    student.branch = branch;
    student.section = section || student.section || 'Not Specified';
    student.rollNumber = rollNumber;
    student.phone = phone || student.phone || '';
    student.year = year || student.year || new Date().getFullYear().toString();

    // Initialize onboarding data if not exists
    if (!student.onboardingData) {
      student.onboardingData = {
        personalInfo: {},
        academicInfo: {},
        placementInfo: {}
      };
    }

    // Update personal info
    if (gender) {
      student.onboardingData.personalInfo.gender = gender;
    }
    if (dateOfBirth) {
      student.onboardingData.personalInfo.dateOfBirth = dateOfBirth;
    }
    if (address) {
      student.onboardingData.personalInfo.address = address;
    }

    // Update academic info
    if (gpa !== undefined) {
      student.onboardingData.academicInfo.gpa = gpa;
    }
    if (specialization) {
      student.onboardingData.academicInfo.specialization = specialization;
    }
    if (skills && Array.isArray(skills)) {
      student.onboardingData.academicInfo.skills = skills;
    }
    if (projects && Array.isArray(projects)) {
      student.onboardingData.academicInfo.projects = projects;
    }

    // Add eligibility criteria
    if (!student.eligibilityCriteria) {
      student.eligibilityCriteria = {};
    }
    if (attendancePercentage !== undefined) {
      student.eligibilityCriteria.attendancePercentage = attendancePercentage;
    }
    if (backlogs !== undefined) {
      student.eligibilityCriteria.backlogs = backlogs;
    }
    if (academicRequirements) {
      student.eligibilityCriteria.academicRequirements = academicRequirements;
    }
    if (otherEligibility) {
      student.eligibilityCriteria.otherEligibility = otherEligibility;
    }

    // Update comprehensive biodata fields
    if (bloodGroup) student.bloodGroup = bloodGroup;
    if (height !== undefined) student.height = height;
    if (weight !== undefined) student.weight = weight;
    if (nationality) student.nationality = nationality;
    if (religion) student.religion = religion;
    if (caste) student.caste = caste;
    if (category) student.category = category;
    
    // Family Information
    if (parentName) student.parentName = parentName;
    if (parentPhone) student.parentPhone = parentPhone;
    if (parentOccupation) student.parentOccupation = parentOccupation;
    if (familyIncome !== undefined) student.familyIncome = familyIncome;
    
    // Academic History
    if (tenthPercentage !== undefined) student.tenthPercentage = tenthPercentage;
    if (twelfthPercentage !== undefined) student.twelfthPercentage = twelfthPercentage;
    if (diplomaPercentage !== undefined) student.diplomaPercentage = diplomaPercentage;
    if (entranceExamScore !== undefined) student.entranceExamScore = entranceExamScore;
    if (entranceExamRank !== undefined) student.entranceExamRank = entranceExamRank;
    
    // Living & Transportation
    if (hostelStatus) student.hostelStatus = hostelStatus;
    if (transportMode) student.transportMode = transportMode;
    
    // Medical Information
    if (medicalConditions) student.medicalConditions = medicalConditions;
    if (allergies) student.allergies = allergies;
    if (disabilities) student.disabilities = disabilities;
    
    // Skills & Languages
    if (languagesKnown && Array.isArray(languagesKnown)) student.languagesKnown = languagesKnown;
    if (hobbies && Array.isArray(hobbies)) student.hobbies = hobbies;
    if (extraCurricularActivities && Array.isArray(extraCurricularActivities)) student.extraCurricularActivities = extraCurricularActivities;
    if (sports && Array.isArray(sports)) student.sports = sports;
    
    // Certifications & Achievements
    if (technicalCertifications && Array.isArray(technicalCertifications)) student.technicalCertifications = technicalCertifications;
    if (nonTechnicalCertifications && Array.isArray(nonTechnicalCertifications)) student.nonTechnicalCertifications = nonTechnicalCertifications;
    if (internships && Array.isArray(internships)) student.internships = internships;
    if (workshopsAttended && Array.isArray(workshopsAttended)) student.workshopsAttended = workshopsAttended;
    if (paperPublications && Array.isArray(paperPublications)) student.paperPublications = paperPublications;
    if (patentApplications !== undefined) student.patentApplications = patentApplications;
    if (startupExperience !== undefined) student.startupExperience = startupExperience;
    if (leadershipRoles !== undefined) student.leadershipRoles = leadershipRoles;
    if (communityService !== undefined) student.communityService = communityService;
    
    // Online Presence
    if (socialMediaPresence && Array.isArray(socialMediaPresence)) student.socialMediaPresence = socialMediaPresence;
    if (linkedinProfile) student.linkedinProfile = linkedinProfile;
    if (portfolioWebsite) student.portfolioWebsite = portfolioWebsite;
    if (githubProfile) student.githubProfile = githubProfile;
    
    // Career Preferences
    if (expectedSalary !== undefined) student.expectedSalary = expectedSalary;
    if (preferredLocation && Array.isArray(preferredLocation)) student.preferredLocation = preferredLocation;
    if (willingToRelocate !== undefined) student.willingToRelocate = willingToRelocate;
    
    // Documents & Identity
    if (passportNumber) student.passportNumber = passportNumber;
    if (drivingLicense) student.drivingLicense = drivingLicense;
    if (vehicleOwnership !== undefined) student.vehicleOwnership = vehicleOwnership;
    if (bankAccount) student.bankAccount = bankAccount;
    if (panCard) student.panCard = panCard;
    if (aadharNumber) student.aadharNumber = aadharNumber;

    await student.save();

    res.json({
      success: true,
      message: 'Biodata saved successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        branch: student.branch,
        section: student.section,
        rollNumber: student.rollNumber,
        phone: student.phone,
        year: student.year,
        eligibilityCriteria: student.eligibilityCriteria
      }
    });

  } catch (error) {
    console.error('Create biodata error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
