export type AuthUser = { id: string | number; email: string; name?: string; role: 'student' | 'placement_officer' }
export type AuthState = { token: string; user: AuthUser }

const KEY = 'erp_auth'

export function saveAuth(state: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function getAuth(): AuthState | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthState } catch { return null }
}

export function clearAuth() {
  localStorage.removeItem(KEY)
}

export function isLoggedIn() {
  return !!getAuth()?.token
}

export function isOfficer() {
  return getAuth()?.user.role === 'placement_officer'
}

export function isStudent() {
  return getAuth()?.user.role === 'student'
}
