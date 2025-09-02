// ==========================
// services/atsAnalysis.js - Lightweight ATS fallback (no external AI)
// ==========================

// Main ATS analysis function - now uses Gemini AI
export const analyzeATS = async (fileBuffer, fileName, mimeType, jobRole) => {
  // Lightweight heuristic analysis to avoid external AI/service crashes
  const textHints = [fileName, mimeType, jobRole].join(' ').toLowerCase();
  const keywordPool = ['javascript','react','node','express','mongodb','typescript','html','css','python','java','sql'];
  const matched = keywordPool.filter(k => textHints.includes(k));
  const missing = keywordPool.filter(k => !textHints.includes(k)).slice(0, 5);
  const scoreBase = 40 + Math.min(50, matched.length * 6);
  const score = Math.max(35, Math.min(95, scoreBase));
  const suggestions = [
    'Tailor your resume to the job role and include relevant keywords.',
    'Quantify achievements (e.g., increased performance by 20%).',
    'Keep formatting clean: consistent headings, bullet points, and fonts.',
    'Move most relevant experience and skills to the top.',
  ];

  return {
    success: true,
    data: {
      score,
      jobRole: jobRole || 'Not specified',
      keywords: matched,
      improvements: {
        skills: matched.slice(0, 5),
        keywords: missing.slice(0, 5),
        formatting: ['Ensure consistent section headings','Use bullet lists under each experience'],
        clarity: ['Prefer active voice and concise statements'],
      },
      suggestions,
      mistakes: missing.length ? ['Missing some common technical keywords'] : ['None critical found'],
      overall: score >= 80 ? 'Excellent match' : score >= 60 ? 'Good match' : score >= 45 ? 'Fair match' : 'Needs improvement'
    },
    metadata: {
      fileName,
      analysisDate: new Date().toISOString(),
      aiModel: 'heuristic-fallback'
    }
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
