

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

  // Generate a view URL. If attachmentName is provided, Cloudinary may force download; omit for inline viewing
  generateViewUrl(publicId, resourceType = 'image', format = 'pdf', attachmentName) {
    // For PDFs stored as images, use the same method as download URLs but without attachment
    // This ensures the URL works for viewing in browsers
    
    const nowUtcSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = nowUtcSeconds + 3600; // 1 hour expiry
    
    // Use cloudinary's private_download_url but without attachment for inline viewing
    const viewUrl = cloudinary.utils.private_download_url(publicId, format, {
      secure: true,
      resource_type: resourceType,
      type: 'upload',
      expires_at: expiresAt,
      attachment: false, // This is the key difference - no forced download
      sign_url: true,
    });
    
    console.log('👁️ Generated Cloudinary View URL:', {
      publicId,
      resourceType,
      format,
      attachmentName: attachmentName || 'none (inline view)',
      url: viewUrl,
      willForceDownload: !!attachmentName,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    });
    
    return viewUrl;
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

    const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
      secure: true,
      resource_type: resourceType,
      type: deliveryType,
      expires_at: expiresAt,
      attachment,
      sign_url: true,
    });

    console.log('🔗 Generated Cloudinary Download URL:', {
      publicId,
      format,
      resourceType,
      deliveryType,
      attachment,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      url: downloadUrl
    });

    return downloadUrl;
    
  }

  // Unified helper: always return image/pdf URLs (we convert DOC/DOCX on upload)
  async generateAutoDownloadUrl(publicId, options = {}) {
    const { signed = false, ttlSeconds = 1800, deliveryType = 'upload', attachment = 'resume.pdf' } = options;
    if (!signed) {
      // For view URLs, don't pass attachment to avoid forced download
      return this.generateViewUrl(publicId, 'image', 'pdf');
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

  // Resolve the best inline-viewable PDF URL for a given publicId
  // async generateInlinePdfViewUrl(publicId) {
  //   try {
  //     // First try as image/pdf (native PDFs uploaded as image resource)
  //     try {
  //       const imgInfo = await cloudinary.api.resource(publicId, { resource_type: 'image' });
  //       if (imgInfo && (imgInfo.format === 'pdf' || imgInfo.type === 'upload')) {
  //         return this.generateViewUrl(publicId, 'image', 'pdf');
  //       }
  //     } catch (_e) {
  //       // ignore and try raw
  //     }

  //     // Then try as raw. If raw is already a PDF, use raw URL; else use derived PDF if present
  //     try {
  //       const rawInfo = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
  //       if (rawInfo) {
  //         if (rawInfo.format === 'pdf') {
  //           return cloudinary.url(publicId, { secure: true, resource_type: 'raw', type: 'upload' });
  //         }
  //         if (Array.isArray(rawInfo.derived) && rawInfo.derived.length > 0) {
  //           const pdfDerived = rawInfo.derived.find(d => (d.format === 'pdf') || (typeof d.secure_url === 'string' && d.secure_url.toLowerCase().endsWith('.pdf')));
  //           if (pdfDerived && pdfDerived.secure_url) {
  //             return pdfDerived.secure_url;
  //           }
  //         }
  //       }
  //     } catch (_e2) {}
  //   } catch (err) {
  //     console.error('❌ generateInlinePdfViewUrl error:', err);
  //   }
  //   return null;
  // }



  async generateInlinePdfViewUrl(publicId) {
    try {
      console.log('🔍 Generating inline PDF view URL for:', publicId);
      
      // 1) Check as image resource (Cloudinary sometimes stores PDFs as images)
      try {
        const imgInfo = await cloudinary.api.resource(publicId, { resource_type: 'image' });
        if (imgInfo) {
          // Direct PDF as image
          if (imgInfo.format === 'pdf' && imgInfo.secure_url) {
            console.log('✅ Found as image PDF:', imgInfo.secure_url);
            return imgInfo.secure_url;
          }
  
          // Check derived PDFs
          if (Array.isArray(imgInfo.derived)) {
            const pdfDerived = imgInfo.derived.find(d => d.format === 'pdf' || d.secure_url?.endsWith('.pdf'));
            if (pdfDerived?.secure_url) {
              console.log('✅ Found derived PDF from image:', pdfDerived.secure_url);
              return pdfDerived.secure_url;
            }
          }
        }
      } catch (errImage) {
        console.log('⚠️ Not found as image resource:', errImage.message);
      }
  
      // 2) Check as raw resource (DOC/DOCX often stored here)
      try {
        const rawInfo = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
        if (rawInfo) {
          // Direct PDF in raw
          if (rawInfo.format === 'pdf' && rawInfo.secure_url) {
            console.log('✅ Found as raw PDF:', rawInfo.secure_url);
            return rawInfo.secure_url;
          }
  
          // Derived PDF from raw
          if (Array.isArray(rawInfo.derived)) {
            const pdfDerived = rawInfo.derived.find(d => d.format === 'pdf' || d.secure_url?.endsWith('.pdf'));
            if (pdfDerived?.secure_url) {
              console.log('✅ Found derived PDF from raw:', pdfDerived.secure_url);
              return pdfDerived.secure_url;
            }
          }
        }
      } catch (errRaw) {
        console.log('⚠️ Not found as raw resource:', errRaw.message);
      }
  
      // 3) Fallback: build direct PDF URL if all else fails
      const fallbackUrl = cloudinary.url(publicId, {
        secure: true,
        resource_type: 'image',
        type: 'upload',
        format: 'pdf'
      });
      console.log('🔄 Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    } catch (err) {
      console.error('❌ generateInlinePdfViewUrl error:', err);
      return null;
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
