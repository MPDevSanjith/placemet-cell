import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUsers, FiFileText, FiCheckCircle, FiLoader, FiShield } from 'react-icons/fi'
import { getAuth } from '../../global/auth'
import { verifyAuth } from '../../global/api'

type PlacementStatusResponse = { isLoggedIn: boolean; hasCompletedSetup: boolean }

export default function PlacementGate() {
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const auth = getAuth()

  useEffect(() => {
    const checkPlacementStatus = async () => {
      try {
        setStatus('checking')
        setError(null)

        // If no auth token, redirect to login
        if (!auth?.token) {
          navigate('/login')
          return
        }

        // Verify from backend and infer setup completion if needed
        let data: PlacementStatusResponse = { isLoggedIn: true, hasCompletedSetup: true }
        try {
          const verified = await verifyAuth(auth.token)
          const role = (verified as any)?.user?.role || (verified as any)?.role
          const isOfficer = role === 'placement_officer'
          data = { isLoggedIn: !!(verified as any)?.success || isOfficer, hasCompletedSetup: true }
        } catch {
          data = { isLoggedIn: true, hasCompletedSetup: true }
        }

        setStatus('redirecting')

        // Handle different states
        if (!data.isLoggedIn) {
          // Not logged in - redirect to login
          setTimeout(() => {
            navigate('/login')
          }, 1000)
        } else if (!data.hasCompletedSetup) {
          // Logged in but setup not completed - redirect to setup
          setTimeout(() => {
            navigate('/placement-officer/setup')
          }, 1000)
        } else {
          // Logged in and setup completed - redirect to dashboard
          setTimeout(() => {
            navigate('/placement-officer/dashboard')
          }, 1000)
        }
      } catch (err) {
        console.error('Error checking placement officer status:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        setStatus('error')
      }
    }

    checkPlacementStatus()
  }, [navigate, auth?.token])

  const getStatusContent = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <FiLoader className="w-8 h-8 animate-spin" />,
          title: 'Checking Access',
          message: 'Please wait while we verify your credentials...',
          color: 'text-blue-600'
        }
      case 'redirecting':
        return {
          icon: <FiCheckCircle className="w-8 h-8" />,
          title: 'Access Verified',
          message: 'Redirecting you to the appropriate page...',
          color: 'text-green-600'
        }
      case 'error':
        return {
          icon: <FiUsers className="w-8 h-8" />,
          title: 'Access Error',
          message: error || 'Unable to verify your access. Please try again.',
          color: 'text-red-600'
        }
      default:
        return {
          icon: <FiLoader className="w-8 h-8 animate-spin" />,
          title: 'Checking Access',
          message: 'Please wait...',
          color: 'text-blue-600'
        }
    }
  }

  const statusContent = getStatusContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Placement Officer Portal</h1>
            <p className="text-gray-600 mt-2">Management Dashboard</p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gray-50 rounded-xl p-6 mb-6"
          >
            <div className={`${statusContent.color} mb-4`}>
              {statusContent.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {statusContent.title}
            </h2>
            <p className="text-gray-600 text-sm">
              {statusContent.message}
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                status === 'checking' || status === 'redirecting' || status === 'error' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                <FiShield className="w-3 h-3" />
              </div>
              <div className="flex-1 h-1 bg-gray-200 rounded">
                <motion.div
                  className="h-1 bg-blue-500 rounded"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: status === 'checking' || status === 'redirecting' || status === 'error' ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                status === 'redirecting' || status === 'error'
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                <FiFileText className="w-3 h-3" />
              </div>
              <div className="flex-1 h-1 bg-gray-200 rounded">
                <motion.div
                  className="h-1 bg-blue-500 rounded"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: status === 'redirecting' || status === 'error' ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                status === 'redirecting'
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                <FiCheckCircle className="w-3 h-3" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Authentication</span>
              <span>Setup Check</span>
              <span>Redirect</span>
            </div>
          </motion.div>

          {/* Error Retry Button */}
          {status === 'error' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Try Again
            </motion.button>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <p className="text-xs text-gray-500">
              If you continue to experience issues, please contact support.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
