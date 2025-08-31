# 🚀 Placement ERP Server

A comprehensive backend server for the Placement ERP system built with Node.js, Express, and MongoDB.

## 📁 Project Structure

```
Server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   └── email.js      # Email configuration
│   ├── controllers/      # Business logic
│   │   ├── authController.js      # Authentication logic
│   │   ├── studentController.js   # Student operations
│   │   ├── userController.js      # User/Admin operations
│   │   ├── placementController.js # Placement operations
│   │   ├── jobController.js       # Job operations
│   │   ├── companyController.js   # Company operations
│   │   ├── applicationController.js # Application operations
│   │   ├── dashboardController.js  # Dashboard data
│   │   └── adminController.js      # Admin operations
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # JWT authentication
│   │   └── uploadResume.js # File upload handling
│   ├── models/           # Mongoose schemas
│   │   ├── Student.js    # Student model
│   │   └── User.js       # User model
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Authentication routes
│   │   ├── students.js   # Student routes
│   │   ├── users.js      # User routes
│   │   ├── placementOfficer.js # Placement officer routes
│   │   ├── jobs.js       # Job routes
│   │   ├── companies.js  # Company routes
│   │   ├── applications.js # Application routes
│   │   ├── drives.js     # Drive routes
│   │   ├── placements.js # Placement routes
│   │   ├── dashboard.js  # Dashboard routes
│   │   └── admin.js      # Admin routes
│   ├── utils/            # Utility functions
│   │   └── googleDrive.js # Google Drive integration
│   └── server.js         # Main server file
├── uploads/              # File uploads directory
├── logs/                 # Application logs
├── .env                  # Environment variables
├── package.json          # Dependencies
└── README.md            # This file
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server:**
   ```bash
   npm start
   # or
   node src/server.js
   ```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/placement_erp

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Google Drive
GDRIVE_SHARED_DRIVE_ID=your-shared-drive-id
GDRIVE_FOLDER_NAME=resumes

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
FRONTEND_URL=http://localhost:5173
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /verify-otp` - OTP verification for students
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### Students (`/api/students`)
- `GET /profile` - Get student profile
- `POST /resume` - Upload resume
- `PUT /profile` - Update profile
- `GET /ats-results` - Get ATS analysis results

### Placement Officers (`/api/placement-officer`)
- `POST /bulk-upload` - Bulk upload students via CSV
- `POST /create` - Create individual student
- `GET /students` - List all students
- `POST /send-welcome-emails` - Send welcome emails

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `PUT /change-password` - Change password

## 🔐 Authentication Flow

1. **Placement Officers/Admins:** Direct login with email/password
2. **Students:** Two-factor authentication
   - First: Email/password validation
   - Second: OTP verification via email

## 📧 Email System

- **Welcome Emails:** Sent to new students with login credentials
- **OTP Emails:** Sent for student login verification
- **Password Reset:** Sent when users request password reset

## 📁 File Management

- **Resume Uploads:** Stored in Google Drive shared folder
- **CSV Uploads:** Processed for bulk student creation
- **File Validation:** Size and type restrictions applied

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- File upload validation
- Rate limiting (configurable)
- CORS protection

## 🧪 Testing

```bash
# Test database connection
node src/config/database.js

# Test Google Drive connection
node src/utils/googleDrive.js
```

## 📝 Logs

Application logs are stored in the `logs/` directory with daily rotation.

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update this README for new features

## 📄 License

This project is proprietary software for educational institution use.
