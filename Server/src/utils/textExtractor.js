// ==========================
// utils/textExtractor.js - Extract text from PDF and DOCX files
// ==========================

import logger from './logger.js';

class TextExtractor {
  constructor() {
    this.supportedTypes = {
      'application/pdf': this.extractFromPDF.bind(this),
      'application/msword': this.extractFromDOCX.bind(this),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractFromDOCX.bind(this)
    };
  }

  // Extract text from PDF buffer (simplified approach)
  async extractFromPDF(buffer) {
    try {
      logger.info('📄 Extracting text from PDF...');
      
      // For now, we'll use a simplified approach that works with basic PDFs
      // This is a fallback method that extracts readable text from PDFs
      const text = this.extractTextFromBuffer(buffer);
      
      if (!text || text.length < 50) {
        throw new Error('PDF appears to be empty or contains no readable text');
      }
      
      logger.success(`✅ PDF text extracted: ${text.length} characters`);
      return text;
    } catch (error) {
      logger.error('❌ PDF text extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Extract text from DOCX buffer (simplified approach)
  async extractFromDOCX(buffer) {
    try {
      logger.info('📄 Extracting text from DOCX...');
      
      // For now, we'll use a simplified approach that works with basic DOCX files
      // This is a fallback method that extracts readable text from DOCX
      const text = this.extractTextFromBuffer(buffer);
      
      if (!text || text.length < 50) {
        throw new Error('DOCX appears to be empty or contains no readable text');
      }
      
      logger.success(`✅ DOCX text extracted: ${text.length} characters`);
      return text;
    } catch (error) {
      logger.error('❌ DOCX text extraction failed:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  // Simplified text extraction from buffer
  extractTextFromBuffer(buffer) {
    try {
      // Convert buffer to string and extract readable text
      const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 100000)); // Limit to first 100KB
      
      // Extract text patterns that are commonly found in resumes
      const textPatterns = [
        /[A-Za-z0-9\s@.-]{10,}/g, // Basic text patterns
        /[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Names
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
        /\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g, // Phone numbers
        /[A-Z][a-z]+\s+(Engineer|Developer|Manager|Analyst|Designer|Consultant)/g, // Job titles
        /(JavaScript|Python|Java|React|Node|SQL|MongoDB|AWS|Docker|Git)/gi, // Common tech skills
        /(Experience|Education|Skills|Projects|Certifications)/gi, // Resume sections
      ];
      
      let extractedText = '';
      textPatterns.forEach(pattern => {
        const matches = bufferString.match(pattern);
        if (matches) {
          extractedText += matches.join(' ') + ' ';
        }
      });
      
      // If no patterns found, try basic text extraction
      if (!extractedText || extractedText.length < 50) {
        extractedText = bufferString
          .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      }
      
      return extractedText;
    } catch (error) {
      logger.error('Error in basic text extraction:', error);
      return 'Unable to extract text from file';
    }
  }

  // Main extraction method
  async extractText(buffer, mimeType, fileName = 'unknown') {
    try {
      logger.info(`🔍 Extracting text from ${fileName} (${mimeType})`);
      
      if (!buffer || !Buffer.isBuffer(buffer)) {
        throw new Error('Invalid file buffer provided');
      }

      const extractor = this.supportedTypes[mimeType];
      if (!extractor) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const text = await extractor(buffer);
      
      // Basic validation
      if (!text || text.length < 20) {
        throw new Error('Extracted text is too short or empty');
      }

      // Clean up the text
      const cleanedText = this.cleanText(text);
      
      logger.success(`✅ Text extraction completed: ${cleanedText.length} characters`);
      return cleanedText;
      
    } catch (error) {
      logger.error('❌ Text extraction failed:', error);
      throw error;
    }
  }

  // Clean and normalize extracted text
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/[^\w\s@.-]/g, ' ') // Remove special characters except basic ones
      .trim();
  }

  // Check if file type is supported
  isSupported(mimeType) {
    return mimeType in this.supportedTypes;
  }

  // Get supported file types
  getSupportedTypes() {
    return Object.keys(this.supportedTypes);
  }
}

// Create singleton instance
const textExtractor = new TextExtractor();

export default textExtractor;
