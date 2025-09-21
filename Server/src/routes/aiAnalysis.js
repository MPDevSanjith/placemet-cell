import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Student from '../models/Student.js';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import geminiClient from '../utils/geminiClient.js';
import cacheService from '../services/cacheService.js';

const router = express.Router();

// In-memory cache for database context (fallback)
let databaseContextCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache (reduced for faster updates)

// AI Analysis endpoint for placement officers
router.post('/analyze', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const { query, analysisType = 'general' } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string'
      });
    }

    console.log(`🤖 AI Analysis request: "${query}" (Type: ${analysisType})`);
    const requestStartTime = Date.now();

    // Check if this is a simple query that can use fast fallback
    const queryLower = query.toLowerCase();
    const isSimpleQuery = queryLower.includes('list') || 
                         queryLower.includes('show') || 
                         queryLower.includes('give me') ||
                         queryLower.includes('students') ||
                         queryLower.includes('details about');

    // Check AI response cache first
    const aiCacheKey = cacheService.getAIAnalysisKey(query);
    const cachedAIResponse = await cacheService.get(aiCacheKey);
    
    let aiResponse;
    
    if (cachedAIResponse) {
      console.log('🚀 Using cached AI response');
      aiResponse = cachedAIResponse;
    } else if (isSimpleQuery) {
      console.log('⚡ Using fast fallback for simple query');
      // Gather comprehensive database data
      const databaseContext = await gatherDatabaseContext();
      aiResponse = generateFallbackResponse(query, databaseContext, analysisType);
      // Cache the fallback response
      await cacheService.set(aiCacheKey, aiResponse, 600); // 10 minutes cache
    } else {
      console.log('🤖 Generating new AI response');
      // Gather comprehensive database data
      const databaseContext = await gatherDatabaseContext();
      // Generate AI response using Gemini for complex queries
      aiResponse = await generateAIResponse(query, databaseContext, analysisType);
      // Cache the AI response
      await cacheService.set(aiCacheKey, aiResponse, 1800); // 30 minutes cache
    }
    
    // Generate reports if requested (only for complex queries)
    const reports = isSimpleQuery ? [] : await generateReports(query, databaseContext, analysisType);

    const requestEndTime = Date.now();
    const totalTime = requestEndTime - requestStartTime;
    
    console.log(`✅ AI Analysis completed in ${totalTime}ms (${isSimpleQuery ? 'Fast Fallback' : 'AI Generated'})`);

    res.json({
      success: true,
      query: query.trim(),
      analysisType,
      response: aiResponse,
      reports,
      timestamp: new Date().toISOString(),
      dataContext: {
        totalStudents: databaseContext.students.length,
        totalJobs: databaseContext.jobs.length,
        totalCompanies: databaseContext.companies.length
      },
      performance: {
        totalTime: totalTime,
        method: isSimpleQuery ? 'fast_fallback' : 'ai_generated'
      }
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    // If it's a timeout error, try to provide a fallback response
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      try {
        const databaseContext = await gatherDatabaseContext();
        const fallbackResponse = generateFallbackResponse(query, databaseContext, analysisType);
        
        res.json({
          success: true,
          query: query.trim(),
          analysisType,
          response: fallbackResponse,
          reports: [],
          timestamp: new Date().toISOString(),
          dataContext: {
            totalStudents: databaseContext.students.length,
            totalJobs: databaseContext.jobs.length,
            totalCompanies: databaseContext.companies.length
          }
        });
        return;
      } catch (fallbackError) {
        console.error('Fallback response error:', fallbackError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'AI analysis failed',
      details: error.message
    });
  }
});

// Get available analysis types and sample queries
router.get('/capabilities', protect, authorize('placement_officer', 'admin'), async (req, res) => {
  try {
    const capabilities = {
      analysisTypes: [
        'general',
        'student_analysis',
        'placement_analysis',
        'eligibility_analysis',
        'report_generation',
        'trend_analysis',
        'comparative_analysis'
      ],
      sampleQueries: [
        'Give me the list of all MCA students',
        'Show me all BTech students',
        'List all students from CSE department',
        'Show me students with CGPA above 8.0',
        'Generate a report of placed students in 2024',
        'What is the placement rate by department?',
        'Find students eligible for software engineering roles',
        'Compare placement statistics between UG and PG programs',
        'Show me students with backlogs and their details',
        'Generate a comprehensive placement report',
        'What are the top performing departments?',
        'Find students who haven\'t completed onboarding',
        'Show me all IT department students',
        'List students from 2025 batch',
        'Generate course-wise placement analysis',
        'Show me students with attendance below 75%',
        'Find all placed students with company details',
        'Compare performance between different courses',
        'Show me year-wise student distribution',
        'Generate department-wise placement statistics',
        'List all MTech students',
        'Show me BCA students with their details',
        'Find students from Mechanical Engineering',
        'Generate overall database summary',
        'Show me students with highest CGPA',
        'List all companies that recruited students',
        'Compare placement rates across years',
        'Show me students with zero backlogs',
        'Generate academic performance report',
        'Find students eligible for specific job roles'
      ],
      supportedFormats: ['json', 'csv', 'pdf', 'excel'],
      dataSources: [
        'students',
        'jobs',
        'companies',
        'placements',
        'eligibility_criteria',
        'academic_performance'
      ]
    };

    res.json({
      success: true,
      capabilities
    });
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get capabilities'
    });
  }
});

