import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Menu,
  ChevronDown,
  MessageSquare,
  HelpCircle,
  Shield,
  Sun,
  Moon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAuth, logout } from '../../global/auth'
import { getMyUnreadNotificationCount } from '../../global/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'

interface TopNavProps {
  onMenuToggle: () => void
  showSearch?: boolean
  showNotifications?: boolean
  userRole: 'student' | 'placement_officer' | 'admin'
  studentStatus?: {
    hasResume: boolean
    isOnboarded: boolean
    completionPercentage: number
  } | null
}

const TopNav = ({ 
  onMenuToggle, 
  showSearch = true, 
  showNotifications = true,
  userRole,
  studentStatus
}: TopNavProps) => {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const auth = getAuth()
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Real notifications based on user status
  const getNotifications = () => {
    const notifications = []
    
    if (userRole === 'student' && studentStatus) {
      if (!studentStatus.hasResume) {
        notifications.push({
          id: 1,
          title: 'Resume Required',
          message: 'Upload your resume to complete your profile',
          time: 'Just now',
          unread: true,
          type: 'warning'
        })
      }
      
      if (studentStatus.completionPercentage < 80) {
        notifications.push({
          id: 2,
          title: 'Profile Incomplete',
          message: `Complete your profile (${studentStatus.completionPercentage}% done)`,
          time: '5 min ago',
          unread: true,
          type: 'info'
        })
      }
      
      if (studentStatus.hasResume && studentStatus.completionPercentage >= 80) {
        notifications.push({
          id: 3,
          title: 'Profile Complete',
          message: 'Your profile is ready for job applications',
          time: '1 hour ago',
          unread: false,
          type: 'success'
        })
      }
    } else {
      // Default notifications for placement officers
      notifications.push(
        {
          id: 1,
          title: 'New Student Registration',
          message: '5 new students have registered today',
          time: '2 min ago',
          unread: true,
          type: 'info'
        },
        {
          id: 2,
          title: 'Resume Uploads',
          message: '12 students uploaded resumes this week',
          time: '1 hour ago',
          unread: true,
          type: 'info'
        },
        {
          id: 3,
          title: 'Company Request',
          message: 'New job posting request from TechCorp',
          time: '3 hours ago',
          unread: false,
          type: 'info'
        }
      )
    }
    
    return notifications
  }

  const notifications = getNotifications()

  // Fetch unread count for students from server
  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        if (userRole === 'student' && auth?.token) {
          const res = await getMyUnreadNotificationCount(auth.token)
          if (!cancelled) setUnreadCount(res.unread || 0)
        } else {
          // fallback to local derived count for non-students
          if (!cancelled) setUnreadCount(notifications.filter(n => n.unread).length)
        }
      } catch {
        if (!cancelled) setUnreadCount(notifications.filter(n => n.unread).length)
      }
    }
    fetchCount()
    // Refresh occasionally
    const id = setInterval(fetchCount, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [userRole, auth?.token])

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2 lg:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </Button>
      </div>

      {/* Center Section - Search Bar */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-gray-50/50 border-gray-200/50 focus:bg-white focus:border-blue-300 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Search Button for Mobile */}
        {showSearch && (
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-gray-100 transition-colors duration-200"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </Button>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="hover:bg-gray-100 transition-colors duration-200"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-gray-600" /> : <Moon className="w-4 h-4 text-gray-600" />}
        </Button>

        {/* Notifications */}
        {showNotifications && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="relative hover:bg-gray-100 transition-colors duration-200"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  size="sm"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs bg-red-500"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            <AnimatePresence>
              {showNotificationsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50"
                >
                  <div className="p-4 border-b border-gray-200/50">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100/50 hover:bg-gray-50/50 cursor-pointer transition-colors duration-200 ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.unread 
                              ? notification.type === 'warning' 
                                ? 'bg-yellow-500' 
                                : notification.type === 'success'
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                              : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-gray-200/50">
                    <Button variant="ghost" size="sm" className="w-full hover:bg-gray-50/50">
                      View All Notifications
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {auth?.user?.name || auth?.user?.email}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </Button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50"
              >
                <div className="p-3 border-b border-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {auth?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {auth?.user?.email}
                      </p>
                      <Badge variant="outline" size="sm" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                        {userRole.replace('_', ' ')}
                      </Badge>
                      {/* Show completion status for students */}
                      {userRole === 'student' && studentStatus && (
                        <div className="mt-1">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-600">
                              {studentStatus.completionPercentage}% Complete
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowProfileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setShowProfileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/messages')
                      setShowProfileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                  </button>
                  
                  <button
                    onClick={() => {
                      navigate('/help')
                      setShowProfileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help
                  </button>
                  
                  {userRole === 'admin' && (
                    <button
                      onClick={() => {
                        navigate('/admin')
                        setShowProfileMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </button>
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-200/50">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showProfileMenu || showNotificationsMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false)
            setShowNotificationsMenu(false)
          }}
        />
      )}
    </header>
  )
}

export default TopNav
