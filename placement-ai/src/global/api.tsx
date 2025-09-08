const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api${path}`

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    body: options.body,
    credentials: 'include',
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data: unknown = isJson ? await response.json().catch(() => ({})) : await response.text()

  if (!response.ok) {
    const message =
      (isJson && typeof data === 'object'
        ? ((data as Record<string, unknown>)?.message as string || (data as Record<string, unknown>)?.error as string)
        : undefined) || response.statusText || 'Request failed'
    throw new Error(message)
  }

  return data as TResponse
}

// Helper: only attach bearer if token looks like a real JWT (avoid 'cookie-session')
function buildAuthHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {}
  if (token && token !== 'cookie-session' && token.split('.').length === 3) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// ------------------- AUTH ------------------- //

export type LoginPayload = {
  email: string
  password: string
  role?: 'student' | 'placement_officer' | 'admin' | 'recruiter'
}

export type LoginResponse = {
  success?: boolean
  token?: string
  user?: {
    id: string | number
    name?: string
    email: string
    role?: string
  }
  message?: string
  requiresOtp?: boolean
  email?: string
  otpRequired?: boolean // Keep for backward compatibility
  // When using cookie sessions on iOS/macOS Safari, token may be omitted
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function verifyAuth(token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return request<{ success: boolean; user?: { role?: string } }>('/auth/verify', { method: 'GET', headers })
}

export function verifyStudentOtp(email: string, otp: string) {
  return request<LoginResponse>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
}

export function requestStudentOtp(email: string) {
  return request<{ success: boolean; message?: string }>('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) })
}

export function requestPasswordReset(email: string) {
  return request<{ success: boolean }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) })
}

export function confirmPasswordReset(email: string, token: string, newPassword: string) {
  return request<{ success: boolean; message?: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) })
}

// ------------------- STUDENTS ------------------- //

export type BulkUploadRequest = {
  students: Array<{ name: string; email: string; branch: string; section: string; rollNumber: string }>
}

export type BulkUploadResponse = {
  total: number
  successful: number
  failed: number
  errors: string[]
  accounts: Array<{ email: string; password: string; status: 'created' | 'failed'; error?: string; name?: string }>
}

export function bulkUploadStudents(formData: FormData) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/placement-officer/bulk-upload`
  return fetch(url, { method: 'POST', body: formData, credentials: 'include' }).then(async (res) => {
    const contentType = res.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data: unknown = isJson ? await res.json().catch(() => ({})) : await res.text()
    if (!res.ok) {
      const message =
        (isJson && typeof data === 'object' ? (data as Record<string, unknown>)?.error as string || (data as Record<string, unknown>)?.message as string : undefined)
        || `${res.status} ${res.statusText}` || 'Upload failed'
      throw new Error(message)
    }
    return data as BulkUploadResponse
  })
}

export function sendBulkWelcomeEmails(studentIds: string[]) {
  return request<{ success: boolean; results: Array<{ email?: string; id?: string; status: string; error?: string }> }>('/placement-officer/send-welcome-emails', {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  })
}

export function sendBulkWelcomeEmailsWithCredentials(students: Array<{ email: string; password: string; name?: string }>) {
  return request<{ success: boolean; results: Array<{ email: string; status: string; error?: string }> }>('/placement-officer/send-welcome-emails', {
    method: 'POST',
    body: JSON.stringify({ students }),
  })
}

export function sendBulkWelcomeEmailsByEmails(emails: string[]) {
  return request<{ success: boolean; results: Array<{ email: string; status: string; error?: string }> }>('/placement-officer/send-welcome-emails', {
    method: 'POST',
    body: JSON.stringify({ emails }),
  })
}

export function fetchStudentByEmail(email: string) {
  const params = new URLSearchParams({ email })
  return request<{ exists: boolean; student?: unknown }>(`/placement-officer/student-by-email?${params.toString()}`)
}

