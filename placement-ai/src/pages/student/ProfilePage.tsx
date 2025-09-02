import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  getStudentProfile, StudentProfile, 
  listResumes, deleteResume, uploadResume, getResumeAnalysis,
  updateStudentProfile, updateStudentSkills, updateStudentProjects
} from '../../global/api'
import { getAuth } from '../../global/auth'
import Layout from '../../components/Layout'
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiBookOpen, FiAward, 
  FiBriefcase, FiDownload, FiEdit3, FiCheckCircle, FiAlertCircle, 
  FiStar, FiTrendingUp, FiTarget, FiCalendar, FiPlus, FiTrash2,
  FiEye, FiUpload, FiX, FiCheck, FiClock, FiAlertTriangle
} from 'react-icons/fi'

// Resume Viewer Content Component with Error Handling
const ResumeViewerContent: React.FC<{ resume: any }> = ({ resume }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => {
    // Reset states when resume changes
    setLoading(true)
    setError(null)
    setIframeKey(prev => prev + 1)
    
    // Simulate loading time for better UX
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [resume.id])

  const handleIframeLoad = () => {
    setLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setLoading(false)
    setError('Failed to load resume. The file may be corrupted or inaccessible.')
  }

  const retryLoad = () => {
    setLoading(true)
    setError(null)
    setIframeKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading resume...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Resume</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={retryLoad}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <FiEye className="mr-2 h-4 w-4" />
              Retry Loading
            </button>
            <a
              href={resume.cloudinaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              Download Instead
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <iframe
        key={iframeKey}
        src={resume.cloudinaryUrl}
        className="w-full h-full border-0 rounded-lg"
        title={resume.originalName}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  )
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [resumes, setResumes] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ section: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [resumeViewer, setResumeViewer] = useState<{ show: boolean; resume: any | null }>({ show: false, resume: null })
  
  // ATS Analysis State
  const [atsPopup, setAtsPopup] = useState<{ show: boolean; data: any; resumeId: string | null }>({ show: false, data: null, resumeId: null })
  const [atsRolePopup, setAtsRolePopup] = useState<{ show: boolean; resumeId: string | null }>({ show: false, resumeId: null })
  const [selectedJobRole, setSelectedJobRole] = useState('')
  const [customJobRole, setCustomJobRole] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const auth = getAuth()

  // Predefined job roles for dropdown
  const jobRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Data Analyst',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Product Manager',
    'UI/UX Designer',
    'QA Engineer',
    'System Administrator',
    'Network Engineer',
    'Cybersecurity Analyst',
    'Business Analyst',
    'Project Manager',
    'Technical Writer',
    'Support Engineer',
    'Sales Engineer',
    'Other'
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    if (!auth?.token) {
      setError('No authentication token found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('🔍 Fetching profile with token:', auth.token)
      const response = await getStudentProfile(auth.token)
      console.log('✅ Profile response:', response)
      console.log('👤 Profile data:', response.profile)
      console.log('🔍 Profile structure:', {
        hasProfile: !!response.profile,
        profileKeys: response.profile ? Object.keys(response.profile) : [],
        profileId: response.profile?._id || response.profile?.id,
        authUserId: auth.user?.id
      })
      setProfile(response.profile)
      setError(null)
      
      // Also fetch resumes
      await fetchResumes()
    } catch (err) {
      console.error('❌ Failed to fetch profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumes = async () => {
    if (!auth?.token) return
    
    try {
      const response = await listResumes(auth.token)
      console.log('📄 Resumes response:', response)
      setResumes(response.resumes || [])
    } catch (err) {
      console.error('❌ Failed to fetch resumes:', err)
    }
  }

    const handleResumeUpload = async (file: File) => {
    if (!auth?.token) return
    
    try {
      setUploading(true)
      console.log('🚀 Starting resume upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        authToken: auth.token ? 'Present' : 'Missing'
      })
      
      const response = await uploadResume(file, auth.token)
      console.log('✅ Resume uploaded successfully:', response)
      console.log('🔗 Cloudinary URL generated:', response.resume.cloudinaryUrl)
      
      // Refresh resumes list
      await fetchResumes()
      
      // Show success message
      alert('Resume uploaded successfully!')
      
      // Show ATS role selection popup
      setAtsRolePopup({ show: true, resumeId: response.resume.id })
      
      // Refresh profile to update completion percentage
      await fetchProfile()
    } catch (err) {
      console.error('❌ Resume upload failed:', err)
      console.error('🔍 Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      
      // Show user-friendly error message
      let errorMessage = 'Upload failed'
      if (err instanceof Error) {
        if (err.message.includes('Cloudinary')) {
          errorMessage = 'Cloudinary upload failed. Please try again or contact support.'
        } else if (err.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check your account access.'
        } else {
          errorMessage = err.message
        }
      }
      
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleResumeDelete = async (resumeId: string) => {
    if (!auth?.token || !confirm('Are you sure you want to delete this resume?')) return
    
    try {
      setDeleting(resumeId)
      await deleteResume(auth.token, resumeId)
      console.log('✅ Resume deleted')
      
      // Refresh resumes list
      await fetchResumes()
    } catch (err) {
      console.error('❌ Resume deletion failed:', err)
      alert(err instanceof Error ? err.message : 'Deletion failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleViewResume = (resume: any) => {
    setResumeViewer({ show: true, resume })
  }



  const showAtsAnalysis = async (resumeId: string) => {
    if (!auth?.token) return
    
    try {
      const response = await getResumeAnalysis(auth.token, resumeId)
      setAtsPopup({
        show: true,
        data: response.resume.atsAnalysis,
        resumeId
      })
    } catch (err) {
      console.error('❌ Failed to fetch ATS analysis:', err)
      alert('Failed to load ATS analysis')
    }
  }

  const handleAtsAnalysis = async () => {
    if (!auth?.token) return
    
    const finalJobRole = selectedJobRole || customJobRole
    if (!finalJobRole.trim()) {
      alert('Please select or enter a job role')
      return
    }
    
    if (!atsRolePopup.resumeId) {
      alert('No resume selected for analysis')
      return
    }
    
    try {
      setIsAnalyzing(true)
      console.log('🔍 Starting ATS analysis for role:', finalJobRole)
      
      // Call the backend ATS analysis endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/resume/analyze-ats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          resumeId: atsRolePopup.resumeId,
          jobRole: finalJobRole
        })
      })
      
      if (!response.ok) {
        throw new Error(`ATS analysis failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ ATS analysis completed:', result)
      
      // Show ATS results popup
      setAtsPopup({
        show: true,
        data: result.atsAnalysis,
        resumeId: atsRolePopup.resumeId
      })
      
      // Close role selection popup
      setAtsRolePopup({ show: false, resumeId: null })
      setSelectedJobRole('')
      setCustomJobRole('')
      
      // Refresh resumes to show updated ATS analysis
      await fetchResumes()
      
    } catch (err) {
      console.error('❌ ATS analysis failed:', err)
      alert(`ATS analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleEdit = (section: string, field: string, currentValue: string) => {
    setEditing({ section, field })
    setEditValue(currentValue)
  }

  const handleSave = async () => {
    if (!editing || !auth?.token) return
    
    try {
      setSaving(true)
      
      if (editing.section === 'skills') {
        const skills = editValue.split(',').map(s => s.trim()).filter(Boolean)
        await updateStudentSkills(auth.token, skills)
        // Refresh profile
        await fetchProfile()
      } else if (editing.section === 'projects') {
        const projects = editValue.split(',').map(s => s.trim()).filter(Boolean)
        await updateStudentProjects(auth.token, projects)
        // Refresh profile
        await fetchProfile()
      } else {
        // For other fields, update the profile
        const updateData = { [editing.field]: editValue }
        await updateStudentProfile(auth.token, updateData)
        // Refresh profile
        await fetchProfile()
      }
      
      setEditing(null)
      setEditValue('')
    } catch (err) {
      console.error('❌ Failed to save:', err)
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Use backend-calculated profile completion instead of local calculation
  const getBackendProfileCompletion = () => {
    if (!profile) return 0
    return profile.status?.profileCompletion || 0
  }

  const getCompletionBreakdown = () => {
    if (!profile) return {}
    
    return {
      personal: profile.basicInfo?.name && profile.basicInfo?.phone && profile.basicInfo?.address ? 100 : 
                (profile.basicInfo?.name || profile.basicInfo?.phone || profile.basicInfo?.address ? 50 : 0),
      academic: profile.academicInfo?.branch && profile.academicInfo?.year ? 100 : 
                (profile.academicInfo?.branch || profile.academicInfo?.year ? 50 : 0),
      skills: profile.placementInfo?.skills?.length > 0 ? 100 : 0,
      resume: resumes.length > 0 ? 100 : 0,
      projects: profile.placementInfo?.projects?.length > 0 ? 100 : 0
    }
  }

  if (loading) {
    return (
      <Layout title="Profile" subtitle="Your complete student profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Profile" subtitle="Your complete student profile">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-red-500 mb-4">
            <p>Auth Token: {auth?.token ? 'Present' : 'Missing'}</p>
            <p>User Role: {auth?.user?.role || 'Unknown'}</p>
          </div>
          <button
            onClick={fetchProfile}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </Layout>
    )
  }

  if (!profile) {
    return (
      <Layout title="Profile" subtitle="Your complete student profile">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-yellow-500 text-4xl mb-4">❓</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Profile Data</h3>
          <p className="text-yellow-600">Profile information not available.</p>
          <div className="mt-4 text-sm text-yellow-700">
            <p>This might be because:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Profile data hasn't been set up yet</li>
              <li>Backend connection issues</li>
              <li>Authentication problems</li>
            </ul>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Profile" subtitle="Your complete student profile and progress tracking">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
                 {/* Debug Info */}
         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
           <h3 className="text-sm font-semibold text-blue-900 mb-2">Debug Information</h3>
           <div className="text-xs text-blue-700 space-y-1">
             <p>Auth Token: {auth?.token ? 'Present' : 'Missing'}</p>
             <p>User Role: {auth?.user?.role || 'Unknown'}</p>
             <p>Profile Data: {profile ? 'Loaded' : 'Not loaded'}</p>
             <p>Profile Completion: {profile.status?.profileCompletion || 0}%</p>
           </div>
                       <div className="mt-3 pt-3 border-t border-blue-200 space-y-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/resume/test-cloudinary`, {
                      headers: { Authorization: `Bearer ${auth?.token}` }
                    })
                    const data = await response.json()
                    console.log('🔧 Cloudinary Test Result:', data)
                    alert(`Cloudinary Test: ${data.success ? '✅ Success' : '❌ Failed'}\n${data.message}`)
                  } catch (err) {
                    console.error('❌ Cloudinary test failed:', err)
                    alert('Cloudinary test failed. Check console for details.')
                  }
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                Test Cloudinary
              </button>
              <button
                onClick={async () => {
                  if (!auth?.user?.id) {
                    alert('User ID not found. Please try logging in again.')
                    return
                  }
                  
                  try {
                    const { regenerateResumeUrls } = await import('../../global/api')
                    const response = await regenerateResumeUrls(auth.token, auth.user.id.toString())
                    console.log('🔧 Regenerate URLs Result:', response)
                    alert(`URL Regeneration: ${response.success ? '✅ Success' : '❌ Failed'}\n${response.message}\nFixed: ${response.fixedCount}/${response.totalCount}`)
                    
                    // Refresh resumes to show updated URLs
                    await fetchResumes()
                  } catch (err) {
                    console.error('❌ URL regeneration failed:', err)
                    alert(`URL regeneration failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
                  }
                }}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
              >
                Regenerate URLs
              </button>
            </div>
         </div>

        {/* Profile Header with Progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {profile.basicInfo?.name || 'Student Profile'}
                </h1>
                <p className="text-purple-100 text-lg">
                  {profile.basicInfo?.email || 'student@college.edu'}
                </p>
              </div>
              <div className="text-right">
                                 <div className="text-4xl font-bold mb-1">{getBackendProfileCompletion()}%</div>
                <div className="text-purple-100">Complete</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3 mb-4">
              <motion.div 
                className="bg-white h-3 rounded-full"
                initial={{ width: 0 }}
                                 animate={{ width: `${getBackendProfileCompletion()}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-green-300" />
                                 <span>Profile {getBackendProfileCompletion()}% Complete</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiTarget className="text-yellow-300" />
                <span>Target: 100%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200/60"
        >
          <div className="flex border-b border-gray-200/60 overflow-x-auto">
            {['overview', 'personal', 'academic', 'skills', 'projects', 'resume'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8"
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Overall Completion */}
              <div className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] rounded-2xl p-8 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Profile Completion</h2>
                                 <div className="text-6xl font-bold mb-2">{getBackendProfileCompletion()}%</div>
                <p className="text-xl opacity-90">
                                     {getBackendProfileCompletion() >= 80 ? 'Excellent! Your profile is well-completed.' :
                    getBackendProfileCompletion() >= 60 ? 'Good progress! Keep adding more details.' :
                    getBackendProfileCompletion() >= 40 ? 'Getting there! Complete more sections.' :
                    'Getting started! Add your information to improve your profile.'}
                </p>
              </div>
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <FiUser className="text-white text-xl" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {profile.basicInfo?.name ? 'Complete' : 'Incomplete'}
                      </div>
                      <div className="text-blue-600 text-sm">Personal Info</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <FiBookOpen className="text-white text-xl" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {profile.academicInfo?.branch ? 'Complete' : 'Incomplete'}
                      </div>
                      <div className="text-green-600 text-sm">Academic Info</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <FiAward className="text-white text-xl" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {profile.placementInfo?.skills?.length || 0}
                      </div>
                      <div className="text-purple-600 text-sm">Skills Added</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <FiBriefcase className="text-white text-xl" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-900">
                        {resumes.length}
                      </div>
                      <div className="text-orange-600 text-sm">Resumes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Breakdown */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Completion Breakdown</h3>
                <div className="space-y-4">
                  {Object.entries(getCompletionBreakdown()).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {value}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                <button 
                  onClick={() => handleEdit('personal', 'name', profile.basicInfo?.name || '')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:shadow-lg transform hover:scale-105 transition duration-200"
                >
                  <FiEdit3 className="mr-2 h-4 w-4" />
                  Edit Profile
                </button>
              </div>
              
              {editing?.section === 'personal' ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editing.field === 'name' ? editValue : profile.basicInfo?.name || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={editing.field === 'phone' ? editValue : profile.basicInfo?.phone || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={editing.field === 'address' ? editValue : profile.basicInfo?.address || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter your address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FiUser className="text-purple-500 text-xl" />
                        <div>
                          <div className="text-sm text-gray-500">Full Name</div>
                          <div className="font-medium text-gray-900">
                            {profile.basicInfo?.name || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('personal', 'name', profile.basicInfo?.name || '')}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FiMail className="text-purple-500 text-xl" />
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium text-gray-900">
                            {profile.basicInfo?.email || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-400 text-xs">Cannot edit</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FiPhone className="text-purple-500 text-xl" />
                        <div>
                          <div className="text-sm text-gray-500">Phone</div>
                          <div className="font-medium text-gray-900">
                            {profile.basicInfo?.phone || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('personal', 'phone', profile.basicInfo?.phone || '')}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FiMapPin className="text-purple-500 text-xl" />
                        <div>
                          <div className="text-sm text-gray-500">Address</div>
                          <div className="font-medium text-gray-900">
                            {profile.basicInfo?.address || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('personal', 'address', profile.basicInfo?.address || '')}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <FiCalendar className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm text-gray-500">Date of Birth</div>
                        <div className="font-medium text-gray-900">
                          {profile.basicInfo?.dateOfBirth || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <FiTarget className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm text-gray-500">Gender</div>
                        <div className="font-medium text-gray-900">
                          {profile.basicInfo?.gender || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Academic Info Tab */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Academic Information</h2>
                <button 
                  onClick={() => handleEdit('academic', 'gpa', profile.academicInfo?.gpa || '')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:shadow-lg transform hover:scale-105 transition duration-200"
                >
                  <FiEdit3 className="mr-2 h-4 w-4" />
                  Edit Academic Info
                </button>
              </div>
              
              {editing?.section === 'academic' ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={editing.field === 'gpa' ? editValue : profile.academicInfo?.gpa || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter your GPA (0-10)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <input
                        type="text"
                        value={editing.field === 'specialization' ? editValue : profile.academicInfo?.specialization || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter your specialization"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <FiBookOpen className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm text-gray-500">Roll Number</div>
                        <div className="font-medium text-gray-900">
                          {profile.academicInfo?.rollNumber || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <FiAward className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm text-gray-500">Branch</div>
                        <div className="font-medium text-gray-900">
                          {profile.academicInfo?.branch || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <FiTrendingUp className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm text-gray-500">Section</div>
                        <div className="font-medium text-gray-900">
                          {profile.academicInfo?.section || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                      <FiStar className="text-purple-500 text-xl" />
                      <div>
                        <div className="text-sm text-gray-500">Year</div>
                        <div className="font-medium text-gray-900">
                          {profile.academicInfo?.year || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FiAward className="text-purple-500 text-xl" />
                        <div>
                          <div className="text-sm text-gray-500">GPA</div>
                          <div className="font-medium text-gray-900">
                            {profile.academicInfo?.gpa || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('academic', 'gpa', profile.academicInfo?.gpa || '')}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <FiBookOpen className="text-purple-500 text-xl" />
                        <div>
                          <div className="text-sm text-gray-500">Specialization</div>
                          <div className="font-medium text-gray-900">
                            {profile.academicInfo?.specialization || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit('academic', 'specialization', profile.academicInfo?.specialization || '')}
                        className="text-purple-600 hover:text-purple-700 p-1 rounded"
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Skills & Technologies</h2>
                <button 
                  onClick={() => handleEdit('skills', 'skills', profile.placementInfo?.skills?.join(', ') || '')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:shadow-lg transform hover:scale-105 transition duration-200"
                >
                  <FiEdit3 className="mr-2 h-4 w-4" />
                  {profile.placementInfo?.skills?.length ? 'Edit Skills' : 'Add Skills'}
                </button>
              </div>
              
              {editing?.section === 'skills' ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {profile.placementInfo?.skills?.length ? 'Edit Skills' : 'Add Skills'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skills (comma-separated)
                      </label>
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., JavaScript, React, Node.js, MongoDB"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Separate multiple skills with commas
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Skills'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : profile.placementInfo?.skills && profile.placementInfo.skills.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Skills</h3>
                    <div className="flex flex-wrap gap-3">
                      {profile.placementInfo.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Skills Added Yet</h3>
                  <p className="text-gray-500 mb-6">Add your technical skills and technologies to improve your profile</p>
                  <button 
                    onClick={() => handleEdit('skills', 'skills', '')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    Add Skills
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Projects & Experience</h2>
                <button 
                  onClick={() => handleEdit('projects', 'projects', profile.placementInfo?.projects?.join(', ') || '')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:shadow-lg transform hover:scale-105 transition duration-200"
                >
                  <FiEdit3 className="mr-2 h-4 w-4" />
                  {profile.placementInfo?.projects?.length ? 'Edit Projects' : 'Add Projects'}
                </button>
              </div>
              
              {editing?.section === 'projects' ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {profile.placementInfo?.projects?.length ? 'Edit Projects' : 'Add Projects'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Projects (comma-separated)
                      </label>
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="e.g., E-commerce Website, Student Management System, Mobile App"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Separate multiple projects with commas
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Projects'}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : profile.placementInfo?.projects && profile.placementInfo.projects.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.placementInfo.projects.map((project, index) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-2 mb-2">
                            <FiBriefcase className="text-purple-500" />
                            <span className="font-medium text-gray-900">Project {index + 1}</span>
                          </div>
                          <p className="text-gray-700">{project}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🚀</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Added Yet</h3>
                  <p className="text-gray-500 mb-6">Add your projects and experience to showcase your work</p>
                  <button 
                    onClick={() => handleEdit('projects', 'projects', '')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    Add Projects
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resume Tab */}
          {activeTab === 'resume' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Resume & Documents</h2>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:shadow-lg transform hover:scale-105 transition duration-200">
                  <FiUpload className="mr-2 h-4 w-4" />
                  Upload New Resume
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-blue-700">Uploading resume...</p>
                </div>
              )}

              {resumes.length > 0 ? (
                <div className="space-y-4">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#f58529] to-[#dd2a7b] rounded-lg flex items-center justify-center">
                              <FiBookOpen className="text-white h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{resume.originalName}</h3>
                              <p className="text-sm text-gray-500">Uploaded: {new Date(resume.uploadDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">File:</span> {resume.filename}
                            </div>
                            <div>
                              <span className="font-medium">Size:</span> {resume.size ? `${(resume.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                resume.hasAtsAnalysis 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {resume.hasAtsAnalysis ? 'ATS Analyzed' : 'Pending Analysis'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {/* View Resume Button */}
                          <button
                            onClick={() => handleViewResume(resume)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            title="View Resume"
                          >
                            <FiEye className="mr-2 h-4 w-4" />
                            View
                          </button>
                          
                          {/* ATS Analysis Buttons */}
                          {resume.hasAtsAnalysis ? (
                            <>
                              <button
                                onClick={() => showAtsAnalysis(resume.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                title="View ATS Analysis"
                              >
                                <FiTarget className="mr-2 h-4 w-4" />
                                ATS Results
                              </button>
                              <button
                                onClick={() => setAtsRolePopup({ show: true, resumeId: resume.id })}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                                title="New ATS Analysis"
                              >
                                <FiTrendingUp className="mr-2 h-4 w-4" />
                                New Analysis
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setAtsRolePopup({ show: true, resumeId: resume.id })}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                              title="Analyze with ATS"
                            >
                              <FiTarget className="mr-2 h-4 w-4" />
                              Analyze ATS
                            </button>
                          )}
                          
                          {/* Download Button */}
                          <a
                            href={resume.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            title="Download Resume"
                          >
                            <FiDownload className="mr-2 h-4 w-4" />
                            Download
                          </a>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleResumeDelete(resume.id)}
                            disabled={deleting === resume.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                            title="Delete Resume"
                          >
                            {deleting === resume.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FiTrash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUpload className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resumes Uploaded</h3>
                  <p className="text-gray-500 mb-6">Upload your first resume to get started with ATS analysis and job applications</p>
                  <label className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:shadow-lg transform hover:scale-105 transition duration-200">
                    <FiUpload className="mr-2 h-5 w-5" />
                    Upload Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* ATS Role Selection Popup */}
      {atsRolePopup.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {atsRolePopup.file ? 'New Resume ATS Analysis' : 'Resume ATS Analysis'}
                  </h2>
                  <p className="text-white/80 mt-1">
                    {atsRolePopup.file 
                      ? 'Select job role for detailed resume analysis' 
                      : 'Select job role to re-analyze your resume'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setAtsRolePopup({ show: false, resumeId: null })}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Job Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Job Role
                  </label>
                  <select
                    value={selectedJobRole}
                    onChange={(e) => {
                      setSelectedJobRole(e.target.value)
                      if (e.target.value) setCustomJobRole('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choose from list...</option>
                    {jobRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Job Role Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Or Enter Custom Job Role
                  </label>
                  <input
                    type="text"
                    value={customJobRole}
                    onChange={(e) => {
                      setCustomJobRole(e.target.value)
                      if (e.target.value) setSelectedJobRole('')
                    }}
                    placeholder="e.g., AI Research Engineer, Cloud Architect"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter a specific role if not listed above
                  </p>
                </div>

                {/* Analysis Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm">ℹ️</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">What will be analyzed?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Keyword matching with job requirements</li>
                        <li>• Resume formatting and structure</li>
                        <li>• Skills alignment and gaps</li>
                        <li>• Overall ATS compatibility score</li>
                        <li>• Detailed improvement suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setAtsRolePopup({ show: false, resumeId: null })}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAtsAnalysis}
                    disabled={isAnalyzing || (!selectedJobRole && !customJobRole.trim())}
                    className="px-6 py-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      'Start Analysis'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ATS Analysis Popup */}
      {atsPopup.show && atsPopup.data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">ATS Analysis Results</h2>
                  <p className="text-white/80 mt-1">Detailed resume analysis and improvement suggestions</p>
                </div>
                <button
                  onClick={() => setAtsPopup({ show: false, data: null, resumeId: null })}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Job Role Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Analysis for: {atsPopup.data.jobRole || 'Selected Role'}</h3>
                    <p className="text-purple-700 text-sm">Resume scanned and analyzed for this specific position</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Score */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {atsPopup.data.score || atsPopup.data.overallScore || 'N/A'}%
                      </div>
                      <div className="text-green-700 font-medium">Overall ATS Score</div>
                      <div className="text-sm text-green-600 mt-2">
                        {(atsPopup.data.score || atsPopup.data.overallScore) >= 80 ? '🌟 Excellent' : 
                         (atsPopup.data.score || atsPopup.data.overallScore) >= 60 ? '👍 Good' : 
                         (atsPopup.data.score || atsPopup.data.overallScore) >= 40 ? '⚠️ Fair' : '❌ Needs Improvement'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    {/* Score Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FiTrendingUp className="text-blue-500 mr-2" />
                        Score Breakdown
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">ATS Compatibility</div>
                          <div className="font-medium text-gray-900">{atsPopup.data.score || 'N/A'}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Job Role Match</div>
                          <div className="font-medium text-gray-900">{atsPopup.data.jobRole ? '✅ Matched' : '❌ Not Specified'}</div>
                        </div>
                      </div>
                    </div>

                    {atsPopup.data.keywordMatch && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <FiCheckCircle className="text-green-500 mr-2" />
                          Keyword Matching
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Matched Keywords</div>
                            <div className="font-medium text-gray-900">{atsPopup.data.keywordMatch.matched || 0}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Total Keywords</div>
                            <div className="font-medium text-gray-900">{atsPopup.data.keywordMatch.total || 0}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {atsPopup.data.readability && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <FiBookOpen className="text-blue-500 mr-2" />
                          Readability
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Score</div>
                            <div className="font-medium text-gray-900">{atsPopup.data.readability.score || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Level</div>
                            <div className="font-medium text-gray-900">{atsPopup.data.readability.level || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills Analysis */}
              {atsPopup.data.improvements && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiAward className="text-purple-500 mr-2" />
                    Skills & Improvements Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {atsPopup.data.improvements.skills && atsPopup.data.improvements.skills.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-green-600">✅ Skills to Highlight</h4>
                        <div className="space-y-2">
                          {atsPopup.data.improvements.skills.map((skill: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsPopup.data.improvements.keywords && atsPopup.data.improvements.keywords.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-blue-600">🔑 Keywords to Add</h4>
                        <div className="space-y-2">
                          {atsPopup.data.improvements.keywords.map((keyword: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{keyword}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsPopup.data.improvements.formatting && atsPopup.data.improvements.formatting.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-orange-600">📝 Formatting Improvements</h4>
                        <div className="space-y-2">
                          {atsPopup.data.improvements.formatting.map((format: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{format}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {atsPopup.data.improvements.clarity && atsPopup.data.improvements.clarity.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-purple-600">💡 Clarity Enhancements</h4>
                        <div className="space-y-2">
                          {atsPopup.data.improvements.clarity.map((clarity: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{clarity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {atsPopup.data.suggestions && atsPopup.data.suggestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiTrendingUp className="text-green-500 mr-2" />
                    Improvement Suggestions
                  </h3>
                  <div className="space-y-3">
                    {atsPopup.data.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-sm">💡</span>
                        </div>
                        <p className="text-sm text-green-800">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mistakes to Avoid */}
              {atsPopup.data.mistakes && atsPopup.data.mistakes.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiAlertCircle className="text-red-500 mr-2" />
                    Common Mistakes to Avoid
                  </h3>
                  <div className="space-y-3">
                    {atsPopup.data.mistakes.map((mistake: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-sm">⚠️</span>
                        </div>
                        <p className="text-sm text-red-800">{mistake}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords Found */}
              {atsPopup.data.keywords && atsPopup.data.keywords.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiCheckCircle className="text-blue-500 mr-2" />
                    Keywords Found in Resume
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {atsPopup.data.keywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Assessment */}
              {atsPopup.data.overall && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiStar className="text-yellow-500 mr-2" />
                    Overall Assessment
                  </h3>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                    <p className="text-gray-800 leading-relaxed">{atsPopup.data.overall}</p>
                  </div>
                </div>
              )}

              {/* Detailed Analysis */}
              {atsPopup.data.detailedAnalysis && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Analysis</h3>
                  <div className="space-y-4">
                    {atsPopup.data.detailedAnalysis.map((section: any, index: number) => (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{section.name}</h4>
                        <div className="space-y-2">
                          {section.analysis && (
                            <div className="text-sm text-gray-600">{section.analysis}</div>
                          )}
                          {section.score && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Score:</span>
                              <span className="font-medium text-gray-900">{section.score}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Suggestions */}
              {atsPopup.data.suggestions && atsPopup.data.suggestions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiTrendingUp className="text-orange-500 mr-2" />
                    Improvement Suggestions
                  </h3>
                  <div className="space-y-3">
                    {atsPopup.data.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <FiTarget className="text-orange-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-orange-800">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setAtsPopup({ show: false, data: null, resumeId: null })}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement download report functionality
                    alert('Download feature coming soon!')
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  Download Report
                </button>
                             </div>
             </div>
           </motion.div>
         </div>
       )}

       {/* Resume Viewer Modal */}
       {resumeViewer.show && resumeViewer.resume && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden"
           >
             {/* Header */}
             <div className="bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-2xl font-bold">{resumeViewer.resume.originalName}</h2>
                   <p className="text-white/80 mt-1">Resume Viewer</p>
                 </div>
                 <button
                   onClick={() => setResumeViewer({ show: false, resume: null })}
                   className="text-white/80 hover:text-white transition-colors"
                 >
                   <FiX className="h-6 w-6" />
                 </button>
               </div>
             </div>

             {/* Content */}
             <div className="p-6 overflow-hidden">
               <div className="w-full h-[calc(95vh-200px)]">
                 <iframe
                   src={resumeViewer.resume.cloudinaryUrl}
                   className="w-full h-full border-0 rounded-lg"
                   title={resumeViewer.resume.originalName}
                 />
               </div>
             </div>

             {/* Footer */}
             <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
               <div className="text-sm text-gray-600">
                 <span className="font-medium">File:</span> {resumeViewer.resume.filename} | 
                 <span className="font-medium"> Uploaded:</span> {new Date(resumeViewer.resume.uploadDate).toLocaleDateString()}
               </div>
               <div className="flex space-x-3">
                 <a
                   href={resumeViewer.resume.cloudinaryUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                 >
                   <FiDownload className="mr-2 h-4 w-4" />
                   Download
                 </a>
                 <button
                   onClick={() => setResumeViewer({ show: false, resume: null })}
                   className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                 >
                   Close
                 </button>
               </div>
             </div>
           </motion.div>
         </div>
       )}
     </Layout>
   )
 }

export default ProfilePage

