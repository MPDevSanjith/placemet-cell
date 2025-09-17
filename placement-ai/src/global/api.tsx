const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

// Lightweight client-side cache for GET requests (per-URL+auth header)
const responseCache = new Map<string, { expiry: number; data: unknown }>()

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api${path}`

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Timeout and retry logic
  const timeoutMs = 12000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const headersCombined = { ...defaultHeaders, ...(options.headers || {}) } as Record<string, string>

  // Simple cache: only for GET, no body, and public-ish endpoints
  const isGet = (options.method ?? 'GET').toUpperCase() === 'GET'
  const authKey = headersCombined.Authorization ? `|auth:${headersCombined.Authorization}` : ''
  const cacheKey = isGet ? `${url}${authKey}` : ''
  const now = Date.now()
  if (isGet && responseCache.has(cacheKey)) {
    const entry = responseCache.get(cacheKey)!
    if (entry.expiry > now) {
      return entry.data as TResponse
    } else {
      responseCache.delete(cacheKey)
    }
  }

  const doFetch = async (): Promise<{ ok: boolean; status: number; data: unknown; isJson: boolean; statusText: string }> => {
    const res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: headersCombined,
      body: options.body,
      credentials: 'include',
      signal: controller.signal,
      // keepalive can help on some browsers for short-lived connections
      keepalive: true as any,
    })
    const isJson = res.headers.get('content-type')?.includes('application/json') ?? false
    const data = isJson ? await res.json().catch(() => ({})) : await res.text()
    return { ok: res.ok, status: res.status, data, isJson, statusText: res.statusText }
  }

  let attempt = 0
  let lastError: Error | null = null
  try {
    while (attempt < 2) {
      try {
        const res = await doFetch()
        if (!res.ok) {
          // Retry on 5xx
          if (res.status >= 500 && attempt === 0) {
            attempt++
            await new Promise(r => setTimeout(r, 300))
            continue
          }
          const message = (res.isJson && typeof res.data === 'object'
            ? ((res.data as Record<string, unknown>)?.message as string || (res.data as Record<string, unknown>)?.error as string)
            : undefined) || res.statusText || 'Request failed'
          throw new Error(message)
        }

        // Populate cache with short TTL for frequently-hit GET endpoints
        if (isGet) {
          let ttl = 0
          if (/\/jobs(\?|$)/.test(path) || /\/external-jobs(\?|$)/.test(path)) ttl = 15_000
          else if (/\/notifications\//.test(path)) ttl = 10_000
          else if (/\/profile\//.test(path)) ttl = 10_000
          if (ttl > 0) {
            responseCache.set(cacheKey, { expiry: now + ttl, data: res.data })
          }
        }

        return res.data as TResponse
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          lastError = new Error('Request timed out')
          break
        }
        lastError = e instanceof Error ? e : new Error('Network error')
        // Retry once for network errors
        if (attempt === 0) {
          attempt++
          await new Promise(r => setTimeout(r, 300))
          continue
        }
        break
      }
    }
  } finally {
    clearTimeout(timer)
  }

  throw lastError || new Error('Request failed')
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

export const logout = async (): Promise<{ success: boolean; message: string }> => {
  return request('/auth/logout', { 
    method: 'POST',
    credentials: 'include' // Ensure cookies are sent for logout
  })
}

// ------------------- SEARCH ------------------- //

export type SearchResult = {
  id: string
  type: 'student' | 'job' | 'company'
  name: string
  email?: string
  rollNumber?: string
  department?: string
  course?: string
  programType?: string
  phone?: string
  cgpa?: number
  attendance?: number
  backlogs?: number
  isPlaced?: boolean
  matchField: string
}

export type SearchResponse = {
  students: SearchResult[]
  jobs: SearchResult[]
  companies: SearchResult[]
  total: number
}

export const search = async (query: string, type?: string, limit?: number): Promise<SearchResponse> => {
  const params = new URLSearchParams()
  params.append('q', query)
  if (type) params.append('type', type)
  if (limit) params.append('limit', limit.toString())
  
  return request(`/placement-officer/search?${params.toString()}`)
}

export const studentSearch = async (query: string, type?: string, limit?: number): Promise<Omit<SearchResponse, 'students'>> => {
  const params = new URLSearchParams()
  params.append('q', query)
  if (type) params.append('type', type)
  if (limit) params.append('limit', limit.toString())
  
  return request(`/placement-officer/student-search?${params.toString()}`)
}

// ------------------- PLACEMENT OFFICER SETTINGS ------------------- //

export type OfficerProfile = {
  _id: string
  name: string
  email: string
  role: 'placement_officer' | 'admin'
  status: 'active' | 'inactive'
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export const getOfficerProfile = async (token: string): Promise<{ success: boolean; user: OfficerProfile }> => {
  return request('/placement-officer/profile', {
    headers: buildAuthHeaders(token)
  })
}

export const updateOfficerProfile = async (token: string, data: { name?: string; email?: string }): Promise<{ success: boolean; message: string; user: OfficerProfile }> => {
  return request('/placement-officer/profile', {
    method: 'PUT',
    headers: buildAuthHeaders(token),
    body: JSON.stringify(data)
  })
}

export const changeOfficerPassword = async (token: string, data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
  return request('/placement-officer/change-password', {
    method: 'PUT',
    headers: buildAuthHeaders(token),
    body: JSON.stringify(data)
  })
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

export function updateOfficerStudent(id: string, payload: Partial<{ name: string; email: string; branch: string; course: string; section: string; rollNumber: string; year: string; phone: string; cgpa: number; programType: string; admissionYear: string }>) {
  return request<{ success: boolean; student: any; message: string }>(`/placement-officer/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
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

