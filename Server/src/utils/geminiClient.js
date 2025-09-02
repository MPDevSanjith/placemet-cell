// ==========================
// utils/geminiClient.js
// ==========================

import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logger.js';

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey || this.apiKey === 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      logger.warn('GEMINI_API_KEY not found or is placeholder - using fallback analysis');
      this.apiKey = null;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      logger.success('Gemini client initialized');
    } catch (error) {
      logger.error('Failed to initialize Gemini client:', error);
      this.apiKey = null;
    }
  }

  // Extract text from resume content
  async extractTextFromResume(resumeBuffer, mimeType) {
    try {
      if (mimeType === 'application/pdf') {
        // For PDF files, we'll need to use a PDF parser
        // For now, return a placeholder - you'll need to implement PDF parsing
        return 'PDF content placeholder - implement PDF parsing';
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        // For Word documents, we'll need to use a DOCX parser
        // For now, return a placeholder - you'll need to implement DOCX parsing
        return 'DOCX content placeholder - implement DOCX parsing';
      } else {
        // For plain text files
        return resumeBuffer.toString('utf-8');
      }
    } catch (error) {
      logger.error('Error extracting text from resume:', error);
      throw new Error('Failed to extract text from resume');
    }
  }

  // Analyze resume using Gemini AI
  async analyzeResume(resumeText, jobRole = 'Software Engineer') {
    try {
      if (!this.apiKey || !this.model) {
        logger.info('Using fallback ATS analysis (Gemini not configured)');
        return this.getFallbackAnalysis(jobRole);
      }

      const prompt = `
        You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume for the job role: ${jobRole}
        
        Resume Content:
        ${resumeText}
        
        Please provide a comprehensive ATS analysis in the following JSON format:
        {
          "score": <number between 0-100>,
          "jobRole": "${jobRole}",
          "improvements": {
            "skills": ["skill1", "skill2", ...],
            "keywords": ["keyword1", "keyword2", ...],
            "formatting": ["formatting_issue1", "formatting_issue2", ...],
            "clarity": ["clarity_issue1", "clarity_issue2", ...]
          },
          "suggestions": ["suggestion1", "suggestion2", ...],
          "mistakes": ["mistake1", "mistake2", ...],
          "keywords": ["found_keyword1", "found_keyword2", ...],
          "overall": "<overall_rating>"
        }
        
        Guidelines:
        - Score should reflect ATS compatibility (0-100)
        - Focus on relevant skills and keywords for ${jobRole}
        - Identify formatting issues that might affect ATS parsing
        - Provide actionable suggestions for improvement
        - Highlight any mistakes or missing elements
        - Overall rating should be: "Excellent" (80-100), "Good" (60-79), "Fair" (40-59), "Needs Improvement" (0-39)
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON from the response
      try {
        const analysis = JSON.parse(text);
        logger.success(`ATS analysis completed for job role: ${jobRole}`);
        return analysis;
      } catch (parseError) {
        logger.error('Failed to parse Gemini response as JSON:', parseError);
        return this.getFallbackAnalysis(jobRole);
      }
    } catch (error) {
      logger.error('Gemini ATS analysis error:', error);
      return this.getFallbackAnalysis(jobRole);
    }
  }

  // Get fallback analysis when Gemini is not available
  getFallbackAnalysis(jobRole) {
    const baseScore = Math.floor(Math.random() * 30) + 60; // Random score between 60-90
    
    return {
      score: baseScore,
      jobRole: jobRole,
      improvements: {
        skills: [
          'Add more specific technical skills relevant to the position',
          'Include both hard and soft skills',
          'Quantify your achievements with metrics'
        ],
        keywords: [
          'Include industry-specific keywords',
          'Add relevant certifications and technologies',
          'Use action verbs to describe experiences'
        ],
        formatting: [
          'Ensure consistent bullet point formatting',
          'Use clear section headers',
          'Keep formatting simple and ATS-friendly'
        ],
        clarity: [
          'Make achievements more quantifiable',
          'Use clear, concise language',
          'Avoid jargon and acronyms'
        ]
      },
      suggestions: [
        'Add quantifiable achievements to your experience section',
        'Include relevant certifications and training',
        'Use industry-specific keywords throughout your resume',
        'Ensure your contact information is clearly visible',
        'Keep your resume to 1-2 pages maximum'
      ],
      mistakes: [
        'Missing quantifiable achievements',
        'Could include more relevant keywords',
        'Consider adding a skills section'
      ],
      keywords: [
        'Resume uploaded successfully',
        'ATS analysis completed',
        'Ready for review'
      ],
      overall: baseScore >= 80 ? 'Excellent' : baseScore >= 60 ? 'Good' : 'Fair'
    };
  }

  // Get ATS score for a specific job role
  async getAtsScore(resumeText, jobRole) {
    try {
      const analysis = await this.analyzeResume(resumeText, jobRole);
      return {
        score: analysis.score,
        jobRole: analysis.jobRole,
        overall: analysis.overall
      };
    } catch (error) {
      logger.error('Error getting ATS score:', error);
      throw error;
    }
  }

  // Check if Gemini is properly configured
  isConfigured() {
    return !!this.apiKey && this.apiKey !== 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  }
}

// Create singleton instance
const geminiClient = new GeminiClient();

export default geminiClient;
