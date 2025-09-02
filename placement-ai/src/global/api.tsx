const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api${path}`

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
}

export function login(payload: LoginPayload) {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/placement-officer/bulk-upload`
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
  return request<{ success: boolean; results: unknown }>('/placement-officer/send-welcome-emails', {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  })
}

export function sendBulkWelcomeEmailsWithCredentials(students: Array<{ email: string; password: string; name?: string }>) {
  return request<{ success: boolean; results: unknown }>('/placement-officer/send-welcome-emails', {
    method: 'POST',
    body: JSON.stringify({ students }),
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

// ------------------- OFFICERS ------------------- //

export function createOfficer(payload: { name: string; email: string }) {
  return request<{ success: boolean; officer: unknown }>('/placement-officer/create-officer', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ------------------- ONBOARDING & ATS ------------------- //

export function submitOnboarding(payload: Record<string, unknown>, token: string) {
  return request<{ success: boolean }>('/students/onboarding', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/upload`
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
    headers: { Authorization: `Bearer ${token}` },
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/analyze-ats`
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
    headers: { Authorization: `Bearer ${token}` },
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
  const url = resumeId 
    ? `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/analysis/${resumeId}`
    : `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/analysis`

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/list`

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to list resumes')
  }
  
  return data as { success: boolean; resumes: Array<{ id: string; filename: string; originalName: string; cloudinaryUrl: string; uploadDate: string; hasAtsAnalysis: boolean }> }
}

// Delete resume
export async function deleteResume(token: string, resumeId: string) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/${resumeId}`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/fix-url/${resumeId}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/fix-all-urls`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/resume/regenerate-urls`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
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
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/profile/comprehensive`

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to get student profile')
  }
  
  return data as { success: boolean; profile: StudentProfile; studentId: string }
}

// Get profile completion status
export async function getCompletionStatus(token: string) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/profile/completion`

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to get completion status')
  }
  
  return data as { success: boolean; completion: ProfileCompletion }
}

// Update comprehensive student profile
export async function updateStudentProfile(token: string, profileData: {
  basicInfo?: Partial<StudentProfile['basicInfo']>
  academicInfo?: Partial<StudentProfile['academicInfo']>
  placementInfo?: Partial<StudentProfile['placementInfo']>
}) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/profile/comprehensive`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update profile')
  }
  
  return data as { success: boolean; message: string; completion: ProfileCompletion }
}

// Update student skills
export async function updateStudentSkills(token: string, skills: string[]) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/profile/skills`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ skills }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update skills')
  }
  
  return data as { success: boolean; message: string; skills: string[]; completion: ProfileCompletion }
}

// Update student projects
export async function updateStudentProjects(token: string, projects: string[]) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/profile/projects`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ projects }),
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Failed to update projects')
  }
  
  return data as { success: boolean; message: string; projects: string[]; completion: ProfileCompletion }
}

// Legacy functions for backward compatibility
export function saveAtsScore(payload: { role: string; overall: number; breakdown: Record<string, number>; matched: string[]; missing: string[] }, token: string) {
  return request<{ success: boolean }>('/students/ats-score', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function analyzeAtsOnServer(payload: { role?: string; skillsTech?: string[]; gpa?: string }, token: string) {
  return request<{ success: boolean; result: { role: string; overall: number; breakdown: Record<string, number>; matched: string[]; missing: string[]; suggestions: string[] } }>('/resume/analyze-ats', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export { request }
