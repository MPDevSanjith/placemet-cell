import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Import MongoDB models
import Student from '../models/Student.js';
import User from '../models/User.js';

// Import email service
import { sendEmail, emailTemplates } from '../email/email.js';

const router = express.Router();

// Configure multer for CSV upload
const upload = multer({
  dest: 'uploads/',
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
router.post('/bulk-upload', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    const createdStudents = [];

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

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk upload completed. ${createdStudents.length} students created.`,
      created: createdStudents.length,
      errors: errors.length > 0 ? errors : null,
      students: createdStudents
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({}).select('-password -loginOtpCode -loginOtpExpires');
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

export default router;
