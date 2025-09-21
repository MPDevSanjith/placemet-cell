import { useState, useEffect, useCallback } from 'react'
import { getAuth, verifyAuthFromBackend, getUserRoleFromBackend, clearAuth } from '../global/auth'
import { logout as apiLogout } from '../global/api'

export interface AuthUser {
  id: string | number
  email: string
  name?: string
  role: 'student' | 'placement_officer'
}

export interface AuthState {
  token: string
  user: AuthUser
}

export interface UseAuthReturn {
  auth: AuthState | null
  isLoading: boolean
  isAuthenticated: boolean
  userRole: string | null
  verifyAuth: () => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState(0)

  // Fast authentication verification
  const verifyAuth = useCallback(async (): Promise<boolean> => {
    const localAuth = getAuth()
    
    if (!localAuth?.token || !localAuth?.user?.id) {
      setAuth(null)
      setUserRole(null)
      setIsLoading(false)
      return false
    }

    // Debounce rapid calls (minimum 2000ms between checks for better performance)
    const now = Date.now()
    if (now - lastCheck < 2000) {
      if (!import.meta.env.PROD) console.log('⏱️ Debouncing rapid auth check')
      return !!auth // Return current state
    }
    setLastCheck(now)

    // Set auth immediately from local storage for fast response
    setAuth(localAuth)
    setUserRole(localAuth.user.role)
    setIsLoading(false)

    // Then try backend verification in background (non-blocking)
    try {
      // Very fast timeout (2 seconds max)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Backend timeout')), 2000)
      })

      const verificationPromise = verifyAuthFromBackend(localAuth.token)
      const verification = await Promise.race([verificationPromise, timeoutPromise])
      
      if (verification.isValid) {
        // Backend verification successful, update with fresh data
        const backendRole = await getUserRoleFromBackend(localAuth.token)
        
        if (backendRole) {
          const verifiedAuth: AuthState = {
            token: localAuth.token,
            user: {
              ...localAuth.user,
              role: backendRole as 'student' | 'placement_officer'
            }
          }

          setAuth(verifiedAuth)
          setUserRole(backendRole)
          return true
        }
      }
    } catch (error) {
      if (!import.meta.env.PROD) console.log('⚠️ Backend verification failed, using local auth')
      // Keep using local auth on backend failure
    }

    return true
  }, [lastCheck]) // Removed auth dependency to prevent loops

  // Refresh authentication data
  const refreshAuth = useCallback(async () => {
    await verifyAuth()
  }, [verifyAuth])

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call backend logout first to clear server-side session
      await apiLogout()
    } catch (error) {
      console.warn('Backend logout failed, continuing with local logout:', error)
      // Continue with local logout even if backend fails
    } finally {
      // Always clear local auth and redirect
      clearAuth()
      setAuth(null)
      setUserRole(null)
      window.location.href = '/login'
    }
  }, [])

  // Check authentication on mount only
  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      if (mounted) {
        await verifyAuth()
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - only run on mount

  // Listen for storage changes (other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      // Only verify if we have local auth
      const localAuth = getAuth()
      if (localAuth?.token) {
        verifyAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, []) // Empty dependency array to prevent loops

  // Calculate isAuthenticated based on current state
  const isAuthenticated = !!auth && !!auth.token && !!userRole && !!auth.user.id
  
  // Debug logging for authentication state
  if (!import.meta.env.PROD) console.log('🔐 Auth State Debug:', {
    hasAuth: !!auth,
    hasToken: !!auth?.token,
    hasUserRole: !!userRole,
    hasUserId: !!auth?.user?.id,
    isAuthenticated,
    auth: auth ? { token: auth.token ? '***' : null, user: auth.user } : null
  })

  return {
    auth,
    isLoading,
    isAuthenticated,
    userRole,
    verifyAuth,
    logout,
    refreshAuth
  }
}
