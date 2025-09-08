import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  User, 
  FileText, 
  Briefcase, 
  Building2, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
  Upload,
  Search,
  MessageSquare,
  Bell,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Target
} from 'lucide-react'
import { getAuth } from '../../global/auth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: 'student' | 'placement_officer' | 'admin'
  collapsed: boolean
  onCollapseToggle: () => void
  studentStatus?: {
    hasResume: boolean
    isOnboarded: boolean
    completionPercentage: number
  } | null
  isLoadingStatus: boolean
}

const Sidebar = ({
  isOpen,
  onClose,
  userRole,
  collapsed,
  onCollapseToggle,
  studentStatus,
  isLoadingStatus
}: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = getAuth()

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (userRole === 'student') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/student',
          description: 'Overview and progress'
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          path: '/student/notifications',
          description: 'Messages & updates'
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          path: '/student/profile',
          description: 'Personal information'
        },
        {
          id: 'ats-results',
          label: 'ATS Analysis',
          icon: BarChart3,
          path: '/student/ats-results',
          description: 'Resume analysis'
        },
        {
          id: 'jobs',
          label: 'Job Portal',
          icon: Briefcase,
          path: '/jobs',
          description: 'Browse opportunities'
        },
        // Additional student links can be enabled when routes exist
      ]
    } else if (userRole === 'placement_officer') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/placement-officer',
          description: 'Overview and analytics'
        },
        {
          id: 'push-notifications',
          label: 'Push Notifications',
          icon: MessageSquare,
          path: '/placement-officer/notifications',
          description: 'Notify students'
        },
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          path: '/placement-officer/students',
          description: 'Student management'
        },
        {
          id: 'companies',
          label: 'Companies',
          icon: Building2,
          path: '/placement-officer/companies',
          description: 'Company management'
        },
        {
          id: 'jobs',
          label: 'Job Posts',
          icon: Briefcase,
          path: '/placement-officer/jobs',
          description: 'Job posting management'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          path: '/placement-officer/analytics',
          description: 'Reports and insights'
        },
        {
          id: 'biodata-upload',
          label: 'Biodata Upload',
          icon: Upload,
          path: '/placement-officer/biodata-upload',
          description: 'Bulk data upload'
        },
        {
          id: 'bulk-upload',
          label: 'Bulk Upload',
          icon: Upload,
          path: '/placement-officer/bulk-upload',
          description: 'Mass data import'
        },
        {
          id: 'create-officer',
          label: 'Create Officer',
          icon: User,
          path: '/placement-officer/create-officer',
          description: 'Add new officers'
        }
      ]
    } else {
      // Admin role
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/admin/dashboard',
          description: 'System overview'
        },
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          path: '/admin/users',
          description: 'User management'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/admin/settings',
          description: 'System settings'
        }
      ]
    }
  }

  const navigationItems = getNavigationItems()

  const handleNavigation = (path: string) => {
    navigate(path)
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const isActive = (path: string) => {
    // For hub routes, only mark active on exact match to avoid double-highlighting subpages
    const hubPaths = ['/student', '/placement-officer', '/admin']
    if (hubPaths.includes(path)) {
      return location.pathname === path
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : (window.innerWidth >= 1024 ? 0 : -320),
          width: collapsed ? 80 : 288
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl z-30 flex flex-col ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } w-72 lg:w-auto`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
        }}
      >
      
        
        {/* User Info */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 border-b border-gray-200/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {auth?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {auth?.user?.email}
                </p>
                {/* Student Status Indicator */}
                {userRole === 'student' && studentStatus && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <motion.div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${studentStatus.completionPercentage}%` }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {studentStatus.completionPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Profile Complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active
                      ? 'bg-primary-50 text-primary-700 border border-primary-100'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    active ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className={`text-xs ${
                        active ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  {active && !collapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-6 bg-primary-500 rounded-full"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-4 border-t border-gray-200/50"
          >
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
            >
              <HelpCircle className="w-5 h-5 text-gray-500" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">Help & Support</p>
                <p className="text-xs text-gray-500">Get assistance</p>
              </div>
            </button>
          </motion.div>
        )}
      </motion.aside>
    </>
  )
}

export default Sidebar