export function createStudentManual(payload: { name: string; email: string; branch: string; section?: string; rollNumber: string; phone?: string; year?: string }) {
  return request<{ success: boolean; student: unknown; password: string }>('/placement-officer/create-student', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ------------------- BIODATA & ELIGIBILITY ------------------- //

export type BiodataEntry = {
  email: string
  name: string
  branch: string
  section: string
  rollNumber: string
  phone?: string
  year: string
  gender?: string
  dateOfBirth?: string
  address?: string
  gpa?: number
  specialization?: string
  skills?: string[]
  projects?: string[]
  attendancePercentage?: number
  backlogs?: number
  academicRequirements?: string
  otherEligibility?: string
  
  // Physical & Personal Details
  bloodGroup?: string
  height?: number
  weight?: number
  nationality?: string
  religion?: string
  caste?: string
  category?: string
  
  // Family Information
  parentName?: string
  parentPhone?: string
  parentOccupation?: string
  familyIncome?: number
  
  // Academic History
  tenthPercentage?: number
  twelfthPercentage?: number
  diplomaPercentage?: number
  entranceExamScore?: number
  entranceExamRank?: number
  
  // Living & Transportation
  hostelStatus?: string
  transportMode?: string
  
  // Medical Information
  medicalConditions?: string
  allergies?: string
  disabilities?: string
  
  // Skills & Languages
  languagesKnown?: string[]
  hobbies?: string[]
  extraCurricularActivities?: string[]
  sports?: string[]
  
  // Certifications & Achievements
  technicalCertifications?: string[]
  nonTechnicalCertifications?: string[]
  internships?: string[]
  workshopsAttended?: string[]
  paperPublications?: string[]
  patentApplications?: number
  startupExperience?: number
  leadershipRoles?: number
  communityService?: number
  
  // Online Presence
  socialMediaPresence?: string[]
  linkedinProfile?: string
  portfolioWebsite?: string
  githubProfile?: string
  
  // Career Preferences
  expectedSalary?: number
  preferredLocation?: string[]
  willingToRelocate?: boolean
  
  // Documents & Identity
  passportNumber?: string
  drivingLicense?: string
  vehicleOwnership?: boolean
  bankAccount?: string
  panCard?: string
  aadharNumber?: string
}

export type BiodataUploadResponse = {
  total: number
  successful: number
  failed: number
  errors: string[]
  results: Array<{
    email: string
    status: 'success' | 'failed'
    error?: string
    studentId?: string
  }>
}

export function bulkUploadBiodata(formData: FormData) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/placement-officer/bulk-biodata`
  return fetch(url, { method: 'POST', body: formData, credentials: 'include' }).then(async (res) => {
    const contentType = res.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const data: unknown = isJson ? await res.json().catch(() => ({})) : await res.text()
    if (!res.ok) {
      const message =
        (isJson && typeof data === 'object' ? (data as Record<string, unknown>)?.error as string || (data as Record<string, unknown>)?.message as string : undefined)
        || `${res.status} ${res.statusText}` || 'Upload failed'
      throw new Error(message)
    }
    return data as BiodataUploadResponse
  })
}

export function createBiodataManual(payload: BiodataEntry) {
  return request<{ success: boolean; student: unknown; message: string }>('/placement-officer/create-biodata', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ------------------- OFFICERS ------------------- //

export function createOfficer(payload: { name: string; email: string }) {
  return request<{ success: boolean; officer: unknown }>('/placement-officer/create-officer', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ------------------- PLACEMENT OFFICER: STUDENT MGMT ------------------- //

export type OfficerStudent = {
  _id: string
  name: string
  email: string
  rollNumber?: string
  branch?: string
  section?: string
  year?: string
  course?: string
  isActive: boolean
  isPlaced?: boolean
}

export type OfficerStudentListResponse = {
  success: boolean
  items: OfficerStudent[]
  total: number
  page: number
  limit: number
  metrics: { total: number; placed: number; blocked: number }
}

export function listOfficerStudents(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  })
  return request<OfficerStudentListResponse>(`/placement-officer/students?${qs.toString()}`)
}

export function bulkOfficerStudentAction(action: 'block'|'unblock'|'place'|'unplace', ids: string[]) {
  return request<{ success: boolean; updated: number }>(`/placement-officer/students/bulk`, {
    method: 'POST',
    body: JSON.stringify({ action, ids })
  })
}

// ------------------- ONBOARDING & ATS ------------------- //

export function submitOnboarding(payload: Record<string, unknown>, token: string) {
  return request<{ success: boolean }>('/students/onboarding', {
    method: 'POST',
    headers: { ...buildAuthHeaders(token) },
    body: JSON.stringify(payload),
  })
}

// ------------------- RESUME & ATS ANALYSIS ------------------- //

export type ATSAnalysis = {
  score: number
  jobRole: string
  improvements: {
    skills: string[]
    keywords: string[]
    formatting: string[]
    clarity: string[]
  }
  suggestions: string[]
  mistakes: string[]
  keywords: string[]
  overall: string
}

export type ResumeUploadResponse = {
  success: boolean
  message: string
  resume: {
    id: string
    filename: string
    originalName: string
    cloudinaryUrl: string
    viewerUrl?: string
    uploadDate: string
  }
}

export type ATSAnalysisResponse = {
  success: boolean
  message: string
  atsAnalysis: ATSAnalysis
  resume: {
    id: string
    filename: string
    originalName: string
    cloudinaryUrl: string
    uploadDate: string
  }
}

// Upload resume to Cloudinary
export async function uploadResume(file: File, token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/upload`
  const form = new FormData()
  form.append('resume', file)

  console.log('📤 Upload Debug:', {
    url,
    token: token ? `${token.substring(0, 20)}...` : 'No token',
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...buildAuthHeaders(token) },
    body: form,
    credentials: 'include',
  })

  console.log('📤 Upload Response:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Upload failed')
  }
  
  return data as ResumeUploadResponse
}

