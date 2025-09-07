// ==========================
// services/atsAnalysis.js - Enhanced ATS analysis using Gemini AI
// ==========================

import geminiClient from '../utils/geminiClient.js';
import logger from '../utils/logger.js';

// Main ATS analysis function - now uses Gemini AI with proper text extraction
export const analyzeATS = async (fileBuffer, fileName, mimeType, jobRole) => {
  try {
    logger.info(`🔍 Starting ATS analysis for ${fileName} (${jobRole})`);
    
    // Use the enhanced Gemini client for complete analysis
    const analysis = await geminiClient.analyzeResumeATS(fileBuffer, mimeType, fileName, jobRole);
    
    logger.success(`✅ ATS analysis completed for ${fileName} (Score: ${analysis.score})`);
    
    return {
      success: true,
      data: analysis,
      metadata: analysis.metadata
    };
    
  } catch (error) {
    logger.error(`❌ ATS analysis failed for ${fileName}:`, error);
    
    // Return fallback analysis on error
    return {
      success: false,
      error: error.message,
      data: geminiClient.getFallbackAnalysis(jobRole),
      metadata: {
        fileName,
        jobRole,
        mimeType,
        analysisDate: new Date().toISOString(),
        aiModel: 'fallback-error'
      }
    };
  }
}

// Legacy functions for backward compatibility
const analyzeResumeContent = (content) => {
  // This is now deprecated - use Gemini AI instead
  console.log('⚠️ analyzeResumeContent is deprecated - use Gemini AI instead')
  return {
    score: 50,
    keywords: ['Legacy analysis'],
    mistakes: ['Use Gemini AI for better analysis'],
    suggestions: ['Update to use new AI service'],
    overall: 'Fair'
  }
}

const extractTextFromBuffer = async (fileBuffer, fileName) => {
  // This is now deprecated - use Gemini AI instead
  console.log('⚠️ extractTextFromBuffer is deprecated - use Gemini AI instead')
  return 'Legacy text extraction - use Gemini AI instead'
}

export { analyzeResumeContent, extractTextFromBuffer }
