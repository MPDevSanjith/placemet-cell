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
  otpRequired?: boolean
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

export async function uploadResume(file: File, token: string) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/resume`
  const form = new FormData()
  form.append('resume', file)

  // Debug logging
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

  const data = (await res.json().catch(() => ({}))) as { success?: boolean; link?: string; id?: string; error?: string; message?: string }
  if (!res.ok) throw new Error(data?.error || data?.message || 'Upload failed')
  return data as { success: boolean; link?: string; id?: string; error?: string; message?: string }
}

export async function analyzeATS(file: File, token: string) {
  const url = `${API_BASE_URL ?? 'http://localhost:5000'}/api/students/ats-analyze`
  const form = new FormData()
  form.append('resume', file)

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    credentials: 'include',
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || data?.message || 'ATS analysis failed')
  return data
}

export function saveAtsScore(payload: { role: string; overall: number; breakdown: Record<string, number>; matched: string[]; missing: string[] }, token: string) {
  return request<{ success: boolean }>('/students/ats-score', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function analyzeAtsOnServer(payload: { role?: string; skillsTech?: string[]; gpa?: string }, token: string) {
  return request<{ success: boolean; result: { role: string; overall: number; breakdown: Record<string, number>; matched: string[]; missing: string[]; suggestions: string[] } }>('/students/ats-analyze', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export { request }
