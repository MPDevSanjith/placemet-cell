import { 
  FiHome, 
  FiUser, 
  FiLogOut,
  FiGrid,
  FiUsers,
  FiUpload,
  FiPlus
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { auth, logout, userRole } = useAuth();

  // Dynamic navigation items based on user role
  const getNavigationItems = () => {
    if (userRole === 'placement_officer') {
      return [
        {
          name: "Dashboard",
          icon: FiHome,
          path: "/placement-officer",
          description: "Overview & Analytics",
          color: "from-blue-500 to-cyan-500",
          bgColor: "from-blue-50 to-cyan-50"
        },
        {
          name: "Bulk Upload",
          icon: FiUpload,
          path: "/placement-officer/bulk-upload",
          description: "Upload Student Data",
          color: "from-green-500 to-emerald-500",
          bgColor: "from-green-50 to-emerald-50"
        },
        {
          name: "Create Officer",
          icon: FiPlus,
          path: "/placement-officer/create-officer",
          description: "Add New Officers",
          color: "from-purple-500 to-pink-500",
          bgColor: "from-purple-50 to-pink-50"
        }
      ];
    } else {
      // Student navigation
      return [
        {
          name: "Dashboard",
          icon: FiHome,
          path: "/student/dashboard",
          description: "Overview & Analytics",
          color: "from-pink-500 to-purple-500",
          bgColor: "from-pink-50 to-purple-50"
        },
        {
          name: "Profile",
          icon: FiUser,
          path: "/student/profile",
          description: "Personal Information",
          color: "from-purple-500 to-pink-500",
          bgColor: "from-purple-50 to-pink-50"
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024 && onToggle) {
      onToggle();
    }
  };

  // Get title based on role
  const getTitle = () => {
    if (userRole === 'placement_officer') {
      return 'Officer Portal';
    }
    return 'Student Portal';
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Professional Sidebar - Matching Navbar Style */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          fixed inset-y-0 left-0 z-50 lg:relative
          flex flex-col bg-white/90 backdrop-blur-xl shadow-lg border-r border-gray-200/60
          transition-all duration-300 ease-in-out flex-shrink-0
          ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
          lg:translate-x-0 ${isOpen ? 'lg:w-72' : 'lg:w-20'}
        `}
      >
        {/* Professional Header - Matching Navbar */}
        <div className="relative p-6 border-b border-gray-200/60 bg-gradient-to-r from-white to-gray-50/30">
          <div className="flex items-center justify-between">
            {/* Professional Logo */}
            <motion.div 
              className="flex items-center space-x-4"
              layout
            >
              <motion.div 
                className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigation(userRole === 'placement_officer' ? '/placement-officer' : '/student')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiGrid className="text-white text-xl" />
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Title - Only visible when open */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-left"
                  >
                    <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 bg-clip-text text-transparent">
                      {getTitle()}
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Professional Toggle Button - Matching Navbar Style */}
            {onToggle && (
              <motion.button
                onClick={onToggle}
                className="relative w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 transition-all duration-300 flex items-center justify-center group shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className={`w-3 h-3 border-2 border-pink-500 rounded-sm transition-all duration-300 ${
                    isOpen ? 'rotate-45 border-t-0 border-l-0' : ''
                  }`}></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Professional Navigation - Matching Navbar Style */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {navigationItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.button
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  group relative flex items-center w-full rounded-2xl transition-all duration-300 text-left
                  ${isOpen ? 'px-4 py-4' : 'px-2 py-3 justify-center'}
                  ${isActive(item.path)
                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white shadow-lg shadow-pink-500/25'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:shadow-md'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active indicator */}
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Icon Container - Matching Navbar Style */}
                <div className={`
                  relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${isActive(item.path)
                    ? 'bg-white/20 text-white'
                    : `bg-gradient-to-r ${item.bgColor} text-gray-700 group-hover:shadow-lg`
                  }
                `}>
                  <item.icon className="text-lg" />
                </div>

                {/* Text Content - Only visible when open */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-4 flex-1"
                    >
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${isActive(item.path) ? 'text-white' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        <p className={`text-xs ${isActive(item.path) ? 'text-white/80' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Professional Tooltip for collapsed state */}
                {!isOpen && (
                  <div className={`absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none transition-opacity z-50
                    ${hoveredItem === item.name ? 'opacity-100' : 'opacity-0'}
                  `}>
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-gray-300">{item.description}</span>
                      </div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 transform rotate-45 -translate-x-1" />
                    </div>
                  </div>
                )}
              </motion.button>
            </motion.div>
          ))}
        </nav>

        {/* Professional Footer - Matching Navbar Style */}
        <div className="p-4 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white/50">
          <div className="space-y-3">
            {/* User Profile Section */}
            <div className={`flex items-center rounded-2xl bg-gradient-to-r from-gray-100/50 to-gray-200/50 hover:from-gray-200/50 hover:to-gray-300/50 transition-all duration-300 cursor-pointer group
              ${isOpen ? 'space-x-3 p-3' : 'p-2 justify-center'}`}
            >
              <div className="relative w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <FiUser className="text-white text-lg" />
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              
              {/* User info - Only visible when open */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {userRole === 'placement_officer' ? 'Officer' : 'Student'}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Active Session</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout Button - Matching Navbar Style */}
            <motion.button 
              onClick={handleLogout}
              className={`flex items-center rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all duration-300 text-white text-sm font-medium shadow-lg hover:shadow-xl
                ${isOpen ? 'w-full space-x-2 px-3 py-2' : 'w-10 h-10 justify-center mx-auto'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiLogOut className={`${isOpen ? 'w-4 h-4' : 'w-5 h-5'}`} />
              {isOpen && <span>Sign Out</span>}
            </motion.button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
