import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import Login from './pages/Login'
import OtpPage from './pages/Otp'
import PlacementOfficerDashboard from './pages/placement-officer/Dashboard'
import BulkUpload from './pages/placement-officer/BulkUpload'
import CreateOfficerPage from './pages/placement-officer/CreateOfficer'
import NewJobPost from './componies/NewJobPost'
import StudentDashboard from './pages/student/Dashboard'
import StudentOnboarding from './pages/student/Onboarding'
import StudentAtsResults from './pages/student/AtsResults'
import { getAuth } from './global/auth'

function AppRoutes() {
  const location = useLocation()
  const [auth, setAuth] = useState(getAuth())

  useEffect(() => {
    setAuth(getAuth())
  }, [location])

  useEffect(() => {
    const onStorage = () => setAuth(getAuth())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const loggedIn = !!auth?.token
  const officer = auth?.user.role === 'placement_officer'
  const studentOnboarded = auth?.user.role === 'student' && localStorage.getItem('student_onboarded') === 'true'
  const onboardingPercent = Number(localStorage.getItem('onboarding_completion') || '0')

  // Debug logging
  console.log('🔍 Routing Debug:', {
    loggedIn,
    officer,
    studentOnboarded,
    onboardingPercent,
    currentPath: location.pathname,
    userRole: auth?.user.role
  })

  return (
    <Routes>
      <Route path="/" element={<Navigate to={loggedIn ? (officer ? '/placement-officer' : '/student') : '/login'} replace />} />
      <Route path="/login" element={loggedIn ? <Navigate to={officer ? '/placement-officer' : '/student'} replace /> : <Login />} />
      
      {/* Catch-all for /onboarding redirect */}
      <Route path="/onboarding" element={<Navigate to="/student/onboarding" replace />} />
      
      <Route path="/student" element={loggedIn && !officer ? (studentOnboarded ? <StudentDashboard /> : <Navigate to="/student/onboarding" replace />) : <Navigate to="/login" replace />} />
      <Route path="/student/onboarding" element={loggedIn && !officer ? (studentOnboarded ? <Navigate to="/student" replace /> : <StudentOnboarding />) : <Navigate to="/login" replace />} />
      <Route path="/student/ats-results" element={loggedIn && !officer ? <StudentAtsResults /> : <Navigate to="/login" replace />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/placement-officer" element={loggedIn && officer ? <PlacementOfficerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/placement-officer/bulk-upload" element={loggedIn && officer ? <BulkUpload /> : <Navigate to="/login" replace />} />
      <Route path="/placement-officer/create-officer" element={loggedIn && officer ? <CreateOfficerPage /> : <Navigate to="/login" replace />} />
      <Route path="/placement-officer/new-job-post" element={loggedIn && officer ? <NewJobPost /> : <Navigate to="/login" replace />} />
      
      {/* Catch-all for unknown routes */}
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