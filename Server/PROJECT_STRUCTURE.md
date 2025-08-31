# 🏗️ Placement ERP Server - Project Structure

## 📁 Directory Organization

```
Server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   └── email.js      # Email service configuration
│   ├── controllers/      # Business logic layer
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
│   │   ├── Student.js    # Student model with OTP fields
│   │   └── User.js       # User model (placement officers)
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Authentication routes (clean)
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
│   ├── templates/        # Email templates
│   │   └── emailTemplates.js # Centralized email templates
│   ├── utils/            # Utility functions
│   │   └── googleDrive.js # Google Drive integration
│   └── server.js         # Main server file
├── uploads/              # File uploads directory
├── logs/                 # Application logs
├── .env                  # Environment variables
├── package.json          # Dependencies
├── README.md            # Main documentation
├── PROJECT_STRUCTURE.md # This file
└── test-auth-flow.js    # Authentication test script
```

## 🔐 Authentication Flow

### 1. **Login Process**
- **Placement Officers/Admins**: Direct login with email/password
- **Students**: Two-factor authentication
  - First: Email/password validation
  - Second: OTP verification via email

### 2. **Role-Based Routing**
- **Placement Officers**: Redirected to placement officer dashboard
- **Students**: Redirected to OTP verification, then onboarding

### 3. **Security Features**
- JWT-based authentication
- Password hashing with bcrypt
- OTP expiration (10 minutes)
- Account status validation

## 📧 Email System

### **Centralized Configuration**
- `src/config/email.js`: Email service setup
- `src/templates/emailTemplates.js`: All email templates

### **Email Types**
1. **Welcome Student**: New student account creation
2. **Welcome Officer**: New placement officer account
3. **Login OTP**: Student login verification
4. **Password Reset**: Account recovery

### **Template Features**
- Professional design with Instagram-inspired colors
- Responsive HTML layout
- Branded headers and footers
- Clear call-to-action buttons

## 🗄️ Database Models

### **Student Model**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  branch: String,
  year: String,
  rollNumber: String,
  phone: String,
  // OTP fields
  loginOtpCode: String,
  loginOtpExpires: Date,
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Multiple resumes support
  resumes: [ResumeSchema],
  atsScores: [AtsScoreSchema],
  // Profile data
  profile: ProfileSchema,
  lastLogin: Date
}
```

### **User Model (Placement Officers)**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (placement_officer/admin),
  status: String (active/inactive),
  phone: String,
  lastLogin: Date,
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

## 🚀 API Endpoints

### **Authentication (`/api/auth`)**
- `POST /login` - User login
- `POST /verify-otp` - OTP verification for students
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /clear-auth` - Clear auth data (debug)

### **Students (`/api/students`)**
- `GET /profile` - Get student profile
- `POST /resume` - Upload resume
- `PUT /profile` - Update profile
- `GET /ats-results` - Get ATS analysis results

### **Placement Officers (`/api/placement-officer`)**
- `POST /bulk-upload` - Bulk upload students via CSV
- `POST /create` - Create individual student
- `GET /students` - List all students
- `POST /send-welcome-emails` - Send welcome emails

## 🧪 Testing

### **Authentication Test**
```bash
cd Server
node test-auth-flow.js
```

### **Server Test**
```bash
cd Server
npm start
```

## 🔧 Configuration

### **Environment Variables (.env)**
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

## 📋 Development Guidelines

### **Code Organization**
1. **Controllers**: Handle business logic
2. **Routes**: Define API endpoints
3. **Models**: Define data structure
4. **Middleware**: Handle cross-cutting concerns
5. **Templates**: Centralize email content

### **Best Practices**
- Use async/await for database operations
- Implement proper error handling
- Validate input data
- Use environment variables for configuration
- Follow RESTful API conventions

### **File Naming**
- Use camelCase for JavaScript files
- Use kebab-case for directories
- Include descriptive names
- Group related functionality

## 🚀 Getting Started

1. **Install dependencies**: `npm install`
2. **Configure environment**: Copy `.env.example` to `.env`
3. **Start server**: `npm start`
4. **Test authentication**: `node test-auth-flow.js`

## 🔍 Troubleshooting

### **Common Issues**
1. **MongoDB Connection**: Check `MONGODB_URI` in `.env`
2. **Email Issues**: Verify `EMAIL_USER` and `EMAIL_PASS`
3. **Google Drive**: Check `GDRIVE_SHARED_DRIVE_ID`
4. **Port Conflicts**: Ensure port 5000 is available

### **Debug Commands**
```bash
# Test database connection
node src/config/database.js

# Test email service
node src/config/email.js

# Test authentication flow
node test-auth-flow.js
```

## 📚 Additional Resources

- **README.md**: Main project documentation
- **API Documentation**: Endpoint specifications
- **Email Templates**: Professional email designs
- **Security Guide**: Authentication best practices

