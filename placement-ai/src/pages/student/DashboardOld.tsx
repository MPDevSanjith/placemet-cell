import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import ResumeCard from '../../components/ResumeCard'
import { getAuth } from '../../global/auth'
import { getStudentProfile, listResumes } from '../../global/api'
import { 
  FiFileText, 
  FiCheckCircle, 
  FiClipboard, 
  FiTarget, 
  FiTrendingUp,
  FiAward,
  FiCalendar,
  FiUsers,
  FiBookOpen,
  FiStar,
  FiZap,
  FiBarChart3,
  FiActivity,
  FiClock,
  FiArrowRight,
  FiDownload,
  FiEye,
  FiEdit3,
  FiSettings,
  FiBell,
  FiSearch,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'


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

interface DashboardStats {
  totalApplications: number
  interviewsScheduled: number
  offersReceived: number
  profileViews: number
  resumeDownloads: number
  skillsCompleted: number
  coursesCompleted: number
  achievements: number
}

interface RecentActivity {
  id: string
  type: 'resume' | 'application' | 'interview' | 'achievement' | 'skill'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'pending' | 'warning' | 'info'
}

interface JobRecommendation {
  id: string
  title: string
  company: string
  location: string
  salary: string
  match: number
  type: 'Full-time' | 'Internship' | 'Part-time'
  deadline: string
  tags: string[]
}

export default function StudentDashboard() {
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion>({
    overall: 0,
    breakdown: {
      basicInfo: 0,
      academic: 0,
      resume: 0,
      skills: 0,
      applications: 0
    },
    status: 'Poor'
  })
  
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    profileViews: 0,
    resumeDownloads: 0,
    skillsCompleted: 0,
    coursesCompleted: 0,
    achievements: 0
  })
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const auth = getAuth()

  // Mock data for demonstration
  const mockStats: DashboardStats = {
    totalApplications: 12,
    interviewsScheduled: 3,
    offersReceived: 1,
    profileViews: 45,
    resumeDownloads: 8,
    skillsCompleted: 7,
    coursesCompleted: 3,
    achievements: 5
  }

  const mockActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'resume',
      title: 'Resume Updated',
      description: 'Your resume has been updated with new skills',
      timestamp: '2 hours ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'application',
      title: 'Application Submitted',
      description: 'Applied for Software Engineer at TechCorp',
      timestamp: '1 day ago',
      status: 'pending'
    },
    {
      id: '3',
      type: 'interview',
      title: 'Interview Scheduled',
      description: 'Interview with Google scheduled for next week',
      timestamp: '2 days ago',
      status: 'info'
    },
    {
      id: '4',
      type: 'achievement',
      title: 'New Achievement',
      description: 'Completed React.js certification',
      timestamp: '3 days ago',
      status: 'success'
    }
  ]

  const mockJobRecommendations: JobRecommendation[] = [
    {
      id: '1',
      title: 'Frontend Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      salary: '$80k - $120k',
      match: 95,
      type: 'Full-time',
      deadline: '2024-02-15',
      tags: ['React', 'JavaScript', 'CSS']
    },
    {
      id: '2',
      title: 'Software Engineer Intern',
      company: 'Google',
      location: 'Mountain View, CA',
      salary: '$6k - $8k/month',
      match: 88,
      type: 'Internship',
      deadline: '2024-02-20',
      tags: ['Python', 'Machine Learning', 'AI']
    },
    {
      id: '3',
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      location: 'Remote',
      salary: '$70k - $100k',
      match: 82,
      type: 'Full-time',
      deadline: '2024-02-25',
      tags: ['Node.js', 'MongoDB', 'AWS']
    }
  ]

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        if (auth?.token) {
          const response = await getStudentProfile(auth.token)
          
          if (response.profile) {
            const completion = response.profile.status?.profileCompletion || 0
            const breakdown = response.profile.status?.completionBreakdown || {
              basicInfo: 0,
              academicInfo: 0,
              resume: 0,
              skillsProjects: 0,
              applicationsEligibility: 0
            }
            
            setProfileCompletion({
              overall: completion,
              breakdown: {
                basicInfo: breakdown.basicInfo || 0,
                academic: breakdown.academicInfo || 0,
                resume: breakdown.resume || 0,
                skills: breakdown.skillsProjects || 0,
                applications: breakdown.applicationsEligibility || 0
              },
              status: completion >= 80 ? 'Excellent' : completion >= 60 ? 'Good' : completion >= 40 ? 'Fair' : 'Poor'
            })
          }
        }
        
        // Set mock data for demonstration
        setStats(mockStats)
        setRecentActivity(mockActivity)
        setJobRecommendations(mockJobRecommendations)
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setLoading(false)
      }
    }

    if (auth?.token) {
      fetchDashboardData()
    }
  }, [auth?.token])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'from-emerald-400 to-emerald-600'
      case 'good': return 'from-blue-400 to-blue-600'
      case 'fair': return 'from-yellow-400 to-orange-500'
      case 'poor': return 'from-red-400 to-red-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return '🌟'
      case 'good': return '👍'
      case 'fair': return '⚠️'
      case 'poor': return '❌'
      default: return '📊'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'resume': return <FiFileText className="w-4 h-4" />
      case 'application': return <FiClipboard className="w-4 h-4" />
      case 'interview': return <FiCalendar className="w-4 h-4" />
      case 'achievement': return <FiAward className="w-4 h-4" />
      case 'skill': return <FiZap className="w-4 h-4" />
      default: return <FiActivity className="w-4 h-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-500'
      case 'pending': return 'bg-yellow-500'
      case 'warning': return 'bg-orange-500'
      case 'info': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "from-blue-500 to-purple-600" }: {
    percentage: number
    size?: number
    strokeWidth?: number
    color?: string
  }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
        </div>
      </div>
    )
  }

  const StatCard = ({ icon, label, value, change, color, delay = 0 }: {
    icon: React.ReactNode
    label: string
    value: string | number
    change?: string
    color: string
    delay?: number
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {change && (
          <div className="flex items-center space-x-1 text-emerald-600">
            <FiTrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </motion.div>
  )

  return (
    <Layout
      title="Dashboard"
      subtitle={`Welcome back, ${auth?.user?.name || 'Student'}!`}
    >
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your progress and stay updated</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold mb-3">
                  Welcome back, {auth?.user?.name || 'Student'}! 👋
                </h2>
                <p className="text-white/90 text-xl font-medium mb-4">
                  Ready to accelerate your career journey?
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Active Session</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm">
                    <FiClock className="w-4 h-4" />
                    <span className="text-sm font-medium">Last login: Today</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-5xl">🚀</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            icon={<FiClipboard className="w-6 h-6" />}
            label="Applications"
            value={stats.totalApplications}
            change="+2 this week"
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            delay={0.1}
          />
          <StatCard
            icon={<FiCalendar className="w-6 h-6" />}
            label="Interviews"
            value={stats.interviewsScheduled}
            change="+1 today"
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            delay={0.2}
          />
          <StatCard
            icon={<FiAward className="w-6 h-6" />}
            label="Offers"
            value={stats.offersReceived}
            change="New offer!"
            color="bg-gradient-to-r from-emerald-500 to-emerald-600"
            delay={0.3}
          />
          <StatCard
            icon={<FiTrendingUp className="w-6 h-6" />}
            label="Profile Views"
            value={stats.profileViews}
            change="+12% this week"
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            delay={0.4}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Completion - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Completion Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile Completion</h3>
                  <p className="text-gray-600">Complete your profile to increase placement chances</p>
                </div>
                <div className="flex items-center space-x-4">
                  <CircularProgress percentage={profileCompletion.overall} />
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{getStatusEmoji(profileCompletion.status)}</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getStatusColor(profileCompletion.status)} text-white shadow-lg`}>
                        {profileCompletion.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Progress */}
              <div className="space-y-4">
                {Object.entries(profileCompletion.breakdown).map(([key, value]) => {
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                  const getBarColor = (percentage: number) => {
                    if (percentage >= 80) return 'from-emerald-400 to-emerald-600'
                    if (percentage >= 60) return 'from-blue-400 to-blue-600'
                    if (percentage >= 40) return 'from-yellow-400 to-orange-500'
                    if (percentage >= 20) return 'from-orange-400 to-red-500'
                    return 'from-red-400 to-red-600'
                  }
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <span className="text-sm text-gray-500">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          className={`h-3 rounded-full bg-gradient-to-r ${getBarColor(value)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Job Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Recommended Jobs</h3>
                <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium">
                  <span>View All</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {jobRecommendations.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-gray-600 mb-2">{job.company} • {job.location}</p>
                        <p className="text-indigo-600 font-medium mb-3">{job.salary}</p>
                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {job.type}
                          </span>
                          <span className="text-sm text-gray-500">Deadline: {job.deadline}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          {job.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500">Match</span>
                          <span className="text-lg font-bold text-emerald-600">{job.match}%</span>
                        </div>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                            style={{ width: `${job.match}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiFileText />
                  <span>Upload Resume</span>
                </button>
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiClipboard />
                  <span>Apply for Jobs</span>
                </button>
                <button className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-3 px-4 rounded-xl hover:from-pink-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiTarget />
                  <span>Practice Tests</span>
                </button>
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                  <FiBookOpen />
                  <span>Learn Skills</span>
                </button>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`w-8 h-8 ${getActivityColor(activity.status)} rounded-full flex items-center justify-center text-white`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Skills Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Progress</h3>
              <div className="space-y-4">
                {[
                  { name: 'JavaScript', progress: 85 },
                  { name: 'React', progress: 78 },
                  { name: 'Node.js', progress: 65 },
                  { name: 'Python', progress: 72 },
                  { name: 'SQL', progress: 58 }
                ].map((skill, index) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                      <span className="text-sm text-gray-500">{skill.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="h-2 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.progress}%` }}
                        transition={{ duration: 1, delay: 0.9 + index * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}