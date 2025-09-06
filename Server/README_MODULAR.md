# Placement ERP Backend - Clean Modular Architecture

## 🎯 Project Overview

A clean, modular Node.js backend for a Placement ERP system with comprehensive resume upload, Google Drive storage, and Gemini AI-powered ATS analysis. Features proper separation of concerns, authentication flows, and advanced file processing.

## 📁 Clean Project Structure

```
Server/
├── src/                          # Source code
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Entry point
│   ├── models/                   # Mongoose models
│   │   ├── User.js              # User model (admin/placement officers)
│   │   └── Student.js           # Student model (enhanced with resume & ATS)
│   ├── controllers/             # Business logic
│   │   ├── authController.js    # Authentication logic
│   │   ├── studentController.js # Student operations
│   │   └── resumeController.js  # Resume upload & ATS analysis
│   ├── routes/                   # Route definitions
│   │   ├── auth.js              # Authentication routes
│   │   ├── students.js          # Student routes
│   │   ├── placementOfficer.js  # Placement officer routes
│   │   └── resume.js            # Resume & ATS routes
│   ├── middleware/              # Middleware functions
│   │   ├── auth.js              # JWT authentication & authorization
│   │   └── errorHandler.js      # Error handling
│   ├── config/                   # Configuration files
│   │   ├── database.js          # Database connection
│   │   ├── jwt.js               # JWT utilities
│   │   └── placement-erp-21cf0e73be15.json  # Google service account
│   ├── email/                    # Email functionality
│   │   ├── email.js             # Email configuration
│   │   └── emailTemplates.js    # Email templates
│   ├── utils/                    # Utility functions
│   │   ├── logger.js            # Logging utility
│   │   ├── generateOtp.js       # OTP generation
│   │   ├── geminiClient.js      # Gemini AI integration
│   │   └── googleDriveService.js # Google Drive integration
│   └── services/                 # External services
│       ├── atsAnalysis.js       # ATS analysis service
│       └── geminiATS.js         # Gemini AI integration
├── uploads/                      # File uploads directory
├── logs/                         # Application logs
├── package.json                  # Dependencies and scripts
├── package-lock.json            # Locked dependencies
├── env.example                   # Environment variables template
├── .gitignore                    # Git ignore rules
├── start.sh                      # Start script
└── README_MODULAR.md            # This file
```

## 🚀 Key Features

### Authentication Flow
- **Admin/Placement Officers**: Login with email/password → JWT token
- **Students**: Login with email/password → OTP via email → JWT token

### Resume Upload & ATS Analysis
- **File Upload**: Support for PDF, DOC, DOCX files (max 10MB)
- **Google Drive Integration**: Automatic upload to student-specific folders
- **Gemini AI Analysis**: Advanced ATS scoring and improvement suggestions
- **Real-time Processing**: Immediate analysis with detailed feedback

### Email Templates
- Welcome email for new students
- Login OTP emails
- Password reset emails

### Security
- JWT-based authentication
- Role-based authorization (admin, student, placement officer)
- Password hashing with bcrypt
- Input validation and sanitization
- File type validation

### Error Handling
- Centralized error handling middleware
- Consistent error response format
- Development vs production error details
- Comprehensive logging

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - Login (admin/officer or student)
- `POST /verify-otp` - Verify OTP for student login
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /register-officer` - Register new placement officer (admin only)
- `POST /bulk-register-students` - Bulk register students (admin only)
- `GET /profile` - Get current user profile

### Students (`/api/students`)
- `POST /onboarding` - Start student onboarding
- `POST /onboarding-complete` - Complete onboarding
- `GET /onboarding-status` - Get onboarding status
- `GET /profile` - Get student profile
- `PUT /profile` - Update student profile

### Resume & ATS (`/api/resume`)
- `POST /upload` - Upload resume to Google Drive
- `POST /analyze-ats` - Upload and analyze resume with ATS
- `GET /analysis/:resumeId?` - Get resume analysis results
- `GET /list` - List all student resumes
- `DELETE /:resumeId` - Delete resume

### Placement Officers (`/api/placement-officer`)
- Various placement officer operations

## ⚙️ Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/placement_erp

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Google Drive
GOOGLE_CREDENTIALS=<base64-encoded-service-account-json>
GDRIVE_FOLDER_NAME=Placement ERP Resumes

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 🛠️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Configure Google Drive:**
   - Place your Google service account JSON file at `src/config/placement-erp-21cf0e73be15.json`
   - Or set the `GOOGLE_CREDENTIALS` environment variable with base64-encoded JSON

4. **Configure Gemini AI:**
   - Get your API key from Google AI Studio
   - Set `GEMINI_API_KEY` in your `.env` file

5. **Start the server:**
   ```bash
   # Option 1: Using npm
   npm start
   
   # Option 2: Using the start script
   ./start.sh
   ```

## 🏃‍♂️ Development

- **Server**: `http://localhost:5000`
- **Health check**: `http://localhost:5000/health`
- **API base**: `http://localhost:5000/api`

