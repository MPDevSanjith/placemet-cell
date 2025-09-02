import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { 
  FiBell, 
  FiChevronDown, 
  FiSearch, 
  FiMenu, 
  FiSettings, 
  FiLogOut, 
  FiUser, 
  FiX
} from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  onSidebarToggle: () => void;
  title?: string;
  subtitle?: string;
  showSidebarToggle?: boolean;
}

export default function Navbar({
  onSidebarToggle,
  title = "Dashboard",
  subtitle = "Welcome back!",
  showSidebarToggle = false,
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New job posting available', time: '2m ago', type: 'job', read: false },
    { id: 2, message: 'Resume analysis completed', time: '1h ago', type: 'resume', read: false },
    { id: 3, message: 'Interview scheduled for tomorrow', time: '3h ago', type: 'interview', read: true },
    { id: 4, message: 'Profile completion reminder', time: '5h ago', type: 'profile', read: true },
  ])
  const [notificationOpen, setNotificationOpen] = useState(false)
  const { auth, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log('Searching for:', searchQuery)
  }

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/60 sticky top-0 z-30 flex-shrink-0"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Enhanced Title Area */}
        <div className="flex items-center space-x-6">
          {/* Enhanced Sidebar Toggle */}
          {showSidebarToggle && (
            <motion.button
              onClick={onSidebarToggle}
              className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiMenu className="w-6 h-6 text-pink-600 group-hover:text-purple-600 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          )}
          
          {/* Title Section - Hidden for clean look */}
        </div>

        {/* Center Section - Enhanced Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-2 md:mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <motion.div
              className={`relative rounded-2xl transition-all duration-300 ${
                searchFocused 
                  ? 'bg-white shadow-xl ring-2 ring-pink-500/20' 
                  : 'bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <FiSearch className={`w-5 h-5 transition-colors ${
                  searchFocused ? 'text-pink-500' : 'text-gray-400'
                }`} />
              </div>
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 font-medium"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </motion.div>
          </form>
        </div>

        {/* Right Section - Clean Actions (No Time/Date) */}
        <div className="flex items-center space-x-2 md:space-x-4">

          {/* Enhanced Notifications */}
          <div className="relative">
            <motion.button 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-3 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBell className="w-5 h-5 text-pink-600" />
              {unreadCount > 0 && (
                <motion.span 
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full border-2 border-white text-white text-xs font-bold flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {notificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/60"
                >
                  <div className="px-4 py-3 border-b border-gray-200/60 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500">{unreadCount} unread</p>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`flex items-start space-x-3 px-4 py-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 cursor-pointer ${
                          !notification.read ? 'bg-pink-50/50' : ''
                        }`}
                        whileHover={{ x: 5 }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'job' ? 'bg-blue-500' :
                          notification.type === 'resume' ? 'bg-green-500' :
                          notification.type === 'interview' ? 'bg-purple-500' :
                          'bg-orange-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-pink-500 rounded-full mt-2" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200/60 pt-2">
                    <button className="w-full text-center text-sm text-pink-600 hover:text-pink-700 font-medium py-2">
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced User Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-3 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 transition-all duration-300 shadow-lg hover:shadow-xl group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Enhanced User Avatar */}
              <div className="relative w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {auth?.user?.name?.charAt(0) || 'U'}
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              {/* Enhanced User Info */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {auth?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {auth?.user?.email || 'user@college.edu'}
                </p>
              </div>

              <motion.div
                animate={{ rotate: userMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <FiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 border border-gray-200/60"
                >
                  {/* User Header */}
                  <div className="px-4 py-3 border-b border-gray-200/60 bg-gradient-to-r from-pink-50/50 to-purple-50/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-2xl flex items-center justify-center text-white font-bold">
                        {auth?.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {auth?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {auth?.user?.email || 'user@college.edu'}
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-green-600 font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    {auth?.user?.role === 'student' && (
                      <motion.a
                        href="/student/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all duration-200 group"
                        whileHover={{ x: 5 }}
                      >
                        <FiUser className="w-4 h-4 text-gray-500 group-hover:text-pink-500" />
                        <span className="font-medium">View Profile</span>
                      </motion.a>
                    )}
                    
                    <motion.a
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all duration-200 group"
                      whileHover={{ x: 5 }}
                    >
                      <FiSettings className="w-4 h-4 text-gray-500 group-hover:text-pink-500" />
                      <span className="font-medium">Settings</span>
                    </motion.a>
                  </div>
                  
                  {/* Logout Section */}
                  <div className="border-t border-gray-200/60 pt-2">
                    <motion.button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 group w-full"
                      whileHover={{ x: 5 }}
                    >
                      <FiLogOut className="w-4 h-4 text-red-500" />
                      <span className="font-medium">Sign Out</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
