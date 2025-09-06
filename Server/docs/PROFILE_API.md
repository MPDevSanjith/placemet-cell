# Profile Management API Documentation

## Overview
This document describes the Profile Management API endpoints for the College ERP system. The API provides comprehensive profile management functionality for students.

## Base URL
```
/api/profile
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Comprehensive Profile
**GET** `/api/profile/comprehensive`

Retrieves the complete student profile with all information and completion status.

**Response:**
```json
{
  "success": true,
  "profile": {
    "basicInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "gender": "male",
      "dateOfBirth": "2000-01-01T00:00:00.000Z",
      "address": "123 Main St, City, State"
    },
    "academicInfo": {
      "rollNumber": "2023001",
      "branch": "Computer Science",
      "section": "A",
      "year": "3rd Year",
      "gpa": 8.5,
      "specialization": "Software Engineering"
    },
    "placementInfo": {
      "jobRole": "Software Developer",
      "preferredDomain": "Web Development",
      "skills": ["JavaScript", "React", "Node.js"],
      "certifications": ["AWS Certified"],
      "projects": ["E-commerce Website", "Task Management App"]
    },
    "resume": {
      "id": "resume_id",
      "filename": "resume.pdf",
      "originalName": "John_Doe_Resume.pdf",
      "uploadDate": "2024-01-01T00:00:00.000Z",
      "size": 1024000,
      "hasAtsAnalysis": true
    },
    "status": {
      "profileCompletion": 85,
      "onboardingCompleted": true,
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 2. Update Comprehensive Profile
**PUT** `/api/profile/comprehensive`

Updates multiple profile fields at once.

**Request Body:**
```json
{
  "basicInfo": {
    "name": "John Doe",
    "phone": "1234567890",
    "address": "123 Main St, City, State",
    "gender": "male",
    "dateOfBirth": "2000-01-01"
  },
  "academicInfo": {
    "rollNumber": "2023001",
    "branch": "Computer Science",
    "section": "A",
    "year": "3rd Year",
    "gpa": 8.5,
    "specialization": "Software Engineering"
  },
  "placementInfo": {
    "jobRole": "Software Developer",
    "preferredDomain": "Web Development",
    "skills": ["JavaScript", "React", "Node.js"],
    "projects": ["E-commerce Website", "Task Management App"],
    "certifications": ["AWS Certified"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profileCompletion": 85
}
```

### 3. Update Single Field
**PUT** `/api/profile/field`

Updates a single profile field.

**Request Body:**
```json
{
  "field": "name",
  "value": "John Doe"
}
```

**Supported Fields:**
- `name` - Student's full name
- `phone` - Phone number
- `address` - Address
- `gender` - Gender (male/female/other)
- `dateOfBirth` - Date of birth (ISO 8601 format)
- `rollNumber` - Roll number
- `branch` - Branch/Department
- `section` - Section
- `year` - Academic year
- `gpa` - GPA (0-10)
- `specialization` - Specialization
- `skills` - Array of skills
- `projects` - Array of projects

**Response:**
```json
{
  "success": true,
  "message": "Field 'name' updated successfully",
  "field": "name",
  "value": "John Doe",
  "profileCompletion": 85
}
```

### 4. Get Profile Completion Status
**GET** `/api/profile/completion`

Gets the current profile completion percentage.

**Response:**
```json
{
  "success": true,
  "profileCompletion": 85,
  "onboardingCompleted": true
}
```

### 5. Update Skills
**PUT** `/api/profile/skills`

Updates the student's skills list.

**Request Body:**
```json
{
  "skills": ["JavaScript", "React", "Node.js", "MongoDB", "Python"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Skills updated successfully",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB", "Python"],
  "profileCompletion": 85
}
```

### 6. Update Projects
**PUT** `/api/profile/projects`

Updates the student's projects list.

**Request Body:**
```json
{
  "projects": ["E-commerce Website", "Task Management App", "Portfolio Website"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Projects updated successfully",
  "projects": ["E-commerce Website", "Task Management App", "Portfolio Website"],
  "profileCompletion": 85
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name must be between 2 and 100 characters"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Student not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Validation Rules

### Basic Info
- `name`: String, 2-100 characters
- `phone`: String, 10-15 characters
- `address`: String, max 500 characters
- `gender`: Enum (male, female, other)
- `dateOfBirth`: ISO 8601 date format

### Academic Info
- `rollNumber`: String, 1-20 characters
- `branch`: String, 2-50 characters
- `section`: String, 1-10 characters
- `year`: String, 1-10 characters
- `gpa`: Number, 0-10
- `specialization`: String, max 100 characters

### Skills and Projects
- `skills`: Array of strings, each 1-50 characters
- `projects`: Array of strings, each 1-200 characters

## Profile Completion Calculation

The profile completion percentage is calculated based on the following fields:

**Basic Info (5 fields):**
- Name
- Email
- Phone
- Address
- Gender

**Academic Info (6 fields):**
- Roll Number
- Branch
- Section
- Year
- GPA
- Specialization

**Skills and Projects (2 fields):**
- Skills (at least one skill)
- Projects (at least one project)

**Resume (1 field):**
- At least one uploaded resume

**Total: 14 fields**
**Formula: (Completed Fields / Total Fields) × 100**

## Usage Examples

### Frontend Integration

```javascript
// Get profile
const getProfile = async () => {
  const response = await fetch('/api/profile/comprehensive', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Update single field
const updateField = async (field, value) => {
  const response = await fetch('/api/profile/field', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ field, value })
  });
  return response.json();
};

// Update skills
const updateSkills = async (skills) => {
  const response = await fetch('/api/profile/skills', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ skills })
  });
  return response.json();
};
```

## Notes

1. All endpoints require authentication
2. Email field cannot be updated through the profile API (use auth endpoints)
3. Profile completion is automatically calculated and returned with most responses
4. All date fields should be in ISO 8601 format
5. Skills and projects are stored as arrays of strings
6. The API supports partial updates - only include fields you want to update