## 📝 Logging

The application uses a centralized logger utility that provides:
- Info, success, warning, and error logging
- Timestamp and emoji indicators
- Development-only debug logging
- File upload and ATS analysis tracking

## 🛡️ Error Handling

All errors are handled consistently with:
- Proper HTTP status codes
- Structured error responses
- Detailed logging
- Development vs production error details
- File upload error handling
- Google Drive integration error recovery

## 🔧 Resume Upload Flow

1. **File Validation**: Check file type (PDF, DOC, DOCX) and size (max 10MB)
2. **Google Drive Upload**: Create student folder and upload file
3. **Text Extraction**: Extract text from PDF/DOCX files
4. **ATS Analysis**: Send to Gemini AI for comprehensive analysis
5. **Database Storage**: Store metadata and analysis results
6. **Response**: Return detailed ATS score and improvement suggestions

## 🤖 Gemini AI Integration

The system uses Google's Gemini AI for advanced ATS analysis:
- **Score Calculation**: 0-100 ATS compatibility score
- **Improvement Areas**: Skills, keywords, formatting, clarity
- **Suggestions**: Actionable improvement tips
- **Keyword Analysis**: Identified and missing keywords
- **Job Role Specific**: Tailored analysis for different roles

## 📱 Frontend Integration

The frontend (`placement-ai`) includes:
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Job Role Selection**: Choose target job for analysis
- **Progress Indicators**: Real-time upload and analysis status
- **Detailed Results**: Comprehensive ATS analysis display
- **Google Drive Links**: Direct access to uploaded resumes

## 🧹 Clean Architecture Benefits

✅ **Separation of Concerns**: Each module has a clear responsibility  
✅ **Maintainability**: Easy to modify and extend  
✅ **Testability**: Modular structure enables easy testing  
✅ **Scalability**: Clean structure supports growth  
✅ **Readability**: Clear file organization and naming  
✅ **Reusability**: Components can be reused across the application  
✅ **File Processing**: Robust file upload and analysis pipeline  
✅ **Cloud Integration**: Seamless Google Drive and AI integration  

## 🔄 API Response Examples

### Resume Upload Response
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "resume": {
    "id": "resume_id",
    "filename": "resume_student123_2024-01-15.pdf",
    "originalName": "my_resume.pdf",
    "googleDriveUrl": "https://drive.google.com/file/d/...",
    "uploadDate": "2024-01-15T10:30:00Z"
  }
}
```

### ATS Analysis Response
```json
{
  "success": true,
  "message": "Resume analyzed successfully",
  "atsAnalysis": {
    "score": 85,
    "jobRole": "Software Engineer",
    "improvements": {
      "skills": ["Add more specific technical skills"],
      "keywords": ["Include industry-specific keywords"],
      "formatting": ["Improve bullet point consistency"],
      "clarity": ["Make achievements more quantifiable"]
    },
    "suggestions": ["Add more quantifiable achievements"],
    "mistakes": ["Missing specific technical skills"],
    "keywords": ["JavaScript", "React", "Node.js"],
    "overall": "Excellent"
  },
  "resume": {
    "id": "resume_id",
    "filename": "resume_student123_2024-01-15.pdf",
    "originalName": "my_resume.pdf",
    "googleDriveUrl": "https://drive.google.com/file/d/...",
    "uploadDate": "2024-01-15T10:30:00Z"
  }
}
```