// Clear cache endpoint for admin
router.post('/clear-cache', protect, authorize('placement_officer', 'admin'), (req, res) => {
  databaseContextCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Database cache cleared');
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// Helper function to gather comprehensive database context
async function gatherDatabaseContext() {
  try {
    // Check Redis cache first
    const cacheKey = 'database:context:full';
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log('🚀 Using Redis cached database context');
      return cachedData;
    }

    // Check in-memory cache as fallback
    if (databaseContextCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Using in-memory cached database context');
      return databaseContextCache;
    }

    console.log('🔄 Fetching fresh database context...');
    const startTime = Date.now();

    // Ultra-optimized queries using aggregation pipeline
    const [students, jobs, companies] = await Promise.all([
      Student.aggregate([
        {
          $project: {
            name: 1,
            email: 1,
            rollNumber: 1,
            branch: 1,
            course: 1,
            year: 1,
            section: 1,
            programType: 1,
            isActive: 1,
            isPlaced: 1,
            'placementDetails.companyName': 1,
            'placementDetails.jobRole': 1,
            'placementDetails.ctc': 1,
            'onboardingData.academicInfo.gpa': 1,
            'eligibilityCriteria.attendancePercentage': 1,
            'eligibilityCriteria.backlogs': 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        { $limit: 1000 }
      ]),
      Job.aggregate([
        {
          $project: {
            title: 1,
            companyName: 1,
            location: 1,
            salaryMin: 1,
            salaryMax: 1,
            requirements: 1,
            status: 1,
            createdAt: 1
          }
        },
        { $limit: 500 }
      ]),
      Company.aggregate([
        {
          $project: {
            name: 1,
            email: 1,
            phone: 1,
            website: 1,
            industry: 1,
            location: 1,
            status: 1,
            createdAt: 1
          }
        },
        { $limit: 200 }
      ])
    ]);

    // Process students data for better analysis with data normalization
    const processedStudents = students.map(student => {
      // Normalize course names
      const normalizedCourse = normalizeCourseName(student.course);
      
      // Normalize department/branch names
      const normalizedBranch = normalizeDepartmentName(student.branch);
      
      // Normalize program type
      const normalizedProgramType = normalizeProgramType(student.programType);
      
      return {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        branch: normalizedBranch,
        course: normalizedCourse,
        year: student.year,
        section: student.section,
        programType: normalizedProgramType,
        isActive: student.isActive,
        isPlaced: student.isPlaced,
        placementDetails: student.placementDetails,
        academicInfo: student.onboardingData?.academicInfo || {},
        eligibilityCriteria: student.eligibilityCriteria || {},
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        // Keep original values for reference
        originalBranch: student.branch,
        originalCourse: student.course,
        originalProgramType: student.programType
      };
    });

    // Generate essential statistics only (optimized for speed)
    const statistics = generateComprehensiveStatistics(processedStudents, jobs, companies);
    
    // Generate course-wise breakdown (simplified)
    const courseBreakdown = generateCourseBreakdown(processedStudents);
    
    // Generate department-wise breakdown (simplified)
    const departmentBreakdown = generateDepartmentBreakdown(processedStudents);
    
    // Generate year-wise breakdown (simplified)
    const yearBreakdown = generateYearBreakdown(processedStudents);
    
    // Generate placement analysis (simplified)
    const placementAnalysis = generatePlacementAnalysis(processedStudents);

    const context = {
      students: processedStudents,
      jobs: jobs,
      companies: companies,
      statistics,
      courseBreakdown,
      departmentBreakdown,
      yearBreakdown,
      placementAnalysis
    };

    // Cache the result in both Redis and memory
    await cacheService.set(cacheKey, context, 300); // 5 minutes Redis cache
    databaseContextCache = context;
    cacheTimestamp = Date.now();
    
    const endTime = Date.now();
    console.log(`✅ Database context loaded in ${endTime - startTime}ms`);

    return context;
  } catch (error) {
    console.error('Error gathering database context:', error);
    throw error;
  }
}

// Generate comprehensive statistics
function generateComprehensiveStatistics(students, jobs, companies) {
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.isActive).length;
  const placedStudents = students.filter(s => s.isPlaced).length;
  const blockedStudents = totalStudents - activeStudents;
  const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

  // Academic performance stats
  const studentsWithGpa = students.filter(s => s.academicInfo?.gpa);
  const avgGpa = studentsWithGpa.length > 0 ? 
    (studentsWithGpa.reduce((sum, s) => sum + s.academicInfo.gpa, 0) / studentsWithGpa.length) : 0;

  // Eligibility stats
  const studentsWithAttendance = students.filter(s => s.eligibilityCriteria?.attendancePercentage);
  const avgAttendance = studentsWithAttendance.length > 0 ?
    (studentsWithAttendance.reduce((sum, s) => sum + s.eligibilityCriteria.attendancePercentage, 0) / studentsWithAttendance.length) : 0;

  const studentsWithBacklogs = students.filter(s => s.eligibilityCriteria?.backlogs > 0);
  const backlogRate = totalStudents > 0 ? Math.round((studentsWithBacklogs.length / totalStudents) * 100) : 0;

  return {
    totalStudents,
    activeStudents,
    placedStudents,
    blockedStudents,
    totalJobs: jobs.length,
    totalCompanies: companies.length,
    placementRate,
    academicPerformance: {
      studentsWithGpa: studentsWithGpa.length,
      averageGpa: Math.round(avgGpa * 100) / 100,
      studentsWithAttendance: studentsWithAttendance.length,
      averageAttendance: Math.round(avgAttendance * 100) / 100,
      studentsWithBacklogs: studentsWithBacklogs.length,
      backlogRate
    }
  };
}

// Generate course-wise breakdown
function generateCourseBreakdown(students) {
  const courseMap = new Map();
  
  students.forEach(student => {
    const course = student.course || 'Unspecified';
    if (!courseMap.has(course)) {
      courseMap.set(course, {
        course,
        total: 0,
        active: 0,
        placed: 0,
        avgGpa: 0,
        students: []
      });
    }
    
    const courseData = courseMap.get(course);
    courseData.total++;
    courseData.students.push(student);
    
    if (student.isActive) courseData.active++;
    if (student.isPlaced) courseData.placed++;
  });

  // Calculate averages and rates
  courseMap.forEach((data, course) => {
    const studentsWithGpa = data.students.filter(s => s.academicInfo?.gpa);
    data.avgGpa = studentsWithGpa.length > 0 ? 
      Math.round((studentsWithGpa.reduce((sum, s) => sum + s.academicInfo.gpa, 0) / studentsWithGpa.length) * 100) / 100 : 0;
    data.placementRate = data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0;
    data.activeRate = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0;
  });

  return Array.from(courseMap.values()).sort((a, b) => b.total - a.total);
}

// Generate department-wise breakdown
function generateDepartmentBreakdown(students) {
  const deptMap = new Map();
  
  students.forEach(student => {
    const dept = student.branch || 'Unspecified';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        department: dept,
        total: 0,
        active: 0,
        placed: 0,
        courses: new Set(),
        students: []
      });
    }
    
    const deptData = deptMap.get(dept);
    deptData.total++;
    deptData.students.push(student);
    if (student.course) deptData.courses.add(student.course);
    
    if (student.isActive) deptData.active++;
    if (student.isPlaced) deptData.placed++;
  });

  // Calculate rates and convert Set to Array
  deptMap.forEach((data, dept) => {
    data.placementRate = data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0;
    data.activeRate = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0;
    data.courses = Array.from(data.courses);
  });

  return Array.from(deptMap.values()).sort((a, b) => b.total - a.total);
}