// Upload and analyze resume with ATS
export async function analyzeATS(file: File, token: string, jobRole: string = 'Software Engineer') {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/analyze-ats`
  const form = new FormData()
  form.append('resume', file)
  form.append('jobRole', jobRole)

  console.log('🔍 ATS Analysis Debug:', {
    url,
    jobRole,
    fileSize: file.size,
    fileName: file.name
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...buildAuthHeaders(token) },
    body: form,
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'ATS analysis failed')
  }
  
  return data as ATSAnalysisResponse
}

// Get resume analysis
export async function getResumeAnalysis(token: string, resumeId?: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = resumeId 
    ? `${baseUrl}/api/resume/analysis/${resumeId}`
    : `${baseUrl}/api/resume/analysis`

  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to get resume analysis')
  }
  
  return data as { success: boolean; resume: { atsAnalysis: ATSAnalysis } }
}

// List student's resumes
export async function listResumes(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/list`

  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to list resumes')
  }
  
  return data as { success: boolean; resumes: Array<{ id: string; filename: string; originalName: string; cloudinaryUrl: string; uploadDate: string; hasAtsAnalysis: boolean }> }
}

// Officer: get active resume view url for a student
export async function getStudentActiveResumeViewUrl(token: string, studentId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/admin/student/${studentId}/active-view`
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to get resume view url')
  }
  return data as { success: boolean; url: string; resume?: { id: string; originalName?: string; fileName?: string } }
}

export async function listStudentResumesForOfficer(token: string, studentId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/admin/student/${studentId}/list`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to list student resumes')
  }
  return data as { success: boolean; resumes: Array<{ id: string; originalName?: string; fileName?: string; uploadDate: string; viewUrl?: string; cloudinaryUrl?: string; hasAtsAnalysis?: boolean }> }
}

// Delete resume
export async function deleteResume(token: string, resumeId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/${resumeId}`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to delete resume')
  }
  
  return data as { success: boolean; message: string }
}

// Fix Cloudinary URL for existing resume
export async function fixResumeUrl(token: string, resumeId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/fix-url/${resumeId}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to fix resume URL')
  }
  
  return data as { success: boolean; message: string; resume: { id: string; cloudinaryUrl: string; cloudinaryId: string } }
}

// Fix all resume URLs for a student
export async function fixAllResumeUrls(token: string, studentId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/fix-all-urls`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ studentId }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to fix all resume URLs')
  }
  
  return data as { 
    success: boolean; 
    message: string; 
    fixedCount: number; 
    totalCount: number; 
    results: Array<{
      resumeId: string;
      originalName: string;
      oldUrl?: string;
      newUrl?: string;
      error?: string;
    }>
  }
}

// Regenerate clean URLs for all resumes (fixes malformed URLs)
export async function regenerateResumeUrls(token: string, studentId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/regenerate-urls`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      ...buildAuthHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ studentId }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to regenerate resume URLs')
  }
  
  return data as { 
    success: boolean; 
    message: string; 
    fixedCount: number; 
    totalCount: number; 
    results: Array<{
      resumeId: string;
      originalName: string;
      oldUrl?: string;
      newUrl?: string;
      error?: string;
    }>
  }
}

// ------------------- PROFILE MANAGEMENT ------------------- //

export type StudentProfile = {
  basicInfo: {
    name: string
    email: string
    phone: string
    gender?: string
    dateOfBirth?: string
    address?: string
  }
  academicInfo: {
    rollNumber: string
    branch: string
    section: string
    year: string
    gpa?: number
    specialization?: string
  }
  placementInfo: {
    jobRole: string
    preferredDomain: string
    skills: string[]
    certifications: string[]
    projects: string[]
  }
  resume: {
    id: string
    filename: string
    originalName: string
    cloudinaryUrl: string
    uploadDate: string
    hasAtsAnalysis: boolean
    atsScore: number
  } | null
  status: {
    isActive: boolean
    onboardingCompleted: boolean
    lastLogin: string
    profileCompletion: number
    completionBreakdown: {
      basicInfo: number
      academicInfo: number
      resume: number
      skillsProjects: number
      applicationsEligibility: number
    }
  }
  statistics: {
    applicationsCount: number
    eligibilityTestsTaken: number
    unreadNotifications: number
  }
}

export type ProfileCompletion = {
  percentage: number
  breakdown: {
    basicInfo: number
    academicInfo: number
    resume: number
    skillsProjects: number
    applicationsEligibility: number
  }
}

// Get comprehensive student profile
export async function getStudentProfile(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/profile/comprehensive`

  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to get student profile')
  }
  
  return data as { success: boolean; profile: StudentProfile }
}