export function getJob(id: string) {
  return request<{ success: boolean; data: any }>(`/jobs/${id}`)
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

// Student: list my job applications
export async function listMyApplications(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/jobs/applications/mine`
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || 'Failed to load applications')
  }
  return data as { success: boolean; items: any[] }
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

// ------------------- NOTIFICATIONS ------------------- //

export type NotificationTarget = {
  all?: boolean
  years?: string[]
  departments?: string[]
  sections?: string[]
  specializations?: string[]
}

export type CreateNotificationPayload = {
  title: string
  message: string
  links?: { label?: string; url: string }[]
  attachments?: { filename: string; url: string; mimeType?: string; size?: number }[]
  target: NotificationTarget
  sendEmail?: boolean
}

export async function createNotification(token: string | null | undefined, payload: CreateNotificationPayload) {
  return request<{ success: boolean; id: string; recipientCount: number }>(`/notifications`, {
    method: 'POST',
    headers: { ...buildAuthHeaders(token || undefined) },
    body: JSON.stringify(payload)
  })
}

export async function listNotifications(token: string | null | undefined) {
  return request<{ success: boolean; items: any[] }>(`/notifications`, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token || undefined) }
  })
}

export async function updateNotification(token: string | null | undefined, id: string, payload: { title?: string; message?: string; links?: { label?: string; url: string }[]; attachments?: { filename: string; url: string; mimeType?: string; size?: number }[] }) {
  return request<{ success: boolean; message: string; notification: any }>(`/notifications/${id}`, {
    method: 'PUT',
    headers: { ...buildAuthHeaders(token || undefined) },
    body: JSON.stringify(payload)
  })
}

export async function deleteNotification(token: string | null | undefined, id: string) {
  return request<{ success: boolean; message: string }>(`/notifications/${id}`, {
    method: 'DELETE',
    headers: { ...buildAuthHeaders(token || undefined) }
  })
}

export async function getNotificationFilters(token: string | null | undefined) {
  return request<{ success: boolean; filters: { years: string[]; departments: string[]; sections: string[]; specializations: string[] } }>(`/notifications/filters`, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token || undefined) }
  })
}

export async function previewRecipients(token: string | null | undefined, target: NotificationTarget) {
  return request<{ success: boolean; recipientCount: number }>(`/notifications/preview`, {
    method: 'POST',
    headers: { ...buildAuthHeaders(token || undefined) },
    body: JSON.stringify({ target })
  })
}

// Student notifications
export async function listMyNotifications(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/notifications/my`
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to fetch notifications')
  }
  return data as { success: boolean; items: Array<{ _id: string; title: string; message: string; createdAt: string }> }
}

export async function getMyUnreadNotificationCount(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/notifications/my/unread-count`
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to fetch unread count')
  }
  return data as { success: boolean; unread: number }
}

export async function markMyNotificationsRead(token: string, ids: string[]) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/notifications/my/mark-read`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders(token) },
    body: JSON.stringify({ ids }),
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to mark read')
  }
  return data as { success: boolean; updated: number }
}

// ------------------- COMPANIES ------------------- //

export type Company = {
  _id: string
  name: string
  email: string
  phone?: string
  website?: string
  address?: string
  description?: string
  industry?: string
  foundedYear?: number
  employeeCount?: string
  contactPerson?: string
  status?: string
  createdAt: string
  updatedAt: string
}