// Generate year-wise breakdown
function generateYearBreakdown(students) {
  const yearMap = new Map();
  
  students.forEach(student => {
    const year = student.year || 'Unspecified';
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        total: 0,
        active: 0,
        placed: 0,
        departments: new Set(),
        students: []
      });
    }
    
    const yearData = yearMap.get(year);
    yearData.total++;
    yearData.students.push(student);
    if (student.branch) yearData.departments.add(student.branch);
    
    if (student.isActive) yearData.active++;
    if (student.isPlaced) yearData.placed++;
  });

  // Calculate rates and convert Set to Array
  yearMap.forEach((data, year) => {
    data.placementRate = data.total > 0 ? Math.round((data.placed / data.total) * 100) : 0;
    data.activeRate = data.total > 0 ? Math.round((data.active / data.total) * 100) : 0;
    data.departments = Array.from(data.departments);
  });

  return Array.from(yearMap.values()).sort((a, b) => b.year.localeCompare(a.year));
}

// Generate placement analysis
function generatePlacementAnalysis(students) {
  const placedStudents = students.filter(s => s.isPlaced);
  
  // Company analysis
  const companyMap = new Map();
  placedStudents.forEach(student => {
    if (student.placementDetails?.companyName) {
      const company = student.placementDetails.companyName;
      if (!companyMap.has(company)) {
        companyMap.set(company, {
          company,
          count: 0,
          avgCtc: 0,
          students: []
        });
      }
      companyMap.get(company).count++;
      companyMap.get(company).students.push(student);
    }
  });

  // Calculate average CTC for each company
  companyMap.forEach((data, company) => {
    const studentsWithCtc = data.students.filter(s => s.placementDetails?.ctc);
    data.avgCtc = studentsWithCtc.length > 0 ?
      Math.round((studentsWithCtc.reduce((sum, s) => sum + s.placementDetails.ctc, 0) / studentsWithCtc.length) * 100) / 100 : 0;
  });

  // CTC analysis
  const ctcRanges = {
    '0-3 LPA': 0,
    '3-6 LPA': 0,
    '6-10 LPA': 0,
    '10+ LPA': 0
  };

  placedStudents.forEach(student => {
    const ctc = student.placementDetails?.ctc || 0;
    if (ctc <= 3) ctcRanges['0-3 LPA']++;
    else if (ctc <= 6) ctcRanges['3-6 LPA']++;
    else if (ctc <= 10) ctcRanges['6-10 LPA']++;
    else ctcRanges['10+ LPA']++;
  });

  return {
    totalPlaced: placedStudents.length,
    companies: Array.from(companyMap.values()).sort((a, b) => b.count - a.count),
    ctcRanges,
    topCompanies: Array.from(companyMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)
  };
}

