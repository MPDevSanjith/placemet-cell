import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import Login from './pages/Login'
import PlacementOfficerDashboard from './pages/placement-officer/Dashboard'
import OfficerStudents from './pages/placement-officer/OfficerStudents'
import BulkUpload from './pages/placement-officer/BulkUpload'
import BiodataUpload from './pages/placement-officer/BiodataUpload'
import CreateOfficerPage from './pages/placement-officer/CreateOfficer'
import CompaniesPage from './pages/placement-officer/Companies'
import StudentDashboard from './pages/student/Dashboard'
import StudentJobs from './pages/student/job'
import MyJobs from './pages/student/MyJobs'
import StudentOnboarding from './pages/student/Onboarding'
import StudentAtsResults from './pages/student/AtsResults'
import ProfilePage from './pages/student/ProfilePage'
import StudentGate from './pages/student/StudentGate'
import StudentNotificationsPage from './pages/student/Notifications'
import PlacementAnalytics from './pages/placement-officer/Analytics'
import CompanyForm from './pages/CompanyForm'
import PlacementGate from './pages/placement-officer/PlacementGate'
import OfficerNotificationsPage from './pages/placement-officer/Notifications'
import JobPortal from './pages/JobPortal'
import JobDetails from './pages/JobDetails'
import AboutUs from './pages/AboutUs'
import Contact from './pages/Contact'
import Help from './pages/Help'
import { useAuth } from './hooks/useAuth'
import { getCompletionStatus, listResumes } from './global/api'
import { getAuth } from './global/auth'
import { ToastProvider } from './components/ui/Toast'


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
          console.log('⚠️ Completion API failed, attempting resume list fallback (no localStorage)')
          try {
            const token = auth?.token as string
            const list = await listResumes(token)
            const hasResume = Array.isArray(list?.resumes) && list.resumes.length > 0
            setStudentStatus({
              hasResume,
              isOnboarded: hasResume, // treat resume presence as onboarding complete
              completionPercentage: hasResume ? 100 : 0
            })
          } catch {
            // As a final safe fallback with no local storage, assume not onboarded
            setStudentStatus({ hasResume: false, isOnboarded: false, completionPercentage: 0 })
          }
        } finally {
          setIsLoadingStatus(false)
        }
      } else {
        setIsLoadingStatus(false)
      }
    }

    checkStudentStatus()
  }, [auth, userRole, hasNavigated])

  // Prevent multiple navigations - but allow re-authentication
  useEffect(() => {
    if (isAuthenticated && userRole && !hasNavigated) {
      setHasNavigated(true)
    }
  }, [isAuthenticated, userRole, hasNavigated])

  // Reset navigation flag when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setHasNavigated(false)
    }
  }, [isAuthenticated])

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const localAuth = getAuth()
    if (localAuth?.token && localAuth?.user?.id && localAuth?.user?.role) {
      console.log('🔐 Found valid local auth, initializing state')
      // This will trigger the useAuth hook to verify the token
    }
  }, [])

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

  // If we have auth data but still loading, show a brief loading state
  if (authLoading && getAuth() && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
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
      
      {/* OTP route removed: OTP is now handled inside Login */}
      
      {/* Gate Routes - Always accessible (part of auth flow) */}
      <Route path="/student-gate" element={<StudentGate />} />
      <Route path="/placement-gate" element={<PlacementGate />} />
      
      {/* Public Pages */}
      <Route path="/jobs" element={<JobPortal />} />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/help" element={<Help />} />
      
      {/* Test Route - For development only */}
      <Route path="/test-gates" element={<div>Test Gates Page</div>} />
      
      {/* Student Routes */}
      <Route path="/student" element={
        isAuthenticated && userRole === 'student'
          ? (
            isLoadingStatus || !studentStatus
              ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your status...</p>
                  </div>
                </div>
              )
              : (
                studentStatus.hasResume
                  ? <StudentDashboard />
                  : <Navigate to="/student/onboarding" replace />
              )
          )
          : <Navigate to="/login" replace />
      } />
      <Route path="/student/jobs" element={
        isAuthenticated && userRole === 'student'
          ? <StudentJobs />
          : <Navigate to="/login" replace />
      } />
      <Route path="/student/my-jobs" element={
        isAuthenticated && userRole === 'student'
          ? <MyJobs />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/student/onboarding" element={
        isAuthenticated && userRole === 'student'
          ? (
            isLoadingStatus || !studentStatus
              ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparing onboarding...</p>
                  </div>
                </div>
              )
              : (
                studentStatus.hasResume
                  ? <Navigate to="/student" replace />
                  : <StudentOnboarding />
              )
          )
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
      
      <Route path="/student/notifications" element={
        isAuthenticated && userRole === 'student'
          ? <StudentNotificationsPage />
          : <Navigate to="/login" replace />
      } />
      
      {/* Placement Officer Routes */}
      <Route path="/placement-officer" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <PlacementOfficerDashboard />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/notifications" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <OfficerNotificationsPage />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/analytics" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <PlacementAnalytics />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/bulk-upload" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <BulkUpload />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/biodata-upload" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <BiodataUpload />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/students" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <OfficerStudents />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/create-officer" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <CreateOfficerPage />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/new-job-post" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <CompaniesPage />
          : <Navigate to="/login" replace />
      } />
      
      {/* Public Company Form Route */}
      <Route path="/company-form/:linkId" element={<CompanyForm />} />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ToastProvider>
  )
}

export default App