export type CompanyListResponse = {
  success: boolean
  companies: Company[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function listCompanies(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<CompanyListResponse>(`/companies?${qs.toString()}`)
}

export function getCompany(id: string) {
  return request<{ success: boolean; company: Company }>(`/companies/${id}`)
}

export function createCompany(payload: {
  name: string
  email: string
  phone?: string
  website?: string
  address?: string
  description?: string
  industry?: string
  foundedYear?: number
  employeeCount?: string
  contactPerson?: string
}) {
  return request<{ success: boolean; message: string; company: Company }>(`/companies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCompany(id: string, payload: Partial<Company>) {
  return request<{ success: boolean; message: string; company: Company }>(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCompany(id: string) {
  return request<{ success: boolean; message: string }>(`/companies/${id}`, {
    method: 'DELETE',
  })
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

export type CompanyRequest = {
  _id: string
  company: string
  jobRole: string
  description: string
  studentsRequired: number
  minimumCGPA: number
  startDate?: string
  endDate?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  formLinkId?: string
  formData?: any
  createdBy: string
  createdAt: string
  updatedAt: string
}

export function listCompanyRequests(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  return request<{ success: boolean; data: CompanyRequest[]; pagination: any }>(`/companies/requests?${qs.toString()}`)
}

export function getCompanyRequest(id: string) {
  return request<{ success: boolean; data: CompanyRequest }>(`/companies/requests/${id}`)
}

export function createCompanyRequest(token: string | null | undefined, payload: CreateCompanyRequestPayload) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: CompanyRequest }>(`/companies/requests`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export function updateCompanyRequest(token: string | null | undefined, id: string, payload: Partial<CompanyRequest>) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: CompanyRequest }>(`/companies/requests/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  })
}

export function deleteCompanyRequest(token: string | null | undefined, id: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string }>(`/companies/requests/${id}`, {
    method: 'DELETE',
    headers,
  })
}

export function approveCompanyRequest(token: string | null | undefined, id: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; data: { request: CompanyRequest; job: any } }>(`/companies/requests/${id}/approve`, {
    method: 'PUT',
    headers,
  })
}

export function rejectCompanyRequest(token: string | null | undefined, id: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; data: CompanyRequest }>(`/companies/requests/${id}/reject`, {
    method: 'PUT',
    headers,
  })
}

// ------------------- COMPANY FORM LINKS ------------------- //

export type CompanyFormLink = {
  _id: string
  linkId: string
  companyName: string
  isActive: boolean
  submissions: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export function createCompanyFormLink(token: string | null | undefined, payload: { companyName: string }) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; data: { linkId: string; companyName: string; link: string; createdAt: string } }>(`/companies/form-links`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export function listCompanyFormLinks(token: string | null | undefined, params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, String(v)) })
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: CompanyFormLink[]; pagination: any }>(`/companies/form-links?${qs.toString()}`, {
    method: 'GET',
    headers,
  })
}

export function getCompanyFormLink(linkId: string) {
  return request<{ success: boolean; data: { companyName: string } }>(`/companies/form-links/${linkId}`)
}

export function submitCompanyForm(payload: any, jdFile?: File) {
  const formData = new FormData()
  
  // Add all form fields
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })
  
  // Add JD file if provided
  if (jdFile) {
    formData.append('jdFile', jdFile)
  }
  
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/companies/requests/submit`
  
  return fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  }).then(async (res) => {
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.error || data?.message || 'Form submission failed')
    }
    return data as { success: boolean; message: string; requestId: string; linkId: string }
  })
}

// ------------------- EXTERNAL JOBS (Enhanced) ------------------- //

export type ExternalJob = {
  _id: string
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
  status: 'Active' | 'Inactive' | 'Expired' | 'Filled'
  postedBy: string
  createdAt: string
  updatedAt: string
}

export type ExternalJobListResponse = {
  success: boolean
  data: ExternalJob[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export function getExternalJob(id: string) {
  return request<{ success: boolean; data: ExternalJob }>(`/external-jobs/${id}`)
}

export function updateExternalJob(token: string | null | undefined, id: string, payload: Partial<CreateExternalJobPayload>) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; data: ExternalJob }>(`/external-jobs/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  })
}

export function deleteExternalJob(token: string | null | undefined, id: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string }>(`/external-jobs/${id}`, {
    method: 'DELETE',
    headers,
  })
}

export function updateExternalJobStatus(token: string | null | undefined, id: string, status: 'Active' | 'Inactive' | 'Expired' | 'Filled') {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; data: ExternalJob }>(`/external-jobs/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  })
}

export function getExternalJobsStats(token: string | null | undefined) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; data: { totalJobs: number; activeJobs: number; expiredJobs: number; recentJobs: number; statusBreakdown: any[]; jobsByType: any[] } }>(`/external-jobs/stats/overview`, {
    method: 'GET',
    headers,
  })
}

export function bulkUpdateExpiredJobs(token: string | null | undefined) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; modifiedCount: number }>(`/external-jobs/bulk-update-expired`, {
    method: 'POST',
    headers,
  })
}

export function sendExternalJobEmail(token: string | null | undefined, id: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; sent: number; total: number }>(`/external-jobs/${id}/send-email`, {
    method: 'POST',
    headers,
  })
}

// ------------------- JOBS (Enhanced) ------------------- //

export function updateJob(token: string | null | undefined, id: string, payload: Partial<CreateJobPayload>) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string; data: any }>(`/jobs/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  })
}

