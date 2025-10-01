import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, Suspense, lazy } from 'react'
import './App.css'
import './index.css'
import Login from './pages/Login'
import Loader from './components/ui/Loader'

// Lazy load heavy components for better performance
const PlacementOfficerDashboard = lazy(() => import('./pages/placement-officer/Dashboard'))
const OfficerStudents = lazy(() => import('./pages/placement-officer/OfficerStudents'))
const BulkUpload = lazy(() => import('./pages/placement-officer/BulkUpload'))
const BatchManagement = lazy(() => import('./pages/placement-officer/BatchManagement'))
const BiodataUpload = lazy(() => import('./pages/placement-officer/BiodataUpload'))
const CreateOfficerPage = lazy(() => import('./pages/placement-officer/CreateOfficer'))
const CreateCoordinatorPage = lazy(() => import('./pages/placement-officer/CreateCoordinator'))
const CompaniesPage = lazy(() => import('./pages/placement-officer/Companies'))
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const StudentJobs = lazy(() => import('./pages/student/job'))
const MyJobs = lazy(() => import('./pages/student/MyJobs'))
const StudentAtsResults = lazy(() => import('./pages/student/AtsResults'))
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'))
const StudentGate = lazy(() => import('./pages/student/StudentGate'))
const StudentNotificationsPage = lazy(() => import('./pages/student/Notifications'))
const PlacementAnalytics = lazy(() => import('./pages/placement-officer/Analytics'))
import AIChatbot from './pages/placement-officer/AIChatbot'
import Settings from './pages/placement-officer/Settings'
import CompanyForm from './pages/CompanyForm'
import PlacementGate from './pages/placement-officer/PlacementGate'
import OfficerNotificationsPage from './pages/placement-officer/Notifications'
import JobPortal from './pages/JobPortal'
import JobDetails from './pages/JobDetails'
import RequestDetails from './pages/placement-officer/RequestDetails'
import SearchPage from './pages/SearchPage'
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
    let mounted = true
    
    const checkStudentStatus = async () => {
      if (auth?.token && userRole === 'student' && !hasNavigated && mounted) {
        try {
          setIsLoadingStatus(true)
          
          // Fast timeout for backend check (3 seconds max)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Backend timeout')), 3000)
          })
          
          const statusPromise = getCompletionStatus(auth.token)
          const response = await Promise.race([statusPromise, timeoutPromise])
          
          if (mounted && response && typeof response === 'object' && 'success' in response && response.success) {
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
          if (mounted) {
            console.log('⚠️ Completion API failed, attempting resume list fallback (no localStorage)')
            try {
              const token = auth?.token as string
              const list = await listResumes(token)
              const hasResume = Array.isArray(list?.resumes) && list.resumes.length > 0
              if (mounted) {
                setStudentStatus({
                  hasResume,
                  isOnboarded: hasResume, // treat resume presence as onboarding complete
                  completionPercentage: hasResume ? 100 : 0
                })
              }
            } catch {
              // As a final safe fallback with no local storage, assume not onboarded
              if (mounted) {
                setStudentStatus({ hasResume: false, isOnboarded: false, completionPercentage: 0 })
              }
            }
          }
        } finally {
          if (mounted) {
            setIsLoadingStatus(false)
          }
        }
      } else if (mounted) {
        setIsLoadingStatus(false)
      }
    }

    checkStudentStatus()
    
    return () => {
      mounted = false
    }
  }, [auth?.token, userRole, hasNavigated]) // More specific dependencies

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

  // Initialize auth state from localStorage on mount (only once)
  useEffect(() => {
    const localAuth = getAuth()
    if (localAuth?.token && localAuth?.user?.id && localAuth?.user?.role) {
      console.log('🔐 Found valid local auth, initializing state')
      // This will trigger the useAuth hook to verify the token
    }
  }, []) // Empty dependency array - only run once on mount

  // Debug logging
  if (!import.meta.env.PROD) console.log('🔍 Routing Debug:', {
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
    <Suspense fallback={<Loader />}>
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
      <Route path="/search" element={<SearchPage />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/help" element={<Help />} />
      <Route path="/settings" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <Navigate to="/placement-officer/settings" replace />
          : isAuthenticated && userRole === 'student'
          ? <Navigate to="/student/profile" replace />
          : <Navigate to="/login" replace />
      } />
      
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
                <StudentDashboard />
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
      
      {/* Onboarding disabled */}
      <Route path="/student/onboarding" element={<Navigate to="/student" replace />} />
      
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
      <Route path="/placement-officer/ai-chatbot" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <AIChatbot />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/analytics" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <PlacementAnalytics />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/settings" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <Settings />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/bulk-upload" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <BulkUpload />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/batch-management" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <BatchManagement />
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
      <Route path="/placement-officer/all-students" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <OfficerStudents />
          : <Navigate to="/login" replace />
      } />
      
      <Route path="/placement-officer/create-officer" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <CreateOfficerPage />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/create-coordinator" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <CreateCoordinatorPage />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/new-job-post" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <CompaniesPage />
          : <Navigate to="/login" replace />
      } />
      <Route path="/placement-officer/requests/:id" element={
        isAuthenticated && userRole === 'placement_officer'
          ? <RequestDetails />
          : <Navigate to="/login" replace />
      } />
      
      {/* Public Company Form Route */}
      <Route path="/company-form/:linkId" element={<CompanyForm />} />
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
