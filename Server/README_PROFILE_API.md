# Profile Management API - Implementation Guide

## Overview
This document provides a comprehensive guide to the newly implemented Profile Management API for the College ERP system.

## 🏗️ Architecture

### File Structure
```
Server/src/
├── controllers/
│   └── profileController.js     # Main profile logic
├── routes/
│   └── profile.js              # Profile API routes
├── middleware/
│   └── validation.js           # Input validation
├── services/
│   └── profileService.js       # Business logic service
└── docs/
    └── PROFILE_API.md          # API documentation
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd Server
npm install express-validator
```

### 2. Start Server
```bash
npm start
```

### 3. Test Endpoints
The API is available at: `http://localhost:5000/api/profile`

## 📋 API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/comprehensive` | Get complete student profile |
| PUT | `/api/profile/comprehensive` | Update multiple profile fields |
| PUT | `/api/profile/field` | Update single profile field |
| GET | `/api/profile/completion` | Get profile completion status |
| PUT | `/api/profile/skills` | Update student skills |
| PUT | `/api/profile/projects` | Update student projects |

## 🔧 Implementation Details

### Profile Controller (`profileController.js`)
- **Purpose**: Handles HTTP requests and responses
- **Key Functions**:
  - `getStudentProfile()` - Retrieves complete profile data
  - `updateStudentProfile()` - Updates multiple fields
  - `updateProfileField()` - Updates single field
  - `updateSkills()` - Manages skills array
  - `updateProjects()` - Manages projects array

### Profile Service (`profileService.js`)
- **Purpose**: Contains business logic and data processing
- **Key Features**:
  - Profile completion calculation
  - Data validation and sanitization
  - Database operations abstraction

### Validation Middleware (`validation.js`)
- **Purpose**: Input validation using express-validator
- **Validates**:
  - Field lengths and formats
  - Data types and constraints
  - Required vs optional fields

### Routes (`profile.js`)
- **Purpose**: Defines API endpoints and middleware chain
- **Features**:
  - Authentication middleware
  - Validation middleware
  - Error handling

## 📊 Profile Completion Calculation

The profile completion percentage is calculated based on 14 key fields:

### Basic Info (5 fields)
- Name
- Email
- Phone
- Address
- Gender

### Academic Info (6 fields)
- Roll Number
- Branch
- Section
- Year
- GPA
- Specialization

### Skills & Projects (2 fields)
- Skills (at least one skill)
- Projects (at least one project)

### Resume (1 field)
- At least one uploaded resume

**Formula**: `(Completed Fields / Total Fields) × 100`

## 🔄 Frontend Integration

### Updated API Calls
The frontend has been updated to use the new endpoints:

```javascript
// Old endpoints (deprecated)
/api/students/profile/comprehensive
/api/students/profile/skills
/api/students/profile/projects

// New endpoints
/api/profile/comprehensive
/api/profile/skills
/api/profile/projects
/api/profile/field
```

### New Functions Available
```javascript
// Update single field
updateProfileField(token, field, value)

// Get profile completion
getCompletionStatus(token)

// Update comprehensive profile
updateStudentProfile(token, profileData)
```

## 🛡️ Security Features

### Input Validation
- Field length limits
- Data type validation
- Required field checks
- SQL injection prevention

### Authentication
- JWT token verification
- Role-based access control
- Secure password handling

### Error Handling
- Comprehensive error messages
- Proper HTTP status codes
- Logging for debugging

## 📝 Usage Examples

### Update Single Field
```javascript
const response = await updateProfileField(token, 'name', 'John Doe');
console.log(response.profileCompletion); // Updated completion percentage
```

### Update Multiple Fields
```javascript
const profileData = {
  basicInfo: {
    name: 'John Doe',
    phone: '1234567890'
  },
  academicInfo: {
    gpa: 8.5
  }
};
const response = await updateStudentProfile(token, profileData);
```

### Update Skills
```javascript
const skills = ['JavaScript', 'React', 'Node.js'];
const response = await updateStudentSkills(token, skills);
```

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if `express-validator` is installed
   - Verify MongoDB connection
   - Check port 5000 availability

2. **Authentication errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper Authorization header

3. **Validation errors**
   - Check field length limits
   - Verify data types
   - Review validation rules

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 🔮 Future Enhancements

### Planned Features
- Profile image upload
- Bulk profile updates
- Profile export functionality
- Advanced validation rules
- Profile versioning

### Performance Optimizations
- Database indexing
- Caching strategies
- Response compression
- Rate limiting

## 📚 Additional Resources

- [API Documentation](./docs/PROFILE_API.md)
- [Validation Rules](./src/middleware/validation.js)
- [Database Schema](./src/models/Student.js)
- [Frontend Integration](./placement-ai/src/global/api.tsx)

## 🤝 Contributing

When making changes to the profile API:

1. Update validation rules if adding new fields
2. Update profile completion calculation
3. Add proper error handling
4. Update API documentation
5. Test all endpoints thoroughly

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs
4. Verify database connectivity

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Development Team
