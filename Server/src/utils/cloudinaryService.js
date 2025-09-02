// utils/cloudinaryService.js

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.isConfigured = this.checkConfiguration();
  }

  checkConfiguration() {
    const req = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = req.filter((k) => !process.env[k]);
    if (missing.length) {
      console.error('❌ Cloudinary missing envs:', missing);
      return false;
    }
    return true;
  }

  safeStudentName(name) {
    try {
      if (name && typeof name === 'object') {
        const first = name.firstName || '';
        const last = name.lastName || '';
        name = `${first} ${last}`.trim();
      }
      if (typeof name !== 'string') name = String(name || 'Unknown');
      return (
        name
          .trim()
          .replace(/\s+/g, '_')
          .replace(/[^\w\-_]/g, '')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '')
          .substring(0, 50) || 'Unknown'
      );
    } catch {
      return 'Unknown';
    }
  }

  safeFolderPath(studentId, studentName) {
    return studentId
      ? `placement_erp/students/${studentId}_${this.safeStudentName(studentName)}`
      : 'placement_erp/students/default';
  }

  toBuffer(input) {
    if (!input) throw new Error('No file provided');
    if (Buffer.isBuffer(input)) return input;
    if (input.buffer && Buffer.isBuffer(input.buffer)) return input.buffer;
    if (input.arrayBuffer && typeof input.arrayBuffer === 'function') return Buffer.from(input.arrayBuffer());
    if (input instanceof ArrayBuffer) return Buffer.from(input);
    throw new Error('Unsupported file input');
  }

  deriveFileInfo(fileName, mimeType) {
    const ext = (fileName?.split('.').pop() || '').toLowerCase();
    const supported = ['pdf', 'doc', 'docx'];
    const finalExt = supported.includes(ext) ? ext : 'pdf';
    const mimeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return { extension: finalExt, mimeType: mimeType || mimeMap[finalExt] || 'application/octet-stream' };
  }

  signedUrl(publicId, resourceType = 'image', ttlSeconds = 3600, attachment = false) {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    return cloudinary.utils.private_download_url(publicId, null, {
      resource_type: resourceType,
      expires_at: expiresAt,
      attachment,
    });
  }

  // Upload PDFs as image (default). Upload DOC/DOCX as raw with Aspose conversion.
  async uploadResume(file, originalName, studentId, studentName, mimeType = null) {
    if (!this.isConfigured) throw new Error('Cloudinary not configured');
    if (!studentId) throw new Error('Student ID required');

    const buffer = this.toBuffer(file);
    const { extension, mimeType: finalMime } = this.deriveFileInfo(originalName, mimeType);
    const folderPath = this.safeFolderPath(studentId, studentName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueFileName = `resume_${studentId}_${timestamp}`; // base name only; folder is passed separately

    const isPdf = extension === 'pdf';
    const isDoc = extension === 'doc' || extension === 'docx';
    const resourceType = isPdf ? 'image' : 'raw';

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: uniqueFileName,
          folder: folderPath,
          // PDFs as image (default). For DOC/DOCX: raw + aspose conversion
          ...(isDoc ? { resource_type: 'raw', raw_convert: 'aspose' } : {}),
          overwrite: false,
          unique_filename: true,
          access_mode: 'public',
          tags: [`student_${studentId}`, 'resume', 'placement_erp'],
        },
        (err, res) => (err ? reject(err) : resolve(res))
      ).end(buffer);
    });

    const publicId = uploadResult.public_id; // EXACT id to persist
    return {
      fileId: publicId,
      resourceType,
      fileName: `${uniqueFileName}.${extension}`,
      // secure_url is convenient, but we also provide a signed URL for reliable access
      fileUrl: this.signedUrl(publicId, resourceType, 3600, false),
      folder: folderPath,
      size: uploadResult.bytes || buffer.length,
      uploadDate: uploadResult.created_at || new Date().toISOString(),
      extension,
      mimeType: finalMime,
      secureUrl: uploadResult.secure_url,
    };
  }

  // Delete: pass the correct resource type (image for PDFs, raw for docs)
  async deleteFile(fileId, resourceType = 'image') {
    if (!this.isConfigured) throw new Error('Cloudinary not configured');
    if (!fileId || typeof fileId !== 'string') throw new Error('Invalid file ID');
    return await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        fileId,
        { resource_type: resourceType },
        (error, result) => (error ? reject(error) : resolve(result))
      );
    });
  }

  // Get file info: pass the correct resource type (image/raw)
  async getFileInfo(fileId, resourceType = 'image') {
    if (!this.isConfigured) throw new Error('Cloudinary not configured');
    if (!fileId || typeof fileId !== 'string') throw new Error('Invalid file ID');
    const info = await new Promise((resolve, reject) => {
      cloudinary.api.resource(
        fileId,
        { resource_type: resourceType },
        (error, result) => (error ? reject(error) : resolve(result))
      );
    });
    const url = this.signedUrl(fileId, resourceType, 1800, false);
    return {
      id: info.public_id,
      name: info.public_id.split('/').pop(),
      size: info.bytes,
      url,
      format: info.format,
      created_at: info.created_at,
      updated_at: info.updated_at,
      folder: info.folder,
      resourceType,
    };
  }

  // Helper for listing under a folder if needed
  async listByPrefix(prefix, resourceType = 'image', max = 100) {
    const res = await new Promise((resolve, reject) => {
      cloudinary.api.resources(
        { type: 'upload', prefix, max_results: max, resource_type: resourceType },
        (error, result) => (error ? reject(error) : resolve(result))
      );
    });
    return (res.resources || []).map((r) => ({
      id: r.public_id,
      url: this.signedUrl(r.public_id, resourceType, 1800, false),
      bytes: r.bytes,
      format: r.format,
      created_at: r.created_at,
      resourceType,
    }));
  }
}

export default new CloudinaryService();