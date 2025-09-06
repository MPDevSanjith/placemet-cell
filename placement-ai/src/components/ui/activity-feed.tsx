import React from 'react'
import { motion } from 'framer-motion'
import { 
  FiFileText, 
  FiClipboard, 
  FiCalendar, 
  FiAward, 
  FiZap, 
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi'

interface ActivityItem {
  id: string
  type: 'resume' | 'application' | 'interview' | 'achievement' | 'skill' | 'notification'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'pending' | 'warning' | 'info' | 'error'
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  title?: string
  showTitle?: boolean
  maxItems?: number
  className?: string
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  title = "Recent Activity",
  showTitle = true,
  maxItems = 5,
  className = ""
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'resume': return <FiFileText className="w-4 h-4" />
      case 'application': return <FiClipboard className="w-4 h-4" />
      case 'interview': return <FiCalendar className="w-4 h-4" />
      case 'achievement': return <FiAward className="w-4 h-4" />
      case 'skill': return <FiZap className="w-4 h-4" />
      case 'notification': return <FiActivity className="w-4 h-4" />
      default: return <FiActivity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-500'
      case 'pending': return 'bg-yellow-500'
      case 'warning': return 'bg-orange-500'
      case 'info': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <FiCheckCircle className="w-3 h-3" />
      case 'pending': return <FiClock className="w-3 h-3" />
      case 'warning': return <FiAlertCircle className="w-3 h-3" />
      case 'info': return <FiInfo className="w-3 h-3" />
      case 'error': return <FiAlertCircle className="w-3 h-3" />
      default: return <FiActivity className="w-3 h-3" />
    }
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 ${className}`}>
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="space-y-4">
        {displayedActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
          >
            <div className="relative">
              <div className={`w-8 h-8 ${getStatusColor(activity.status)} rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className={`absolute -top-1 -right-1 w-4 h-4 ${getStatusColor(activity.status)} rounded-full flex items-center justify-center`}>
                {getStatusIcon(activity.status)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {activity.title}
              </p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                <FiClock className="w-3 h-3" />
                <span>{activity.timestamp}</span>
              </p>
            </div>
          </motion.div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <FiActivity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityFeed
