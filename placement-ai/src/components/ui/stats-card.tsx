import React from 'react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change?: {
    value: string
    type: 'increase' | 'decrease' | 'neutral'
  }
  color: string
  delay?: number
  className?: string
  onClick?: () => void
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  change,
  color,
  delay = 0,
  className = "",
  onClick
}) => {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'text-emerald-600'
      case 'decrease': return 'text-red-600'
      case 'neutral': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'increase': return <FiTrendingUp className="w-4 h-4" />
      case 'decrease': return <FiTrendingDown className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-6 shadow-lg border border-gray-100 
        hover:shadow-xl transition-all duration-300 group cursor-pointer
        ${onClick ? 'hover:border-gray-200' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center space-x-1 ${getChangeColor(change.type)}`}>
            {getChangeIcon(change.type)}
            <span className="text-sm font-medium">{change.value}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </motion.div>
  )
}

export default StatsCard
