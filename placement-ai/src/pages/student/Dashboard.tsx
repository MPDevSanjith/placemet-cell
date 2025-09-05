import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import ResumeCard from '../../components/ResumeCard'
import { getAuth } from '../../global/auth'
import { getStudentProfile, listResumes } from '../../global/api'
import { FiFileText, FiCheckCircle, FiClipboard, FiTarget } from 'react-icons/fi'
import { motion } from 'framer-motion'

interface ProfileCompletion {
  overall: number
  breakdown: {
    basicInfo: number
    academic: number
    resume: number
    skills: number
    applications: number
  }
  status: string
}

export default function StudentDashboard() {
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion>({
    overall: 75,
    breakdown: {
      basicInfo: 12,
      academic: 8,
      resume: 20,
      skills: 0,
      applications: 0
    },
    status: 'Good'
  })
  const [loading, setLoading] = useState(true)
  const auth = getAuth()
  
  // Mock resume data - in real app this would come from API
  const mockResume = {
    id: '1',
    filename: 'resume_2024.pdf',
    originalName: 'My Resume.pdf',
            cloudinaryUrl: null, // Set to null to show "File Not Available" state
    uploadDate: new Date().toISOString(),
    hasAtsAnalysis: true,
    atsScore: 85
  }

  // Log resume data for debugging Google Drive links
  console.log('🔗 Mock Resume Data:', mockResume)

  // Fetch profile completion data from backend
  useEffect(() => {
    const fetchProfileCompletion = async () => {
      try {
        setLoading(true)
        
        if (auth?.token) {
          const response = await getStudentProfile(auth.token)
          console.log('📊 Dashboard Profile Response:', response)
          console.log('🔗 Profile Data for Google Drive Debug:', {
            basicInfo: response.profile?.basicInfo,
            academicInfo: response.profile?.academicInfo,
            placementInfo: response.profile?.placementInfo,
            resume: response.profile?.resume
          })
          
          if (response.profile) {
            // Use backend-calculated profile completion
            const completion = getBackendProfileCompletion(response.profile)
            console.log('📊 Backend Profile Completion:', completion)
            
            // Also get breakdown from backend if available
            const breakdown = response.profile.status?.completionBreakdown || {
              basicInfo: response.profile.basicInfo?.name ? 100 : 0,
              academicInfo: response.profile.academicInfo?.branch ? 100 : 0,
              resume: response.profile.resume ? 100 : 0,
              skillsProjects: response.profile.placementInfo?.skills?.length > 0 ? 100 : 0,
              applicationsEligibility: response.profile.placementInfo?.projects?.length > 0 ? 100 : 0
            }
            
            setProfileCompletion({
              overall: completion,
              breakdown: {
                basicInfo: (breakdown as any).basicInfo || (breakdown as any).personal || 0,
                academic: (breakdown as any).academicInfo || (breakdown as any).academic || 0,
                resume: breakdown.resume || 0,
                skills: (breakdown as any).skillsProjects || (breakdown as any).skills || 0,
                applications: 0
              },
              status: completion >= 80 ? 'Excellent' : completion >= 60 ? 'Good' : completion >= 40 ? 'Fair' : 'Poor'
            })
          }

          // Also fetch resumes to check Google Drive links
          try {
            const resumeResponse = await listResumes(auth.token)
            console.log('📄 Dashboard Resumes Response:', resumeResponse)
            
            const cloudinaryUrls = resumeResponse.resumes?.map(r => ({
              id: r.id,
              filename: r.filename,
              originalName: r.originalName,
              cloudinaryUrl: r.cloudinaryUrl,
              uploadDate: r.uploadDate
            })) || [];
            
            console.log('🔗 Cloudinary URLs Found:', cloudinaryUrls);
            
            // Log each URL individually for better debugging
            cloudinaryUrls.forEach((resume, index) => {
              console.log(`📄 Resume ${index + 1}:`, {
                id: resume.id,
                filename: resume.filename,
                originalName: resume.originalName,
                cloudinaryUrl: resume.cloudinaryUrl
              });
            });
          } catch (resumeError) {
            console.error('❌ Failed to fetch resumes for Cloudinary debug:', resumeError)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch profile completion:', error)
        setLoading(false)
      }
    }

    if (auth?.token) {
      fetchProfileCompletion()
    }
  }, [auth?.token])

  // Use backend-calculated profile completion instead of local calculation
  const getBackendProfileCompletion = (profile: any) => {
    if (!profile) return 0
    return profile.status?.profileCompletion || 0
  }

  const handleResumeUpdate = () => {
    console.log('Resume updated')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent':
        return 'from-green-400 to-green-600'
      case 'good':
        return 'from-blue-400 to-blue-600'
      case 'fair':
        return 'from-yellow-400 to-orange-500'
      case 'poor':
        return 'from-red-400 to-red-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent':
        return '🌟'
      case 'good':
        return '👍'
      case 'fair':
        return '⚠️'
      case 'poor':
        return '❌'
      default:
        return '📊'
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.25 } })
  }

  return (
    <Layout
      title="Dashboard"
      subtitle={`Welcome back, ${auth?.user?.name || 'Student'}!`}
    >
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 rounded-3xl p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-purple-600/20 to-orange-600/20 rounded-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <motion.h2 
                  className="text-4xl font-bold mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome back, {auth?.user?.name || 'Student'}! 👋
                </motion.h2>
                <motion.p 
                  className="text-white/90 text-xl font-medium"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Ready to take your career to the next level?
                </motion.p>
                <motion.div 
                  className="mt-4 flex items-center space-x-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Active Session</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                    <span className="text-sm font-medium">Last login: Today</span>
                  </div>
                </motion.div>
              </div>
              <div className="hidden md:block">
                <motion.div 
                  className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <span className="text-5xl">🚀</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative"
        >
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Completion</h3>
                <p className="text-gray-600">Complete your profile to increase placement chances</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  {loading ? (
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  ) : (
                    <span className="text-4xl font-bold text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text">
                      {profileCompletion.overall}%
                    </span>
                  )}
                  <p className="text-sm text-gray-500">Complete</p>
                </div>
                <div className="flex items-center space-x-2">
                  {loading ? (
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  ) : (
                    <>
                      <span className="text-2xl">{getStatusEmoji(profileCompletion.status)}</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(profileCompletion.status)} text-white shadow-lg`}>
                        {profileCompletion.status}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Overall Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-800">Overall Progress</span>
                {loading ? (
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-lg font-bold text-gray-600">{profileCompletion.overall}%</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
                {loading ? (
                  <div className="h-6 bg-gray-300 rounded-full animate-pulse"></div>
                ) : (
                  <motion.div 
                    className="h-6 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${profileCompletion.overall}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                )}
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(profileCompletion.breakdown).map(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                const getBarColor = (percentage: number) => {
                  if (percentage >= 80) return 'from-green-400 to-green-600'
                  if (percentage >= 60) return 'from-blue-400 to-blue-600'
                  if (percentage >= 40) return 'from-yellow-400 to-orange-500'
                  if (percentage >= 20) return 'from-orange-400 to-red-500'
                  return 'from-red-400 to-red-600'
                }
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      {loading ? (
                        <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        <span className="text-sm text-gray-500">{value}%</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {loading ? (
                        <div className="h-2 bg-gray-300 rounded-full animate-pulse"></div>
                      ) : (
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getBarColor(value)} transition-all duration-700 ease-out`}
                          style={{ width: `${value}%` }}
                        ></div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-sm text-gray-600 mt-4 text-center">
              {loading ? (
                <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
              ) : (
                'Complete your profile to increase your chances of getting placed'
              )}
            </p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[{
            icon: <FiFileText className="text-white w-7 h-7" />, 
            label: 'Resume Status', 
            value: mockResume ? 'Active' : 'Not Uploaded', 
            gradient: 'from-pink-500 to-orange-500',
            bgGradient: 'from-pink-50 to-orange-50'
          }, {
            icon: <FiCheckCircle className="text-white w-7 h-7" />, 
            label: 'ATS Score', 
            value: `${mockResume?.atsScore || 0}/100`, 
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50'
          }, {
            icon: <FiClipboard className="text-white w-7 h-7" />, 
            label: 'Applications', 
            value: '3', 
            gradient: 'from-orange-500 to-red-500',
            bgGradient: 'from-orange-50 to-red-50'
          }, {
            icon: <FiTarget className="text-white w-7 h-7" />, 
            label: 'Interviews', 
            value: '1', 
            gradient: 'from-red-500 to-pink-500',
            bgGradient: 'from-red-50 to-pink-50'
          }].map((card, i) => (
            <motion.div
              key={card.label}
              variants={cardVariants}
              custom={i}
              className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 group cursor-pointer`}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${card.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Section */}
          <div className="lg:col-span-2">
            <ResumeCard 
              resume={mockResume}
              onResumeUpdate={handleResumeUpdate}
              token={auth?.token || ''}
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-[#F58529] to-[#515BD4] text-white py-3 px-4 rounded-lg hover:from-[#DD2A7B] hover:to-[#8134AF] transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiFileText />
                  <span>Upload Resume</span>
                </button>
                <button className="w-full bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] text-white py-3 px-4 rounded-lg hover:from-[#8134AF] hover:to-[#515BD4] transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiClipboard />
                  <span>Apply for Jobs</span>
                </button>
                <button className="w-full bg-gradient-to-r from-[#8134AF] to-[#515BD4] text-white py-3 px-4 rounded-lg hover:from-[#515BD4] hover:to-[#F58529] transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiTarget />
                  <span>Practice Tests</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#F58529] to-[#DD2A7B] rounded-full flex items-center justify-center">
                    <FiFileText className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Resume uploaded</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] rounded-full flex items-center justify-center">
                    <FiCheckCircle className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">ATS analysis completed</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#8134AF] to-[#515BD4] rounded-full flex items-center justify-center">
                    <FiClipboard className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Job application submitted</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}