// Get profile completion status
export async function getCompletionStatus(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/profile/completion`

  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to get completion status')
  }
  
  return data as { success: boolean; profileCompletion: number; onboardingCompleted: boolean }
}

// Update comprehensive student profile
export async function updateStudentProfile(token: string, profileData: {
  basicInfo?: Partial<StudentProfile['basicInfo']>
  academicInfo?: Partial<StudentProfile['academicInfo']>
  placementInfo?: Partial<StudentProfile['placementInfo']>
}) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/profile/comprehensive`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(profileData),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update profile')
  }
  
  return data as { success: boolean; message: string; profileCompletion: number }
}

// Update student skills
export async function updateStudentSkills(token: string, skills: string[]) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/profile/skills`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify({ skills }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update skills')
  }
  
  return data as { success: boolean; message: string; skills: string[]; profileCompletion: number }
}

// Update student projects
export async function updateStudentProjects(token: string, projects: string[]) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/profile/projects`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify({ projects }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update projects')
  }
  
  return data as { success: boolean; message: string; projects: string[]; profileCompletion: number }
}

// Update single profile field
export async function updateProfileField(token: string, field: string, value: string | number | string[]) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/profile/field`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify({ field, value }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update field')
  }
  
  return data as { success: boolean; message: string; field: string; value: any; profileCompletion: number }
}

// Legacy functions for backward compatibility
export function saveAtsScore(payload: { role: string; overall: number; breakdown: Record<string, number>; matched: string[]; missing: string[] }, token: string) {
  return request<{ success: boolean }>('/students/ats-score', {
    method: 'POST',
    headers: { ...buildAuthHeaders(token) },
    body: JSON.stringify(payload),
  })
}

export function analyzeAtsOnServer(payload: { role?: string; skillsTech?: string[]; gpa?: string }, token: string) {
  return request<{ success: boolean; result: { role: string; overall: number; breakdown: Record<string, number>; matched: string[]; missing: string[]; suggestions: string[] } }>('/resume/analyze-ats', {
    method: 'POST',
    headers: { ...buildAuthHeaders(token) },
    body: JSON.stringify(payload),
  })
}

// ------------------- JOBS (Internal) ------------------- //

export type CreateJobPayload = {
  company: string
  title: string
  description: string
  location: string
  jobType: string
  ctc?: string
  deadline?: string
}

export function createJob(token: string | null | undefined, payload: CreateJobPayload) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: any }>(`/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export function listJobs(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<{ success: boolean; data: any }>(`/jobs?${qs.toString()}`)
}

// Student apply to a job with selected resume
export async function applyToJob(token: string, jobId: string, resumeId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/jobs/${jobId}/apply`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders(token) },
    body: JSON.stringify({ resumeId }),
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || 'Apply failed')
  }
  return data as { success: boolean; message?: string }
}

// ------------------- EXTERNAL JOBS ------------------- //

export type CreateExternalJobPayload = {
  companyName: string
  jobTitle: string
  description: string
  location: string
  jobType: string
  externalUrl: string
  salary?: string
  requirements?: string[]
  tags?: string[]
  applicationDeadline?: string
}

export function createExternalJob(token: string | null | undefined, payload: CreateExternalJobPayload) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: any }>(`/external-jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export function listExternalJobs(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<{ success: boolean; data: any[]; pagination: any }>(`/external-jobs?${qs.toString()}`)
}

// ------------------- COMPANY REQUESTS ------------------- //

export type CreateCompanyRequestPayload = {
  company: string
  jobRole: string
  description: string
  studentsRequired: number
  minimumCGPA: number
  startDate?: string
  endDate?: string
}

export function listCompanyRequests(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<{ success: boolean; data: any[]; pagination: any }>(`/companies/requests?${qs.toString()}`)
}

export function createCompanyRequest(token: string | null | undefined, payload: CreateCompanyRequestPayload) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: any }>(`/companies/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export { request }
