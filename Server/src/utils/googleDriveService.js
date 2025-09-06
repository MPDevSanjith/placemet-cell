// // ==========================
// // utils/googleDriveService.js
// // ==========================

// import { google } from 'googleapis';
// import fs from 'fs';
// import path from 'path';
// import logger from './logger.js';

// class GoogleDriveService {
//   constructor() {
//     this.serviceAccountPath = path.join(process.cwd(), 'src', 'config', 'placement-erp-21cf0e73be15.json');
//     this.drive = null;
//     this.isInitialized = false;
//     this.isConfigured = this.checkConfiguration();
//   }

//   // Check if service is properly configured
//   checkConfiguration() {
//     if (!fs.existsSync(this.serviceAccountPath)) {
//       logger.error('❌ Google service account JSON file not found');
//       logger.error('📁 Expected path:', this.serviceAccountPath);
//       return false;
//     }
    
//     try {
//       const serviceAccount = JSON.parse(fs.readFileSync(this.serviceAccountPath, 'utf8'));
      
//       // Check if it has the required fields for a valid service account
//       const requiredFields = ['type', 'private_key', 'client_email', 'project_id', 'private_key_id'];
//       const missingFields = requiredFields.filter(field => !serviceAccount[field]);
      
//       if (missingFields.length > 0) {
//         logger.error('❌ Google service account missing required fields:', missingFields);
//         logger.error('🔧 Please ensure your service account JSON has all required fields');
//         return false;
//       }
      
//       // Validate private key format
//       if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
//         logger.error('❌ Invalid private key format in service account JSON');
//         return false;
//       }
      
//       logger.info('✅ Google service account configuration is valid');
//       return true;
//     } catch (error) {
//       logger.error('❌ Error reading Google service account file:', error);
//       return false;
//     }
//   }

//   // Initialize Google Drive API
//   async initialize() {
//     try {
//       if (!this.isConfigured) {
//         throw new Error('Google Drive not configured. Please check service account configuration.');
//       }

//       const auth = new google.auth.GoogleAuth({
//         keyFile: this.serviceAccountPath,
//         scopes: ['https://www.googleapis.com/auth/drive.file']
//       });

//       this.drive = google.drive({ version: 'v3', auth });
//       this.isInitialized = true;
//       logger.success('✅ Google Drive service initialized successfully');
//     } catch (error) {
//       logger.error('❌ Failed to initialize Google Drive service:', error);
      
//       // Check if it's a private key encoding issue
//       if (error.message.includes('DECODER routines') || error.message.includes('unsupported')) {
//         logger.error('❌ Google Drive private key has encoding issues. Please check the service account JSON file.');
//         logger.error('🔧 The private key appears to be corrupted or has invalid encoding.');
//         logger.error('💡 Please regenerate the service account key from Google Cloud Console.');
//       }
      
//       throw error; // Re-throw the error instead of using fallback
//     }
//   }

//   // Create or get student folder
//   async getOrCreateStudentFolder(studentId, studentName) {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }

//       if (!this.isConfigured || !this.drive) {
//         throw new Error('Google Drive not configured or not initialized');
//       }

//       const folderName = `Student_${studentId}_${studentName}`;
      
//       // Search for existing folder
//       const searchResponse = await this.drive.files.list({
//         q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
//         fields: 'files(id, name)'
//       });

//       if (searchResponse.data.files && searchResponse.data.files.length > 0) {
//         logger.info(`Found existing folder for student ${studentId}`);
//         return searchResponse.data.files[0].id;
//       }

//       // Create new folder
//       const folderMetadata = {
//         name: folderName,
//         mimeType: 'application/vnd.google-apps.folder',
//         parents: [] // Root folder
//       };

//       const folder = await this.drive.files.create({
//         resource: folderMetadata,
//         fields: 'id'
//       });

//       logger.success(`Created new folder for student ${studentId}: ${folder.data.id}`);
//       return folder.data.id;
//     } catch (error) {
//       logger.error('❌ Error creating/getting student folder:', error);
//       throw error;
//     }
//   }

//   // Upload resume to Google Drive
//   async uploadResume(fileBuffer, fileName, studentId, studentName, mimeType = 'application/pdf') {
//     try {
//       logger.info(`🚀 Starting resume upload for student: ${studentId}, file: ${fileName}`);
      
//       if (!this.isInitialized) {
//         logger.info('Initializing Google Drive service...');
//         await this.initialize();
//       }

//       logger.info(`Google Drive configured: ${this.isConfigured}, Drive instance: ${!!this.drive}`);

//       // Get or create student folder
//       const folderId = await this.getOrCreateStudentFolder(studentId, studentName);
//       logger.info(`📁 Using folder ID: ${folderId}`);

//       if (!this.isConfigured || !this.drive) {
//         logger.warn('Google Drive not configured - cannot upload resume');
//         throw new Error('Google Drive service not configured. Please contact administrator.');
//       }

//       // Sanitize filename - remove spaces, special chars, and ensure valid format
//       const sanitizedFileName = this.sanitizeFileName(fileName);
//       const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//       const uniqueFileName = `resume_${studentId}_${timestamp}.pdf`;