// Generate AI response using Gemini
async function generateAIResponse(query, databaseContext, analysisType) {
  try {
    if (!geminiClient.isConfigured()) {
      return generateFallbackResponse(query, databaseContext, analysisType);
    }

    const prompt = buildAnalysisPrompt(query, databaseContext, analysisType);
    const model = geminiClient.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Add timeout to Gemini call (reduced from 20s to 10s)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini AI timeout')), 10000); // 10 second timeout
    });

    const geminiPromise = model.generateContent(prompt);
    const result = await Promise.race([geminiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    return {
      type: 'ai_response',
      content: text,
      confidence: 'high',
      model: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.error('Gemini AI response error:', error);
    return generateFallbackResponse(query, databaseContext, analysisType);
  }
}

// Build comprehensive prompt for AI analysis
function buildAnalysisPrompt(query, databaseContext, analysisType) {
  const { 
    students, 
    jobs, 
    companies, 
    statistics, 
    courseBreakdown, 
    departmentBreakdown, 
    yearBreakdown, 
    placementAnalysis 
  } = databaseContext;
  
  return `You are an expert placement officer AI assistant with access to the complete college placement database. Analyze the following query and provide comprehensive insights based on the database context.

QUERY: "${query}"
ANALYSIS TYPE: ${analysisType}

COMPREHENSIVE DATABASE CONTEXT:

OVERALL STATISTICS:
- Total Students: ${statistics.totalStudents}
- Active Students: ${statistics.activeStudents}
- Placed Students: ${statistics.placedStudents}
- Blocked Students: ${statistics.blockedStudents}
- Placement Rate: ${statistics.placementRate}%
- Total Jobs: ${statistics.totalJobs}
- Total Companies: ${statistics.totalCompanies}

ACADEMIC PERFORMANCE:
- Students with GPA data: ${statistics.academicPerformance.studentsWithGpa}
- Average GPA: ${statistics.academicPerformance.averageGpa}
- Students with Attendance data: ${statistics.academicPerformance.studentsWithAttendance}
- Average Attendance: ${statistics.academicPerformance.averageAttendance}%
- Students with Backlogs: ${statistics.academicPerformance.studentsWithBacklogs}
- Backlog Rate: ${statistics.academicPerformance.backlogRate}%

COURSE-WISE BREAKDOWN:
${courseBreakdown.map(course => 
  `- ${course.course}: ${course.total} students (${course.placed} placed, ${course.placementRate}% rate, Avg GPA: ${course.avgGpa})`
).join('\n')}

DEPARTMENT-WISE BREAKDOWN:
${departmentBreakdown.map(dept => 
  `- ${dept.department}: ${dept.total} students (${dept.placed} placed, ${dept.placementRate}% rate) - Courses: ${dept.courses.join(', ')}`
).join('\n')}

YEAR-WISE BREAKDOWN:
${yearBreakdown.map(year => 
  `- ${year.year}: ${year.total} students (${year.placed} placed, ${year.placementRate}% rate) - Departments: ${year.departments.join(', ')}`
).join('\n')}

PLACEMENT ANALYSIS:
- Total Placed: ${placementAnalysis.totalPlaced}
- Top Companies: ${placementAnalysis.topCompanies.map(c => `${c.company} (${c.count} students, Avg CTC: ${c.avgCtc} LPA)`).join(', ')}
- CTC Distribution: ${Object.entries(placementAnalysis.ctcRanges).map(([range, count]) => `${range}: ${count} students`).join(', ')}

SAMPLE STUDENT DATA (first 10 students):
${students.slice(0, 10).map(s => 
  `Name: ${s.name}, Email: ${s.email}, Roll: ${s.rollNumber}, Course: ${s.course}, Branch: ${s.branch}, Year: ${s.year}, Placed: ${s.isPlaced}, GPA: ${s.academicInfo?.gpa || 'N/A'}`
).join('\n')}

FULL STUDENT LIST (for individual student searches):
${students.map(s => 
  `- ${s.name} (${s.email}) - ${s.rollNumber} - ${s.course} - ${s.branch} - ${s.year} - ${s.isPlaced ? 'Placed' : 'Not Placed'}`
).join('\n')}

SAMPLE JOB DATA (first 3 jobs):
${JSON.stringify(jobs.slice(0, 3), null, 2)}

SAMPLE COMPANY DATA (first 3 companies):
${JSON.stringify(companies.slice(0, 3), null, 2)}

INSTRUCTIONS:
1. You have access to the COMPLETE database with ${statistics.totalStudents} students across ${courseBreakdown.length} courses and ${departmentBreakdown.length} departments
2. You can handle ANY type of query about the placement database - be comprehensive and helpful
3. For specific data requests (like "list all MCA students"), provide the actual filtered data in table format
4. For analysis requests, provide detailed insights with statistics from the breakdowns
5. For individual student queries, search through ALL student data using flexible matching
6. For placement/statistics queries, provide comprehensive overview with all relevant metrics
7. For company/job queries, provide recruitment and placement information
8. For help queries, provide detailed capabilities and sample queries
9. For any unrecognized query, provide a helpful overview and suggestions
10. Use the actual data from the database context - you have access to ALL students, courses, departments
11. Format responses in clear, structured manner with proper markdown formatting
12. Use tables for better data presentation when listing students or statistics
13. For individual student queries: provide ONLY student details in simple table format
14. For list queries: provide ONLY the list in table format - NO analysis or recommendations
15. For general queries: provide comprehensive analysis with actionable recommendations
16. When searching for students, use flexible matching (partial names, different cases, email, roll number)
17. Handle ALL possible query types and edge cases
18. Always be helpful and provide relevant information even for unclear queries
19. Use the comprehensive fallback system to ensure no query goes unanswered
20. Keep responses appropriate to the query type - concise for specific requests, detailed for general analysis

RESPONSE FORMAT:
- For individual student queries: Provide ONLY a simple table with student details - NO analysis or recommendations
- For list queries (like "list all MCA students"): Provide ONLY the list in table format - NO analysis, statistics, or recommendations
- For general queries: Start with a brief summary of what you found
- Provide the main analysis/answer with specific data in structured format
- Include relevant statistics and breakdowns in tables or lists
- If listing students, provide complete details in table format
- For general queries: End with actionable recommendations if applicable
- Use markdown formatting for better readability

Remember: You have access to the COMPLETE database with ${statistics.totalStudents} students. Use the actual data to provide accurate, specific responses for ANY course, department, or criteria mentioned in the query. The data has been normalized for consistency.`;
}

// Generate fallback response when AI is not available
function generateFallbackResponse(query, databaseContext, analysisType) {
  const { students, statistics, courseBreakdown, departmentBreakdown, yearBreakdown, placementAnalysis } = databaseContext;
  const queryLower = query.toLowerCase();

  // Individual student search queries
  if (queryLower.includes('details about') || queryLower.includes('information about') || queryLower.includes('student') || 
      queryLower.includes('show me') || queryLower.includes('find') || queryLower.includes('search') ||
      queryLower.includes('who is') || queryLower.includes('tell me about')) {
    // Extract potential student names from the query
    const namePatterns = [
      /details about\s+([a-zA-Z\s]+)/i,
      /information about\s+([a-zA-Z\s]+)/i,
      /student\s+([a-zA-Z\s]+)/i,
      /show me\s+([a-zA-Z\s]+)/i,
      /find\s+([a-zA-Z\s]+)/i,
      /search for\s+([a-zA-Z\s]+)/i,
      /who is\s+([a-zA-Z\s]+)/i,
      /tell me about\s+([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]{3,})/i  // General name pattern
    ];
    
    let searchName = '';
    for (const pattern of namePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        searchName = match[1].trim();
        break;
      }
    }
    
    if (searchName) {
      // Search for students by name (case-insensitive, partial match)
      const foundStudents = students.filter(student => {
        const studentName = (student.name || '').toLowerCase();
        const searchTerm = searchName.toLowerCase();
        
        // Check for exact match, partial match, or word boundary match
        return studentName === searchTerm || 
               studentName.includes(searchTerm) ||
               searchTerm.split(' ').every(word => studentName.includes(word)) ||
               studentName.split(' ').some(namePart => namePart.includes(searchTerm));
      });
      
      if (foundStudents.length > 0) {
        const student = foundStudents[0]; // Take the first match
        
        return {
          type: 'fallback_response',
          content: `## ${student.name}

| Field | Value |
|-------|-------|
| **Name** | ${student.name || 'N/A'} |
| **Email** | ${student.email || 'N/A'} |
| **Roll Number** | ${student.rollNumber || 'N/A'} |
| **Course** | ${student.course || 'N/A'} |
| **Department** | ${student.branch || 'N/A'} |
| **Year** | ${student.year || 'N/A'} |
| **Section** | ${student.section || 'N/A'} |
| **GPA** | ${student.academicInfo?.gpa || 'N/A'} |
| **Attendance** | ${student.eligibilityCriteria?.attendancePercentage || 'N/A'}% |
| **Backlogs** | ${student.eligibilityCriteria?.backlogs || 'N/A'} |
| **Placed** | ${student.isPlaced ? 'Yes' : 'No'} |
| **Company** | ${student.placementDetails?.companyName || 'N/A'} |
| **Package** | ${student.placementDetails?.ctc || 'N/A'} LPA |
| **Job Role** | ${student.placementDetails?.jobRole || 'N/A'} |
| **Status** | ${student.isActive ? 'Active' : 'Inactive'} |

${foundStudents.length > 1 ? `\n*Found ${foundStudents.length} students matching "${searchName}". Showing first match.*` : ''}`,
          confidence: 'high',
          model: 'enhanced_fallback'
        };
      } else {
        // Search by email or roll number if name not found
        const foundByEmail = students.find(s => s.email?.toLowerCase().includes(searchName.toLowerCase()));
        const foundByRoll = students.find(s => s.rollNumber?.toLowerCase().includes(searchName.toLowerCase()));
        
        if (foundByEmail || foundByRoll) {
          const student = foundByEmail || foundByRoll;
          return {
            type: 'fallback_response',
            content: `## ${student.name}

| Field | Value |
|-------|-------|
| **Name** | ${student.name || 'N/A'} |
| **Email** | ${student.email || 'N/A'} |
| **Roll Number** | ${student.rollNumber || 'N/A'} |
| **Course** | ${student.course || 'N/A'} |
| **Department** | ${student.branch || 'N/A'} |
| **Year** | ${student.year || 'N/A'} |
| **Section** | ${student.section || 'N/A'} |
| **GPA** | ${student.academicInfo?.gpa || 'N/A'} |
| **Attendance** | ${student.eligibilityCriteria?.attendancePercentage || 'N/A'}% |
| **Backlogs** | ${student.eligibilityCriteria?.backlogs || 'N/A'} |
| **Placed** | ${student.isPlaced ? 'Yes' : 'No'} |
| **Company** | ${student.placementDetails?.companyName || 'N/A'} |
| **Package** | ${student.placementDetails?.ctc || 'N/A'} LPA |
| **Job Role** | ${student.placementDetails?.jobRole || 'N/A'} |
| **Status** | ${student.isActive ? 'Active' : 'Inactive'} |`,
            confidence: 'high',
            model: 'enhanced_fallback'
          };
        }
      }
    }
  }

  // Placement and statistics queries
  if (queryLower.includes('placement') || queryLower.includes('placed') || queryLower.includes('statistics') || 
      queryLower.includes('stats') || queryLower.includes('overview') || queryLower.includes('summary') ||
      queryLower.includes('report') || queryLower.includes('analysis') || queryLower.includes('data')) {
    
    const totalStudents = statistics.totalStudents;
    const placedStudents = statistics.placedStudents;
    const placementRate = statistics.placementRate;
    const avgGpa = statistics.academicPerformance.averageGpa;
    
    return {
      type: 'fallback_response',
      content: `## Placement Overview

| Metric | Value |
|--------|-------|
| **Total Students** | ${totalStudents} |
| **Placed Students** | ${placedStudents} |
| **Placement Rate** | ${placementRate}% |
| **Average GPA** | ${avgGpa} |
| **Total Jobs** | ${statistics.totalJobs} |
| **Total Companies** | ${statistics.totalCompanies} |

### Course-wise Breakdown:
${courseBreakdown.map(course => 
  `- **${course.course}**: ${course.total} students (${course.placed} placed, ${course.placementRate}% rate)`
).join('\n')}

### Department-wise Breakdown:
${departmentBreakdown.map(dept => 
  `- **${dept.department}**: ${dept.total} students (${dept.placed} placed, ${dept.placementRate}% rate)`
).join('\n')}`,
      confidence: 'high',
      model: 'enhanced_fallback'
    };
  }

  // Course-specific queries
  if (queryLower.includes('course') || queryLower.includes('btech') || queryLower.includes('mca') || queryLower.includes('mtech') || queryLower.includes('bca') || queryLower.includes('mba') || queryLower.includes('mcom')) {
    let filteredStudents = students;
    let courseName = 'students';
    
    if (queryLower.includes('mca')) {
      // Enhanced MCA filtering - check both course and branch fields for MCA
      filteredStudents = students.filter(s => {
        const course = s.course?.toLowerCase() || '';
        const branch = s.branch?.toLowerCase() || '';
        const programType = s.programType?.toLowerCase() || '';
        const originalBranch = s.originalBranch?.toLowerCase() || '';
        
        // Debug logging for MCA filtering
        if (s.name && s.name.toLowerCase().includes('ashwini')) {
          console.log(`MCA Filter Debug for ${s.name}:`, {
            course: s.course,
            branch: s.branch,
            originalBranch: s.originalBranch,
            programType: s.programType,
            courseLower: course,
            branchLower: branch,
            originalBranchLower: originalBranch
          });
        }
        
        return course.includes('mca') || 
               branch.includes('mca') || 
               programType.includes('mca') ||
               originalBranch.includes('mca') ||
               // Also check for variations in department field
               (s.branch && (
                 s.branch.toLowerCase().includes('computer science') && 
                 (course.includes('mca') || programType.includes('mca'))
               )) ||
               // Check for "Computer Science & Applications" specifically
               (originalBranch.includes('computer science & applications') && 
                (course.includes('mca') || programType.includes('mca'))) ||
               // Check for "Compute Science" variations
               (originalBranch.includes('compute science') && 
                (course.includes('mca') || programType.includes('mca')));
      });
      courseName = 'MCA students';
    } else if (queryLower.includes('btech')) {
      filteredStudents = students.filter(s => 
        s.course?.toLowerCase().includes('btech') || 
        s.course?.toLowerCase().includes('b.tech') ||
        s.programType?.toLowerCase().includes('btech')
      );
      courseName = 'BTech students';
    } else if (queryLower.includes('mtech')) {
      filteredStudents = students.filter(s => 
        s.course?.toLowerCase().includes('mtech') || 
        s.course?.toLowerCase().includes('m.tech') ||
        s.programType?.toLowerCase().includes('mtech')
      );
      courseName = 'MTech students';
    } else if (queryLower.includes('bca')) {
      filteredStudents = students.filter(s => 
        s.course?.toLowerCase().includes('bca') ||
        s.programType?.toLowerCase().includes('bca')
      );
      courseName = 'BCA students';
    } else if (queryLower.includes('mba')) {
      filteredStudents = students.filter(s => 
        s.course?.toLowerCase().includes('mba') ||
        s.programType?.toLowerCase().includes('mba')
      );
      courseName = 'MBA students';
    } else if (queryLower.includes('mcom')) {
      filteredStudents = students.filter(s => 
        s.course?.toLowerCase().includes('mcom') ||
        s.programType?.toLowerCase().includes('mcom')
      );
      courseName = 'MCOM students';
    }
    
    const placedCount = filteredStudents.filter(s => s.isPlaced).length;
    const placementRate = filteredStudents.length > 0 ? Math.round((placedCount / filteredStudents.length) * 100) : 0;
    
    // Calculate average GPA for the filtered students
    const studentsWithGpa = filteredStudents.filter(s => s.academicInfo?.gpa);
    const averageGpa = studentsWithGpa.length > 0 
      ? (studentsWithGpa.reduce((sum, s) => sum + (s.academicInfo.gpa || 0), 0) / studentsWithGpa.length).toFixed(2)
      : 'N/A';
    
    // Create detailed student table
    const studentTable = filteredStudents.length > 0 ? `
| Name | Email | Roll Number | Branch | Course | Year | Placed | GPA | Company |
|------|-------|-------------|--------|--------|------|--------|-----|---------|
${filteredStudents.map(s => 
  `| ${s.name || 'N/A'} | ${s.email || 'N/A'} | ${s.rollNumber || 'N/A'} | ${s.branch || 'N/A'} | ${s.course || 'N/A'} | ${s.year || 'N/A'} | ${s.isPlaced ? 'Yes' : 'No'} | ${s.academicInfo?.gpa || 'N/A'} | ${s.placementDetails?.companyName || 'N/A'} |`
).join('\n')}` : 'No students found.';
    
    return {
      type: 'fallback_response',
      content: `## ${courseName} (${filteredStudents.length} students)

${studentTable}`,
      confidence: 'high',
      model: 'enhanced_fallback'
    };
  }

  // Department-specific queries
  if (queryLower.includes('department') || queryLower.includes('cse') || queryLower.includes('it') || queryLower.includes('ece') || queryLower.includes('mechanical') || queryLower.includes('civil')) {
    let filteredStudents = students;
    let deptName = 'students';
    
    if (queryLower.includes('cse') || queryLower.includes('computer science')) {
      filteredStudents = students.filter(s => 
        s.branch?.toLowerCase().includes('cse') || 
        s.branch?.toLowerCase().includes('computer science')
      );
      deptName = 'CSE students';
    } else if (queryLower.includes('it') || queryLower.includes('information technology')) {
      filteredStudents = students.filter(s => 
        s.branch?.toLowerCase().includes('it') || 
        s.branch?.toLowerCase().includes('information technology')
      );
      deptName = 'IT students';
    } else if (queryLower.includes('ece') || queryLower.includes('electronics')) {
      filteredStudents = students.filter(s => 
        s.branch?.toLowerCase().includes('ece') || 
        s.branch?.toLowerCase().includes('electronics')
      );
      deptName = 'ECE students';
    }
    
    const placedCount = filteredStudents.filter(s => s.isPlaced).length;
    const placementRate = filteredStudents.length > 0 ? Math.round((placedCount / filteredStudents.length) * 100) : 0;
    
    const studentTable = filteredStudents.length > 0 ? `
| Name | Email | Roll Number | Course | Year | Placed | GPA |
|------|-------|-------------|--------|------|--------|-----|
${filteredStudents.map(s => 
  `| ${s.name || 'N/A'} | ${s.email || 'N/A'} | ${s.rollNumber || 'N/A'} | ${s.course || 'N/A'} | ${s.year || 'N/A'} | ${s.isPlaced ? 'Yes' : 'No'} | ${s.academicInfo?.gpa || 'N/A'} |`
).join('\n')}` : 'No students found.';

    return {
      type: 'fallback_response',
      content: `## ${deptName} (${filteredStudents.length} students)

${studentTable}`,
      confidence: 'high',
      model: 'enhanced_fallback'
    };
  }

  // Year-wise queries
  if (queryLower.includes('year') || queryLower.includes('batch') || queryLower.includes('2024') || queryLower.includes('2025')) {
    let filteredStudents = students;
    let yearName = 'students';
    
    if (queryLower.includes('2025')) {
      filteredStudents = students.filter(s => s.year === 2025 || s.year === '2025');
      yearName = '2025 batch students';
    } else if (queryLower.includes('2024')) {
      filteredStudents = students.filter(s => s.year === 2024 || s.year === '2024');
      yearName = '2024 batch students';
    } else if (queryLower.includes('2023')) {
      filteredStudents = students.filter(s => s.year === 2023 || s.year === '2023');
      yearName = '2023 batch students';
    }
    
    const studentTable = filteredStudents.length > 0 ? `
| Name | Email | Roll Number | Course | Department | Placed | GPA |
|------|-------|-------------|--------|------------|--------|-----|
${filteredStudents.map(s => 
  `| ${s.name || 'N/A'} | ${s.email || 'N/A'} | ${s.rollNumber || 'N/A'} | ${s.course || 'N/A'} | ${s.branch || 'N/A'} | ${s.isPlaced ? 'Yes' : 'No'} | ${s.academicInfo?.gpa || 'N/A'} |`
).join('\n')}` : 'No students found.';

    return {
      type: 'fallback_response',
      content: `## ${yearName} (${filteredStudents.length} students)

${studentTable}`,
      confidence: 'high',
      model: 'enhanced_fallback'
    };
  }

  // Academic performance queries
  if (queryLower.includes('cgpa') || queryLower.includes('gpa') || queryLower.includes('grade') || 
      queryLower.includes('performance') || queryLower.includes('academic') || queryLower.includes('marks')) {
    const studentsWithGpa = students.filter(s => s.academicInfo?.gpa);
    const avgGpa = studentsWithGpa.length > 0 ? 
      (studentsWithGpa.reduce((sum, s) => sum + s.academicInfo.gpa, 0) / studentsWithGpa.length).toFixed(2) : 0;
    
    return {
      type: 'fallback_response',
      content: `Academic Performance Analysis:\n\n` +
        `• Students with GPA data: ${studentsWithGpa.length}\n` +
        `• Average GPA: ${avgGpa}\n` +
        `• Students with GPA > 8.0: ${studentsWithGpa.filter(s => s.academicInfo.gpa > 8).length}\n` +
        `• Students with GPA > 7.0: ${studentsWithGpa.filter(s => s.academicInfo.gpa > 7).length}\n` +
        `• Students with GPA > 6.0: ${studentsWithGpa.filter(s => s.academicInfo.gpa > 6).length}\n\n` +
        `Top Performers (GPA > 8.0):\n` +
        studentsWithGpa.filter(s => s.academicInfo.gpa > 8).slice(0, 5).map(s => 
          `• ${s.name} (${s.email}) - GPA: ${s.academicInfo.gpa} - ${s.course || 'N/A'}`
        ).join('\n'),
      confidence: 'medium',
      model: 'fallback'
    };
  }

  // Placement queries
  if (queryLower.includes('placed') || queryLower.includes('placement') || queryLower.includes('company')) {
    return {
      type: 'fallback_response',
      content: `Placement Statistics:\n\n` +
        `• Total Students: ${statistics.totalStudents}\n` +
        `• Placed Students: ${statistics.placedStudents}\n` +
        `• Placement Rate: ${statistics.placementRate}%\n` +
        `• Active Students: ${statistics.activeStudents}\n\n` +
        `Course-wise Placement:\n` +
        courseBreakdown.slice(0, 5).map(course => 
          `• ${course.course}: ${course.placed}/${course.total} (${course.placementRate}%)`
        ).join('\n') + '\n\n' +
        `Department-wise Placement:\n` +
        departmentBreakdown.slice(0, 5).map(dept => 
          `• ${dept.department}: ${dept.placed}/${dept.total} (${dept.placementRate}%)`
        ).join('\n'),
      confidence: 'medium',
      model: 'fallback'
    };
  }

  // Year-wise queries
  if (queryLower.includes('year') || queryLower.includes('batch') || queryLower.includes('2024') || queryLower.includes('2025')) {
    return {
      type: 'fallback_response',
      content: `Year-wise Analysis:\n\n` +
        yearBreakdown.map(year => 
          `• ${year.year}: ${year.total} students (${year.placed} placed, ${year.placementRate}% rate) - Departments: ${year.departments.slice(0, 3).join(', ')}`
        ).join('\n'),
      confidence: 'medium',
      model: 'fallback'
    };
  }

  // Comprehensive overview
  if (queryLower.includes('overview') || queryLower.includes('summary') || queryLower.includes('all')) {
    return {
      type: 'fallback_response',
      content: `Comprehensive Database Overview:\n\n` +
        `OVERALL STATISTICS:\n` +
        `• Total Students: ${statistics.totalStudents}\n` +
        `• Active Students: ${statistics.activeStudents}\n` +
        `• Placed Students: ${statistics.placedStudents}\n` +
        `• Placement Rate: ${statistics.placementRate}%\n\n` +
        `COURSE BREAKDOWN:\n` +
        courseBreakdown.slice(0, 5).map(course => 
          `• ${course.course}: ${course.total} students (${course.placed} placed, ${course.placementRate}% rate)`
        ).join('\n') + '\n\n' +
        `DEPARTMENT BREAKDOWN:\n` +
        departmentBreakdown.slice(0, 5).map(dept => 
          `• ${dept.department}: ${dept.total} students (${dept.placed} placed, ${dept.placementRate}% rate)`
        ).join('\n'),
      confidence: 'medium',
      model: 'fallback'
    };
  }

  // Company and job queries
  if (queryLower.includes('company') || queryLower.includes('companies') || queryLower.includes('job') || 
      queryLower.includes('jobs') || queryLower.includes('recruiter') || queryLower.includes('recruitment')) {
    
    const placedStudents = students.filter(s => s.isPlaced);
    const companies = [...new Set(placedStudents.map(s => s.placementDetails?.companyName).filter(Boolean))];
    
    return {
      type: 'fallback_response',
      content: `## Company & Job Information

| Metric | Value |
|--------|-------|
| **Total Companies** | ${companies.length} |
| **Total Jobs** | ${statistics.totalJobs} |
| **Placed Students** | ${placedStudents.length} |

### Companies that recruited students:
${companies.length > 0 ? companies.map(company => `- ${company}`).join('\n') : 'No company data available'}

### Placed Students:
${placedStudents.slice(0, 10).map(s => 
  `- ${s.name} - ${s.placementDetails?.companyName || 'Unknown Company'} - ${s.placementDetails?.ctc || 'N/A'} LPA`
).join('\n')}${placedStudents.length > 10 ? `\n... and ${placedStudents.length - 10} more` : ''}`,
      confidence: 'high',
      model: 'enhanced_fallback'
    };
  }

  // Help and capability queries
  if (queryLower.includes('help') || queryLower.includes('what can') || queryLower.includes('capabilities') || 
      queryLower.includes('commands') || queryLower.includes('how to') || queryLower.includes('guide')) {
    
    return {
      type: 'fallback_response',
      content: `## AI Assistant Capabilities

### 📊 **Data Analysis**
- Placement statistics and overview
- Course-wise and department-wise breakdowns
- Year-wise student analysis
- Academic performance metrics

### 👥 **Student Information**
- Individual student details
- Search by name, email, or roll number
- Student placement status
- Academic records and GPA

### 📋 **Lists & Reports**
- Course-specific student lists (MCA, BTech, MTech, BCA, MBA, MCOM)
- Department-wise student lists (CSE, IT, ECE, etc.)
- Year-wise student lists (2023, 2024, 2025)
- Placed vs unplaced students

### 🏢 **Company & Jobs**
- Company recruitment information
- Job placement details
- Package and CTC information

### 💡 **Sample Queries**
- "Show me all MCA students"
- "Details about John Doe"
- "Placement statistics"
- "Students with GPA above 8.0"
- "2025 batch students"
- "CSE department students"
- "Placed students list"
- "Company recruitment data"

**Current Database:**
- ${statistics.totalStudents} students
- ${statistics.placedStudents} placed (${statistics.placementRate}% rate)
- ${courseBreakdown.length} courses
- ${departmentBreakdown.length} departments`,
      confidence: 'high',
      model: 'enhanced_fallback'
    };
  }

  // Default response
  return {
    type: 'fallback_response',
    content: `## Database Overview

| Metric | Value |
|--------|-------|
| **Total Students** | ${statistics.totalStudents} |
| **Placed Students** | ${statistics.placedStudents} |
| **Placement Rate** | ${statistics.placementRate}% |
| **Average GPA** | ${statistics.academicPerformance.averageGpa} |
| **Total Jobs** | ${statistics.totalJobs} |
| **Total Companies** | ${statistics.totalCompanies} |

### Available Courses:
${courseBreakdown.map(c => `- **${c.course}**: ${c.total} students (${c.placed} placed)`).join('\n')}

### Available Departments:
${departmentBreakdown.map(d => `- **${d.department}**: ${d.total} students (${d.placed} placed)`).join('\n')}

**💡 Try asking:**
- "Show me all [course] students"
- "Details about [student name]"
- "Placement statistics"
- "2025 batch students"
- "Students with GPA above 8.0"
- "Help" for more options`,
    confidence: 'medium',
    model: 'enhanced_fallback'
  };
}

