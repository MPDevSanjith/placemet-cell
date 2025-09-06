// services/geminiATS.js (ESM)
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractTextFromBuffer = async (fileBuffer, fileName, mimeType) => {
  if (mimeType === 'application/pdf') {
    const pdfData = await pdfParse(fileBuffer);
    return pdfData.text.trim();
  } else if (
    mimeType.includes('word') ||
    mimeType.includes('document')
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value.trim();
  }
  throw new Error('Unsupported file type');
};

const analyzeResumeWithGemini = async (resumeText, jobRole) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an ATS system evaluator. Compare the following resume against the target job role.

Resume:
${resumeText}

Target Job Role:
${jobRole}

Return a JSON object only, with this format:
{
  "score": number (0-100),
  "matchToJobRole": "Excellent/Good/Fair/Poor",
  "keywordsMatched": ["keyword1", "keyword2"],
  "missingKeywords": ["keywordX", "keywordY"],
  "strengths": ["point1", "point2"],
  "weaknesses": ["point1", "point2"],
  "suggestions": ["point1", "point2"]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response from Gemini AI');

  return JSON.parse(jsonMatch[0]);
};

export const analyzeATS = async (fileBuffer, fileName, mimeType, jobRole) => {
  try {
    const resumeText = await extractTextFromBuffer(fileBuffer, fileName, mimeType);
    const analysis = await analyzeResumeWithGemini(resumeText, jobRole);

    return {
      success: true,
      data: analysis,
      metadata: {
        fileName,
        jobRole,
        analysisDate: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('ATS analysis failed:', err);
    return { success: false, error: err.message };
  }
};
