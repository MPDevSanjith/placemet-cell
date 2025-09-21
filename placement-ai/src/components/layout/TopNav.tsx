import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Menu,
  ChevronDown,
  HelpCircle,
  Shield,
  Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAuth } from '../../global/auth'
import { getMyUnreadNotificationCount, listMyNotifications, listNotifications, getCollegeLogo } from '../../global/api'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import SearchResults from '../SearchResults'

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
  const { logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchPosition, setSearchPosition] = useState({ top: 0, left: 0, width: 0 })
  const auth = getAuth()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notificationsData, setNotificationsData] = useState<Array<{ id?: string; title: string; message: string; time?: string; unread?: boolean }>>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [collegeInfo, setCollegeInfo] = useState<{ name: string; logoUrl?: string } | null>(null)
  const [loadingCollege, setLoadingCollege] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Load college information with debouncing
  const loadCollegeInfo = useCallback(async () => {
    if (!auth?.token || userRole !== 'placement_officer' || loadingCollege) return
    
    try {
      setLoadingCollege(true)
      const response = await getCollegeLogo()
      if (response.success && response.collegeInfo) {
        setCollegeInfo({
          name: response.collegeInfo.name || 'Your College',
          logoUrl: response.collegeInfo.logoUrl
        })
      } else {
        // Set default college info if API call fails
        setCollegeInfo({ name: 'Your College' })
      }
    } catch (error) {
      console.error('Failed to load college info:', error)
      // Set default college info on error
      setCollegeInfo({ name: 'Your College' })
    } finally {
      setLoadingCollege(false)
    }
  }, [auth?.token, userRole, loadingCollege])

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      window.location.href = '/login'
    }
  }, [logout])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.length >= 2) {
      setShowSearchResults(true)
      updateSearchPosition()
    } else {
      setShowSearchResults(false)
    }
  }, [])

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowSearchResults(true)
      updateSearchPosition()
    }
  }, [searchQuery])

  const updateSearchPosition = useCallback(() => {
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect()
      
      // Simple positioning - always below the search bar
      const top = rect.bottom + 5
      const left = rect.left
      const width = rect.width
      
      setSearchPosition({
        top: top,
        left: left,
        width: width
      })
    }
  }, [])

  const handleSearchClose = useCallback(() => {
    setShowSearchResults(false)
  }, [])

  // Load college information on mount with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCollegeInfo()
    }, 100) // Small delay to prevent rapid calls
    
    return () => clearTimeout(timeoutId)
  }, [loadCollegeInfo])

  // Fetch unread count with optimized interval
  useEffect(() => {
    let cancelled = false
    const fetchCount = async () => {
      try {
        if (auth?.token) {
          const res = await getMyUnreadNotificationCount(auth.token)
          if (!cancelled) setUnreadCount(res.unread || 0)
        } else {
          if (!cancelled) setUnreadCount(0)
        }
      } catch {
        if (!cancelled) setUnreadCount(0)
      }
    }
    fetchCount()
    const id = setInterval(fetchCount, 120_000) // Increased from 60s to 120s for better performance
    return () => { cancelled = true; clearInterval(id) }
  }, [auth?.token])

  // Load real notifications when token/role changes and when menu opens (optimized)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!auth?.token || !showNotificationsMenu) { 
        setNotificationsData([]); 
        return 
      }
      try {
        setLoadingNotifications(true)
        if (userRole === 'student') {
          const res = await listMyNotifications(auth.token)
          if (cancelled) return
          const mapped = (res.items || []).map((n: any) => ({ 
            id: n._id, 
            title: n.title, 
            message: n.message, 
            time: new Date(n.createdAt).toLocaleString(), 
            unread: !n.read 
          }))
          setNotificationsData(mapped)
        } else {
          const res = await listNotifications(auth.token)
          if (cancelled) return
          const mapped = (res.items || []).slice(0, 20).map((n: any) => ({ 
            id: n._id, 
            title: n.title, 
            message: n.message, 
            time: new Date(n.createdAt).toLocaleString(), 
            unread: false 
          }))
          setNotificationsData(mapped)
        }
      } catch {
        if (!cancelled) setNotificationsData([])
      } finally {
        if (!cancelled) setLoadingNotifications(false)
      }
    }
    load()
  }, [auth?.token, userRole, showNotificationsMenu])

  // Update search position on window resize (optimized with debouncing)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (showSearchResults) {
          updateSearchPosition()
        }
      }, 100) // Debounce resize events
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [showSearchResults, updateSearchPosition])

  // Memoize expensive computations
  const memoizedNotifications = useMemo(() => notificationsData, [notificationsData])
  const memoizedCollegeInfo = useMemo(() => collegeInfo, [collegeInfo])

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
      {/* Left Section - College Logo & Name */}
      <div className="flex items-center gap-2 lg:gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </Button>
        <div className="flex items-center gap-3">
          {loadingCollege ? (
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              {memoizedCollegeInfo?.logoUrl ? (
                <img 
                  src={memoizedCollegeInfo.logoUrl} 
                  alt="College Logo" 
                  className="w-12 h-12 object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {memoizedCollegeInfo?.name?.charAt(0) || 'C'}
                  </span>
                </div>
              )}
              <div className="hidden sm:block">
                <span className="font-semibold text-lg text-gray-800 tracking-wide">
                  {memoizedCollegeInfo?.name || 'Your College'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center Section - Search Bar */}
      {showSearch && (
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={userRole === 'student' ? "Search jobs, companies..." : "Search students, jobs, companies..."}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              className="pl-10 w-full bg-gray-50/50 border-gray-200/50 focus:bg-white focus:border-blue-300 transition-all duration-200"
            />
            <SearchResults
              query={searchQuery}
              isOpen={showSearchResults}
              onClose={handleSearchClose}
              position={searchPosition}
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
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            className="md:hidden hover:bg-gray-100 transition-colors duration-200"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </Button>
        )}

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
                    {loadingNotifications && (
                      <div className="p-4 text-center text-gray-500 text-sm">Loading…</div>
                    )}
                    {!loadingNotifications && memoizedNotifications.length === 0 && (
                      <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                    )}
                    {!loadingNotifications && memoizedNotifications.length > 0 && memoizedNotifications.map((notification) => (
                      <div
                        key={notification.id || notification.title}
                        className={`p-4 border-b border-gray-100/50 hover:bg-gray-50/50 cursor-pointer transition-colors duration-200 ${notification.unread ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            {notification.time && (
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            )}
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to purple-600 rounded-full flex items-center justify-center">
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
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showProfileMenu || showNotificationsMenu || showSearchResults) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false)
            setShowNotificationsMenu(false)
            setShowSearchResults(false)
          }}
        />
      )}
    </header>
  )
}

export default TopNav