// Generate reports based on query
async function generateReports(query, databaseContext, analysisType) {
  const reports = [];
  const queryLower = query.toLowerCase();

  try {
    // CSV Report for student lists
    if (queryLower.includes('list') || queryLower.includes('report') || queryLower.includes('export')) {
      const csvReport = await generateCSVReport(query, databaseContext);
      if (csvReport) {
        reports.push(csvReport);
      }
    }

    // PDF Report for comprehensive analysis
    if (queryLower.includes('comprehensive') || queryLower.includes('detailed') || queryLower.includes('full')) {
      const pdfReport = await generatePDFReport(query, databaseContext);
      if (pdfReport) {
        reports.push(pdfReport);
      }
    }

    return reports;
  } catch (error) {
    console.error('Report generation error:', error);
    return [];
  }
}

// Generate CSV report
async function generateCSVReport(query, databaseContext) {
  try {
    const { students } = databaseContext;
    let filteredStudents = students;

    // Apply filters based on query
    if (query.toLowerCase().includes('mca')) {
      filteredStudents = students.filter(s => 
        s.course?.toLowerCase().includes('mca') || 
        s.programType?.toLowerCase().includes('mca')
      );
    }

    if (query.toLowerCase().includes('placed')) {
      filteredStudents = filteredStudents.filter(s => s.isPlaced);
    }

    if (query.toLowerCase().includes('cgpa') || query.toLowerCase().includes('gpa')) {
      const gpaThreshold = extractGpaThreshold(query);
      if (gpaThreshold) {
        filteredStudents = filteredStudents.filter(s => 
          s.academicInfo?.gpa && s.academicInfo.gpa >= gpaThreshold
        );
      }
    }

    // Generate CSV content
    const headers = [
      'Name', 'Email', 'Roll Number', 'Branch', 'Course', 'Year', 'Section', 
      'Program Type', 'Status', 'Placed', 'CGPA', 'Attendance %', 'Backlogs',
      'Company', 'Designation', 'CTC', 'Work Location', 'Joining Date'
    ];

    const csvRows = filteredStudents.map(student => [
      student.name || '',
      student.email || '',
      student.rollNumber || '',
      student.branch || '',
      student.course || '',
      student.year || '',
      student.section || '',
      student.programType || '',
      student.isActive ? 'Active' : 'Inactive',
      student.isPlaced ? 'Yes' : 'No',
      student.academicInfo?.gpa || '',
      student.eligibilityCriteria?.attendancePercentage || '',
      student.eligibilityCriteria?.backlogs || '',
      student.placementDetails?.companyName || '',
      student.placementDetails?.designation || '',
      student.placementDetails?.ctc || '',
      student.placementDetails?.workLocation || '',
      student.placementDetails?.joiningDate || ''
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return {
      type: 'csv',
      filename: `student_analysis_${Date.now()}.csv`,
      content: csvContent,
      recordCount: filteredStudents.length,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('CSV report generation error:', error);
    return null;
  }
}

// Generate PDF report
async function generatePDFReport(query, databaseContext) {
  try {
    const { students, statistics } = databaseContext;
    
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Placement Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Placement Analysis Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Query: "${query}"</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>${statistics.totalStudents}</h3>
            <p>Total Students</p>
          </div>
          <div class="stat-box">
            <h3>${statistics.placedStudents}</h3>
            <p>Placed Students</p>
          </div>
          <div class="stat-box">
            <h3>${statistics.placementRate}%</h3>
            <p>Placement Rate</p>
          </div>
        </div>
        
        <h2>Summary</h2>
        <p>This report contains analysis based on the query: "${query}"</p>
        <p>Total records analyzed: ${students.length}</p>
      </body>
      </html>
    `;

    return {
      type: 'pdf',
      filename: `placement_analysis_${Date.now()}.pdf`,
      content: htmlContent,
      recordCount: students.length,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('PDF report generation error:', error);
    return null;
  }
}

// Helper function to extract GPA threshold from query
function extractGpaThreshold(query) {
  const gpaMatch = query.match(/(?:cgpa|gpa)\s*(?:above|>|>=|greater than)\s*(\d+(?:\.\d+)?)/i);
  if (gpaMatch) {
    return parseFloat(gpaMatch[1]);
  }
  return null;
}

// Data normalization functions
function normalizeCourseName(course) {
  if (!course) return 'Unknown';
  
  const courseLower = course.toLowerCase().trim();
  
  // MCA variations
  if (courseLower.includes('mca')) return 'MCA';
  
  // BTech variations
  if (courseLower.includes('btech') || courseLower.includes('b.tech') || courseLower.includes('b tech')) return 'BTech';
  
  // MTech variations
  if (courseLower.includes('mtech') || courseLower.includes('m.tech') || courseLower.includes('m tech')) return 'MTech';
  
  // BCA variations
  if (courseLower.includes('bca')) return 'BCA';
  
  // MBA variations
  if (courseLower.includes('mba')) return 'MBA';
  
  // BBA variations
  if (courseLower.includes('bba')) return 'BBA';
  
  // MCOM variations
  if (courseLower.includes('mcom') || courseLower.includes('m.com')) return 'MCOM';
  
  return course; // Return original if no match
}

function normalizeDepartmentName(branch) {
  if (!branch) return 'Unknown';
  
  const branchLower = branch.toLowerCase().trim();
  
  // Debug logging for MCA students
  if (branchLower.includes('mca') || branchLower.includes('computer') || branchLower.includes('compute')) {
    console.log(`Normalizing branch: "${branch}" -> "${branchLower}"`);
  }
  
  // Computer Science variations
  if (branchLower.includes('computer science') || branchLower.includes('cse') || branchLower.includes('cs') || 
      branchLower.includes('computer science & applications') || branchLower.includes('compute science')) {
    console.log(`Mapped to Computer Science: "${branch}"`);
    return 'Computer Science';
  }
  
  // Information Technology variations
  if (branchLower.includes('information technology') || branchLower.includes('it')) {
    return 'Information Technology';
  }
  
  // Electronics and Communication variations
  if (branchLower.includes('electronics') || branchLower.includes('ece') || branchLower.includes('e&c')) {
    return 'Electronics and Communication';
  }
  
  // Mechanical Engineering variations
  if (branchLower.includes('mechanical') || branchLower.includes('me')) {
    return 'Mechanical Engineering';
  }
  
  // Civil Engineering variations
  if (branchLower.includes('civil') || branchLower.includes('ce')) {
    return 'Civil Engineering';
  }
  
  // MCA as department
  if (branchLower.includes('mca')) {
    return 'MCA';
  }
  
  return branch; // Return original if no match
}

function normalizeProgramType(programType) {
  if (!programType) return 'Unknown';
  
  const typeLower = programType.toLowerCase().trim();
  
  // Undergraduate variations
  if (typeLower.includes('ug') || typeLower.includes('undergraduate') || typeLower.includes('bachelor')) {
    return 'Undergraduate';
  }
  
  // Postgraduate variations
  if (typeLower.includes('pg') || typeLower.includes('postgraduate') || typeLower.includes('master')) {
    return 'Postgraduate';
  }
  
  // Diploma variations
  if (typeLower.includes('diploma')) {
    return 'Diploma';
  }
  
  return programType; // Return original if no match
}

export default router;