//       logger.info(`Uploading resume: ${uniqueFileName} to folder: ${folderId}`);

//       // File metadata
//       const fileMetadata = {
//         name: uniqueFileName,
//         parents: [folderId],
//         mimeType: mimeType
//       };

//       // Upload file
//       let file;
//       const media = {
//         mimeType: mimeType,
//         body: fileBuffer
//       };

//       logger.info(`📤 Attempting to upload file with size: ${fileBuffer.length} bytes`);

//       try {
//         file = await this.drive.files.create({
//           resource: fileMetadata,
//           media: media,
//           fields: 'id, name, webViewLink, size, createdTime'
//         });
//       } catch (uploadError) {
//         logger.error('❌ Google Drive upload failed:', uploadError);
        
//         if (uploadError.message.includes('part.body.pipe is not a function')) {
//           logger.error('🔧 File buffer format issue detected. Converting buffer to stream...');
          
//           // Convert buffer to stream
//           const { Readable } = await import('stream');
//           const stream = Readable.from(fileBuffer);
          
//           const mediaWithStream = {
//             mimeType: mimeType,
//             body: stream
//           };
          
//           file = await this.drive.files.create({
//             resource: fileMetadata,
//             media: mediaWithStream,
//             fields: 'id, name, webViewLink, size, createdTime'
//           });
          
//           logger.success(`✅ File uploaded successfully with stream conversion: ${file.data.id}`);
//         } else {
//           throw uploadError;
//         }
//       }

//       logger.success(`Resume uploaded to Google Drive: ${file.data.id}`);
      
//       // Ensure we have a proper webViewLink
//       let fileUrl = file.data.webViewLink;
//       if (!fileUrl || !fileUrl.includes('drive.google.com')) {
//         fileUrl = this.formatGoogleDriveUrl(file.data.id);
//       }
      
//       const result = {
//         fileId: file.data.id,
//         fileName: uniqueFileName,
//         fileUrl: fileUrl,
//         folderId: folderId,
//         size: file.data.size || fileBuffer.length,
//         uploadDate: file.data.createdTime || new Date().toISOString()
//       };
      
//       logger.info(`🔗 Generated Google Drive URL: ${fileUrl}`);
//       logger.info(`📄 Upload result:`, result);
      
//       return result;
//     } catch (error) {
//       logger.error('Error uploading resume to Google Drive:', error);
      
//       // If it's a configuration error, throw it
//       if (error.message.includes('not configured')) {
//         throw error;
//       }
      
//       // For other errors, try to provide a helpful message
//       if (error.code === 403) {
//         throw new Error('Access denied to Google Drive. Please check permissions.');
//       } else if (error.code === 400) {
//         throw new Error('Invalid file format or metadata. Please try again.');
//       } else {
//         throw new Error(`Failed to upload resume: ${error.message}`);
//       }
//     }
//   }

//   // Validate and format Google Drive URL
//   formatGoogleDriveUrl(fileId) {
//     if (!fileId) return null;
    
//     logger.info(`Formatting Google Drive URL for fileId: ${fileId}`);
    
//     // If it's already a full URL, validate and return
//     if (fileId.includes('drive.google.com')) {
//       // Ensure it's a proper view URL
//       if (fileId.includes('/view')) {
//         logger.info(`URL already properly formatted: ${fileId}`);
//         return fileId;
//       } else if (fileId.includes('/d/')) {
//         // Convert edit URL to view URL
//         const formattedUrl = fileId.replace('/edit', '/view');
//         logger.info(`Converted edit URL to view URL: ${formattedUrl}`);
//         return formattedUrl;
//       }
//     }
    
//     // If it's just an ID, format it properly
//     const formattedUrl = `https://drive.google.com/file/d/${fileId}/view`;
//     logger.info(`Formatted fileId to URL: ${formattedUrl}`);
//     return formattedUrl;
//   }

//   // Sanitize filename to remove spaces and special characters
//   sanitizeFileName(fileName) {
//     if (!fileName) return 'resume.pdf';
    
//     // Remove file extension first
//     const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
//     // Clean the filename while preserving readability
//     let sanitized = nameWithoutExt
//       .trim() // Remove leading/trailing spaces
//       .replace(/\s+/g, '_') // Replace multiple spaces with single underscore
//       .replace(/[^\w\-\_]/g, '') // Keep only alphanumeric, hyphens, and underscores
//       .replace(/_+/g, '_') // Replace multiple underscores with single
//       .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
//       .substring(0, 100); // Allow longer names for better readability
    
//     // Ensure it's not empty
//     if (!sanitized) sanitized = 'resume';
    
//     // Add .pdf extension
//     return `${sanitized}.pdf`;
//   }

//   // Delete file from Google Drive
//   async deleteFile(fileId) {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }

//       if (!this.isConfigured || !this.drive) {
//         logger.warn('Google Drive not configured - cannot delete file');
//         throw new Error('Google Drive service not configured. Please contact administrator.');
//       }