export function deleteJob(token: string | null | undefined, id: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; message: string }>(`/jobs/${id}`, {
    method: 'DELETE',
    headers,
  })
}

// Get job applications (for placement officers)
export function getJobApplications(token: string | null | undefined, jobId: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; items: any[] }>(`/jobs/${jobId}/applications`, {
    method: 'GET',
    headers,
  })
}

// Send job applications via email (for placement officers)
export function sendJobApplicationsEmail(token: string | null | undefined, jobId: string, to?: string) {
  const headers: Record<string, string> = { ...buildAuthHeaders(token || undefined) }
  return request<{ success: boolean; sent: number }>(`/jobs/${jobId}/applications/send-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ to }),
  })
}

// ------------------- STUDENT DASHBOARD & ANALYTICS ------------------- //

export function getStudentDashboardData(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/students/dashboard`

  const res = fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to get dashboard data')
    }
    return data as { success: boolean; data: any }
  })
}

// ------------------- PLACEMENT OFFICER DASHBOARD & ANALYTICS ------------------- //

export function getPlacementOfficerDashboardData(token: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/placement-officer/dashboard`

  const res = fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to get dashboard data')
    }
    return data as { success: boolean; data: any }
  })
}

// ------------------- STUDENT MANAGEMENT (Enhanced) ------------------- //

export function getStudentById(token: string, studentId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/placement-officer/students/${studentId}`

  const res = fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to get student')
    }
    return data as { success: boolean; student: any }
  })
}

export function updateStudent(token: string, studentId: string, payload: any) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/placement-officer/students/${studentId}`

  const res = fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to update student')
    }
    return data as { success: boolean; message: string; student: any }
  })
}

export function deleteStudent(token: string, studentId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/placement-officer/students/${studentId}`

  const res = fetch(url, {
    method: 'DELETE',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to delete student')
    }
    return data as { success: boolean; message: string }
  })
}

// ------------------- RESUME MANAGEMENT (Enhanced) ------------------- //

export function downloadResume(token: string, resumeId: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/${resumeId}/download`

  return fetch(url, {
    method: 'GET',
    headers: { ...buildAuthHeaders(token) },
    credentials: 'include',
  }).then(async (response) => {
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data?.error || data?.message || 'Failed to download resume')
    }
    return response.blob()
  })
}

// ------------------- SHORTLIST MANAGEMENT ------------------- //

export function forwardShortlist(token: string, shortlistId: string, payload: { recipients: string[]; message?: string }) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/po/shortlists/${shortlistId}/forward`

  const res = fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'Failed to forward shortlist')
    }
    return data as { success: boolean; message: string }
  })
}

// ------------------- ATS ANALYSIS (Enhanced) ------------------- //

export function analyzeATSWithResumeId(token: string, resumeId: string, jobRole: string) {
  const baseUrl = API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
  const url = `${baseUrl}/api/resume/analyze-ats`

  const res = fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...buildAuthHeaders(token)
    },
    body: JSON.stringify({ resumeId, jobRole }),
    credentials: 'include',
  })

  return res.then(async (response) => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'ATS analysis failed')
    }
    return data as { success: boolean; atsAnalysis: ATSAnalysis; resume: any }
  })
}

export { request }

// ---------- Filters ---------- //
export function getStudentFilterOptions() {
  return request<{ success: boolean; filters: { departments: string[]; courses: string[]; years: string[]; programTypes: string[] } }>(`/placement-officer/students/filters`)
}

// ------------------- ELIGIBILITY & PROGRAM STATS ------------------- //

export type EligibilitySettings = {
  attendanceMin: number
  backlogMax: number
  cgpaMin: number
  updatedBy?: string
  updatedAt?: string
}

export async function getEligibilitySettings(token: string) {
  return request<{ success: boolean; settings: EligibilitySettings }>(`/placement-officer/eligibility-settings`, {
    headers: buildAuthHeaders(token)
  })
}

export async function updateEligibilitySettings(token: string, payload: Partial<EligibilitySettings>) {
  return request<{ success: boolean; settings: EligibilitySettings; programStats: { overall: { total: number; registered: number; eligible: number; placed: number; placementRate: number }; byProgram: Array<{ programType: string; total: number; registered: number; eligible: number; placed: number; placementRate: number }> } }>(`/placement-officer/eligibility-settings`, {
    method: 'PUT',
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload)
  })
}

export async function getProgramTypeStats() {
  return request<{ success: boolean; settings: EligibilitySettings; programStats: { overall: { total: number; registered: number; eligible: number; placed: number; placementRate: number }; byProgram: Array<{ programType: string; total: number; registered: number; eligible: number; placed: number; placementRate: number }> } }>(`/placement-officer/program-type-stats`)
}