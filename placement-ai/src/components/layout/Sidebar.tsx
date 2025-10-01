import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  User, 
  Briefcase, 
  Building2, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle,
  Upload,
  MessageSquare,
  Bell,
  FileText,
  Bot,
 
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
  onCollapseToggle: _onCollapseToggle,
  // studentStatus is currently not used within Sidebar; keep in type but don't destructure to avoid TS6133
  isLoadingStatus: _isLoadingStatus
}: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = getAuth()

  // Advanced mobile handling: dynamically position under the top bar
  const [headerHeight, setHeaderHeight] = useState<number>(56)
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : true)

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header') as HTMLElement | null
      const h = header?.getBoundingClientRect().height
      setHeaderHeight(Math.max(48, Math.min(96, Math.round(h || 56))))
      setIsMobile(window.innerWidth < 1024)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (!isMobile) return
    const original = document.body.style.overflow
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = original
    }
    return () => { document.body.style.overflow = original }
  }, [isOpen, isMobile])

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
          id: 'jobs',
          label: 'Job Portal',
          icon: Briefcase,
          path: '/jobs',
          description: 'Browse opportunities'
        },
        {
          id: 'my-jobs',
          label: 'My Jobs',
          icon: FileText,
          path: '/student/my-jobs',
          description: 'Applications you submitted'
        },
        // Additional student links can be enabled when routes exist
      ]
    } else if (userRole === 'placement_officer') {
      return [
        // Core functionality (highest priority)
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home,
          path: '/placement-officer',
          description: 'Overview and key metrics'
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
          path: '/placement-officer/new-job-post',
          description: 'Company management'
        },
        
        // Secondary functionality (medium priority)
        {
          id: 'ai-chatbot',
          label: 'AI Assistant',
          icon: Bot,
          path: '/placement-officer/ai-chatbot',
          description: 'AI-powered data analysis and reports'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          path: '/placement-officer/analytics',
          description: 'Reports and insights'
        },
        {
          id: 'push-notifications',
          label: 'Notifications',
          icon: MessageSquare,
          path: '/placement-officer/notifications',
          description: 'Student communications'
        },
        {
          id: 'bulk-upload',
          label: 'Bulk Upload',
          icon: Upload,
          path: '/placement-officer/bulk-upload',
          description: 'Mass data import'
        },
        {
          id: 'batch-management',
          label: 'Batch Management',
          icon: Users,
          path: '/placement-officer/batch-management',
          description: 'Manage students by batch and send welcome emails'
        },
        {
          id: 'biodata-upload',
          label: 'Biodata Upload',
          icon: Upload,
          path: '/placement-officer/biodata-upload',
          description: 'Student biodata upload'
        },
        
        // Administrative (lowest priority)
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/placement-officer/settings',
          description: 'Account and system settings'
        },
        {
          id: 'create-officer',
          label: 'Create Officer',
          icon: User,
          path: '/placement-officer/create-officer',
          description: 'Add new officers'
        }
        ,
        {
          id: 'create-coordinator',
          label: 'Create Coordinator',
          icon: Users,
          path: '/placement-officer/create-coordinator',
          description: 'Add department coordinators'
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
  // Reorder for placement officer priority (Batch-first workflow)
  const orderedItems = userRole === 'placement_officer'
    ? [...navigationItems].sort((a,b)=>{
        const order = [
          'dashboard',
          'batch-management',
          'bulk-upload',
          'biodata-upload',
          'students',
          'companies',
          'push-notifications',
          'analytics',
          'settings',
          'create-officer',
          'create-coordinator'
        ]
        return order.indexOf(a.id) - order.indexOf(b.id)
      })
    : navigationItems

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
            className="fixed left-0 right-0 bottom-0 top-14 bg-black/20 z-20 lg:hidden"
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
        className={`fixed left-0 lg:top-0 lg:h-full bg-white border-r border-gray-200 shadow-2xl z-30 flex flex-col ${
          collapsed ? 'lg:w-20' : 'lg:w-72'
        } w-72 lg:w-auto`}
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          top: isMobile ? `${headerHeight}px` : undefined,
          height: isMobile ? `calc(100vh - ${headerHeight}px)` : undefined
        }}
      >
        {/* Brand */}
        {!collapsed && (
          <div className="px-4 pt-4">
            <div className="font-brand text-xl text-gray-800 tracking-wide">beyondcampusX</div>
          </div>
        )}

        {/* User Info */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-white to-blue-50/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {auth?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {auth?.user?.email}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {orderedItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              // Add separators for placement officer navigation
              const shouldAddSeparator = userRole === 'placement_officer' && (
                (item.id === 'students' && index > 0) || // After Upload tools → before student lists
                (item.id === 'companies' && index > 0) || // After student lists → before company ops
                (item.id === 'settings' && index > 0) // Before admin group
              )
              
              return (
                <div key={item.id}>
                  {shouldAddSeparator && !collapsed && (
                    <div className="my-3 mx-2">
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    </div>
                  )}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + index * 0.04 }}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-primary-50/70 text-primary-800 border border-primary-100 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm hover:translate-x-0.5'
                    }`}
                  >
                    <div className={`${active ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'} w-9 h-9 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-600'}`} />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold tracking-wide">{item.label}</p>
                        <p className={`text-xs ${active ? 'text-primary-600/70' : 'text-gray-500'}`}>{item.description}</p>
                      </div>
                    )}
                    {active && !collapsed && (
                      <motion.div layoutId="activeIndicator" className="ml-auto w-1.5 h-6 bg-gradient-to-b from-primary-400 to-primary-600 rounded-full" />
                    )}
                  </motion.button>
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        {!collapsed && userRole !== 'student' && (
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
