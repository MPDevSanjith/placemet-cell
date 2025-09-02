import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import Login from './pages/Login'
import OtpPage from './pages/Otp'
import PlacementOfficerDashboard from './pages/placement-officer/Dashboard'
import BulkUpload from './pages/placement-officer/BulkUpload'
import CreateOfficerPage from './pages/placement-officer/CreateOfficer'
import StudentDashboard from './pages/student/Dashboard'
import StudentOnboarding from './pages/student/Onboarding'
import StudentAtsResults from './pages/student/AtsResults'
import ProfilePage from './pages/student/ProfilePage'
import { useAuth } from './hooks/useAuth'
import { getCompletionStatus } from './global/api'
import { getAuth } from './global/auth'

// Types for student status
interface StudentStatus {
  hasResume: boolean
  isOnboarded: boolean
  completionPercentage: number
}

function AppRoutes() {
  const location = useLocation()
  const { auth, isLoading: authLoading, isAuthenticated, userRole } = useAuth()
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)

  // Check student status from backend when auth changes
  useEffect(() => {
    const checkStudentStatus = async () => {
      if (auth?.token && userRole === 'student' && !hasNavigated) {
        try {
          setIsLoadingStatus(true)
          
          // Fast timeout for backend check (2 seconds max)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Backend timeout')), 2000)
          })
          
          const statusPromise = getCompletionStatus(auth.token)
          const response = await Promise.race([statusPromise, timeoutPromise])
          
          if (response && typeof response === 'object' && 'success' in response && response.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const completionData = response as Record<string, any>
            if (completionData.completion?.breakdown?.resume !== undefined && completionData.completion?.percentage !== undefined) {
              setStudentStatus({
                hasResume: completionData.completion.breakdown.resume > 0,
                isOnboarded: completionData.completion.percentage >= 80,
                completionPercentage: completionData.completion.percentage
              })
            } else {
              throw new Error('Invalid completion data')
            }
          } else {
            throw new Error('Invalid response')
          }
        } catch {
          console.log('⚠️ Backend status check failed, using localStorage fallback')
          
          // Fast fallback to localStorage
          const fallbackStatus = localStorage.getItem('student_onboarded') === 'true'
          const hasResume = localStorage.getItem('resume_uploaded') === 'true'
          
          setStudentStatus({
            hasResume: hasResume || fallbackStatus,
            isOnboarded: fallbackStatus,
            completionPercentage: fallbackStatus ? 100 : 0
          })
        } finally {
          setIsLoadingStatus(false)
        }
      } else {
        setIsLoadingStatus(false)
      }
    }

    checkStudentStatus()
  }, [auth, userRole, hasNavigated])

  // Prevent multiple navigations
  useEffect(() => {
    if (isAuthenticated && userRole && !hasNavigated) {
      setHasNavigated(true)
    }
  }, [isAuthenticated, userRole, hasNavigated])

  // Debug logging
  console.log('🔍 Routing Debug:', {
    isAuthenticated,
    userRole,
    studentStatus,
    authLoading,
    isLoadingStatus,
    currentPath: location.pathname,
    hasNavigated,
    localStorage: {
      student_onboarded: localStorage.getItem('student_onboarded'),
      resume_uploaded: localStorage.getItem('resume_uploaded')
    }
  })

  // Quick loading state (max 1 second)
  if (authLoading && !getAuth()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Quick verification...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={
        <Navigate to={
          isAuthenticated 
            ? (userRole === 'placement_officer' ? '/placement-officer' : '/student') 
            : '/login'
        } replace />
      } />
      
      {/* Login route */}
      <Route path="/login" element={
        isAuthenticated 
          ? <Navigate to={userRole === 'placement_officer' ? '/placement-officer' : '/student'} replace />
          : <Login />
      } />
      
      {/* OTP verification - Always accessible (part of auth flow) */}
      <Route path="/otp" element={<OtpPage />} />
      
      {/* Student Routes */}
      <Route path="/student" element={
        isAuthenticated && userRole === 'student'
          ? <StudentDashboard />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/student/onboarding" element={
        isAuthenticated && userRole === 'student'
          ? <StudentOnboarding />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/student/ats-results" element={
        isAuthenticated && userRole === 'student'
          ? <StudentAtsResults />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/student/profile" element={
        isAuthenticated && userRole === 'student'
          ? <ProfilePage />
          : <Navigate to="/login" replace />
      } />
      
      {/* Placement Officer Routes */}
      <Route path="/placement-officer" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <PlacementOfficerDashboard />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/bulk-upload" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <BulkUpload />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/create-officer" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <CreateOfficerPage />
          : <Navigate to="/login" replace />
      } />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App 