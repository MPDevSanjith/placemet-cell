

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Sanitize a student name for folder/filename usage
  safeStudentName(studentName) {
    if (!studentName) return 'Unknown';
    if (typeof studentName === 'object') {
      const firstName = studentName.firstName || '';
      const lastName = studentName.lastName || '';
      studentName = `${firstName} ${lastName}`.trim();
    }
    return String(studentName)
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]/g, '')
      .substring(0, 50) || 'Unknown';
  }

  // Build a nice folder path
  safeFolderPath(studentId, studentName) {
    const safeName = this.safeStudentName(studentName);
    return `placement_erp/students/${studentId}_${safeName}`;
  }

  // Build a readable filename for downloads
  safeFileName(baseName, defaultExt = 'pdf') {
    if (!baseName || typeof baseName !== 'string') baseName = 'resume';
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    const sanitized = nameWithoutExt.trim().replace(/\s+/g, '_').replace(/[^\w\-]/g, '').substring(0, 100) || 'resume';
    return `${sanitized}.${defaultExt}`;
  }

  async uploadResume(file, fileName, studentId, studentName) {
    const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;
    const extension = fileName.split('.').pop().toLowerCase();

    const folderPath = this.safeFolderPath(studentId, studentName || '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const basePublicId = `resume_${studentId}_${timestamp}`;

    const uploadOptions = {
      public_id: basePublicId,
      folder: folderPath,
      overwrite: true,
      tags: ['resume', 'placement_erp'],
      type: 'upload',
    };

    // PDFs are stored as image/pdf; DOC/DOCX are uploaded as raw and converted to PDF eagerly
    if (extension === 'pdf') {
      uploadOptions.resource_type = 'image';
      uploadOptions.format = 'pdf';
    } else if (extension === 'doc' || extension === 'docx') {
      uploadOptions.resource_type = 'raw';
      uploadOptions.raw_convert = 'aspose';
      uploadOptions.eager = [{ format: 'pdf' }];
      uploadOptions.eager_async = false; // wait for derived pdf
    } else {
      // Unsupported types default to raw, but we will still try to provide a pdf URL if possible
      uploadOptions.resource_type = 'raw';
    }

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(fileBuffer);
    });

    console.log('📦 Cloudinary upload result:', uploadResult);

    // Build final PDF URL (image/pdf) for both native PDFs and converted Word docs
    const pdfUrlFromEager = Array.isArray(uploadResult.eager) && uploadResult.eager[0] && uploadResult.eager[0].secure_url;
    const finalPdfUrl = pdfUrlFromEager || cloudinary.url(uploadResult.public_id, {
      secure: true,
      resource_type: 'image',
      type: 'upload',
      format: 'pdf',
    });

    // Friendly filename for profile/downloads
    const downloadFileName = this.safeFileName(fileName, 'pdf');

    return {
      fileId: uploadResult.public_id,
      fileUrl: finalPdfUrl,
      resourceType: 'image',
      extension: 'pdf',
      fileName: downloadFileName,
      folder: folderPath,
    };
  }

  // Generate a view/download URL
  generateViewUrl(publicId, resourceType = 'image', format = 'pdf', attachmentName = 'resume.pdf') {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type: 'upload',
      format,
      attachment: attachmentName,
    });
  }

  // Generate short-lived signed download URL with UTC timestamp and skew leeway
  generateSignedDownloadUrl(publicId, options = {}) {
    const {
      ttlSeconds = 3600,
      clockSkewLeewaySeconds = 120,
      attachment = true,
      deliveryType = 'upload',  // default to public upload; set 'private' if you upload privately
      resourceType = 'image',
      format = 'pdf',
    } = options;

    const nowUtcSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = nowUtcSeconds + Math.max(30, ttlSeconds) + Math.max(0, clockSkewLeewaySeconds);

    return cloudinary.utils.private_download_url(publicId, format, {
      secure: true,
      resource_type: resourceType,
      type: deliveryType,
      expires_at: expiresAt,
      attachment,
      sign_url: true,
    });
  }

  // Unified helper: always return image/pdf URLs (we convert DOC/DOCX on upload)
  async generateAutoDownloadUrl(publicId, options = {}) {
    const { signed = false, ttlSeconds = 1800, deliveryType = 'upload', attachment = 'resume.pdf' } = options;
    if (!signed) {
      return this.generateViewUrl(publicId, 'image', 'pdf', attachment);
    }
    return this.generateSignedDownloadUrl(publicId, {
      ttlSeconds,
      deliveryType,
      attachment,
      resourceType: 'image',
      format: 'pdf',
    });
  }

  // Delete by trying image first then raw
  async deleteFile(publicId) {
    try {
      try {
        const img = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        if (img && (img.result === 'ok' || img.result === 'not found')) return img;
      } catch (_e) {}
      return await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (err) {
      throw err;
    }
  }

  // Retrieve file info from Cloudinary
  async getFileInfo(publicId) {
    try {
      // Try image first (for PDFs), fall back to raw for DOC/DOCX
      let info;
      try {
        info = await cloudinary.api.resource(publicId, { resource_type: 'image' });
      } catch (_e) {
        info = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
      }
      console.log('📄 File info:', info);
      return info;
    } catch (err) {
      console.error('❌ Error fetching file info:', err);
      throw err;
    }
  }

  // List all resumes of a student
  async listStudentResumes(studentId) {
    try {
      const [images, raws] = await Promise.all([
        cloudinary.api.resources({ type: 'upload', prefix: `placement_erp/students/${studentId}/`, resource_type: 'image', max_results: 50 }),
        cloudinary.api.resources({ type: 'upload', prefix: `placement_erp/students/${studentId}/`, resource_type: 'raw', max_results: 50 })
      ]);
      return [...images.resources, ...raws.resources];
    } catch (err) {
      console.error('❌ Error listing student resumes:', err);
      throw err;
    }
  }
}

export default new CloudinaryService();
