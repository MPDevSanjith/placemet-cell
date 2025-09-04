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

// Verify authentication from backend
export async function verifyAuthFromBackend(token: string): Promise<{ isValid: boolean; user?: AuthUser; role?: string }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      console.warn('Backend verification failed, status:', response.status)
      return { isValid: false }
    }

    const data = await response.json()
    return {
      isValid: true,
      user: data.user,
      role: data.user?.role
    }
  } catch (error) {
    console.error('Auth verification failed:', error)
    return { isValid: false }
  }
}

// Get user role from backend
export async function getUserRoleFromBackend(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      console.warn('Failed to get user role, status:', response.status)
      return null
    }

    const data = await response.json()
    return data.user?.role || null
  } catch (error) {
    console.error('Failed to get user role:', error)
    return null
  }
}