//       // Validate file ID format
//       if (!fileId || typeof fileId !== 'string' || fileId.length < 10) {
//         throw new Error('Invalid file ID format');
//       }

//       await this.drive.files.delete({
//         fileId: fileId
//       });

//       logger.success(`File deleted from Google Drive: ${fileId}`);
//     } catch (error) {
//       logger.error('Error deleting file from Google Drive:', error);
      
//       if (error.message.includes('not configured')) {
//         throw error;
//       }
      
//       if (error.code === 404) {
//         throw new Error('File not found in Google Drive. It may have already been deleted.');
//       } else if (error.code === 403) {
//         throw new Error('Access denied to delete file. Please check permissions.');
//       } else {
//         throw new Error(`Failed to delete file: ${error.message}`);
//       }
//     }
//   }

//   // Get file info
//   async getFileInfo(fileId) {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }

//       if (!this.isConfigured || !this.drive) {
//         logger.warn('Google Drive not configured - cannot get file info');
//         throw new Error('Google Drive service not configured. Please contact administrator.');
//       }

//       // Validate file ID format
//       if (!fileId || typeof fileId !== 'string' || fileId.length < 10) {
//         throw new Error('Invalid file ID format');
//       }

//       const file = await this.drive.files.get({
//         fileId: fileId,
//         fields: 'id, name, size, webViewLink, createdTime, modifiedTime'
//       });

//       // Ensure the webViewLink is properly formatted
//       let webViewLink = file.data.webViewLink;
//       if (!webViewLink || !webViewLink.includes('drive.google.com')) {
//         webViewLink = this.formatGoogleDriveUrl(fileId);
//       }

//       return {
//         ...file.data,
//         webViewLink: webViewLink
//       };
//     } catch (error) {
//       logger.error('Error getting file info from Google Drive:', error);
      
//       if (error.message.includes('not configured')) {
//         throw error;
//       }
      
//       if (error.code === 404) {
//         throw new Error('File not found in Google Drive. It may have been deleted or moved.');
//       } else if (error.code === 403) {
//         throw new Error('Access denied to file. Please check permissions.');
//       } else {
//         throw new Error(`Failed to get file info: ${error.message}`);
//       }
//     }
//   }

//   // List files in student folder
//   async listStudentFiles(folderId) {
//     try {
//       if (!this.isInitialized) {
//         await this.initialize();
//       }

//       if (!this.isConfigured || !this.drive) {
//         throw new Error('Google Drive service not configured. Please contact administrator.');
//       }

//       const response = await this.drive.files.list({
//         q: `'${folderId}' in parents and trashed=false`,
//         fields: 'files(id, name, size, webViewLink, createdTime, modifiedTime)',
//         orderBy: 'createdTime desc'
//       });

//       return response.data.files;
//     } catch (error) {
//       logger.error('Error listing student files:', error);
//       return [];
//     }
//   }

//   // Check if service is properly configured
//   isProperlyConfigured() {
//     return this.isConfigured;
//   }
// }

// // Create singleton instance
// const googleDriveService = new GoogleDriveService();

// export default googleDriveService;

import { google } from 'googleapis';
import { Readable } from 'stream';
import logger from './logger.js'; // Optional: your custom logger
import dotenv from 'dotenv';

dotenv.config();

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.isInitialized = false;

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      throw new Error('❌ Missing GOOGLE_REFRESH_TOKEN in .env');
    }

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  async initialize() {
    if (this.isInitialized) return;

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.isInitialized = true;
    logger?.info('✅ Google Drive OAuth2 initialized');
  }

  sanitizeFileName(fileName) {
    if (!fileName) return 'resume.pdf';
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    let sanitized = nameWithoutExt
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]/g, '')
      .substring(0, 100);
    return sanitized ? `${sanitized}.pdf` : 'resume.pdf';
  }

  async getOrCreateStudentFolder(studentId, studentName) {
    await this.initialize();

    const folderName = `Student_${studentId}_${studentName}`;

    const res = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (res.data.files?.length) {
      return res.data.files[0].id;
    }

    const folder = await this.drive.files.create({
      requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });

    return folder.data.id;
  }

  async uploadResume(fileBuffer, fileName, studentId, studentName, mimeType = 'application/pdf') {
    await this.initialize();

    const folderId = await this.getOrCreateStudentFolder(studentId, studentName);

    const sanitizedFileName = this.sanitizeFileName(fileName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `resume_${studentId}_${timestamp}.pdf`;

    const media = { mimeType, body: Readable.from(fileBuffer) };
    const fileMetadata = { name: uniqueFileName, parents: [folderId] };

    const file = await this.drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, size, createdTime',
    });

    const fileUrl = file.data.webViewLink || `https://drive.google.com/file/d/${file.data.id}/view`;

    return {
      fileId: file.data.id,
      fileName: uniqueFileName,
      fileUrl,
      folderId,
      size: file.data.size || fileBuffer.length,
      uploadDate: file.data.createdTime || new Date().toISOString(),
    };
  }
}

export default new GoogleDriveService();
