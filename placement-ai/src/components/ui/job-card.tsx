import React from 'react'
import { motion } from 'framer-motion'
import { FiMapPin, FiClock, FiStar, FiArrowRight, FiBookmark } from 'react-icons/fi'

interface JobCardProps {
  id: string
  title: string
  company: string
  location: string
  salary: string
  match: number
  type: 'Full-time' | 'Internship' | 'Part-time' | 'Contract'
  deadline: string
  tags: string[]
  featured?: boolean
  saved?: boolean
  onApply?: () => void
  onSave?: () => void
  onView?: () => void
  className?: string
}

export const JobCard: React.FC<JobCardProps> = ({
  title,
  company,
  location,
  salary,
  match,
  type,
  deadline,
  tags,
  featured = false,
  saved = false,
  onApply,
  onSave,
  onView,
  className = ""
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-emerald-100 text-emerald-700'
      case 'Internship': return 'bg-blue-100 text-blue-700'
      case 'Part-time': return 'bg-purple-100 text-purple-700'
      case 'Contract': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getMatchColor = (match: number) => {
    if (match >= 90) return 'from-emerald-400 to-emerald-600'
    if (match >= 80) return 'from-blue-400 to-blue-600'
    if (match >= 70) return 'from-yellow-400 to-orange-500'
    if (match >= 60) return 'from-orange-400 to-red-500'
    return 'from-red-400 to-red-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className={`
        p-6 border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 
        group cursor-pointer bg-white hover:border-indigo-200
        ${featured ? 'ring-2 ring-indigo-100 bg-indigo-50/30' : ''}
        ${className}
      `}
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {title}
            </h4>
            {featured && (
              <div className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                <FiStar className="w-3 h-3" />
                <span>Featured</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-2 flex items-center space-x-1">
            <span>{company}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <FiMapPin className="w-3 h-3" />
              <span>{location}</span>
            </span>
          </p>
          
          <p className="text-indigo-600 font-medium mb-3 flex items-center space-x-1">
            <span>₹</span>
            <span>{String(salary).replace(/\$/g, '').replace(/^₹\s*/, '')} LPA</span>
          </p>
          
          <div className="flex items-center space-x-4 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(type)}`}>
              {type}
            </span>
            <span className="text-sm text-gray-500 flex items-center space-x-1">
              <FiClock className="w-3 h-3" />
              <span>Deadline: {deadline}</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-2 flex-wrap">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="text-right ml-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-500">Match</span>
            <span className="text-lg font-bold text-emerald-600">{match}%</span>
          </div>
          <div className="w-20 h-2 bg-gray-200 rounded-full">
            <div 
              className={`h-2 bg-gradient-to-r ${getMatchColor(match)} rounded-full transition-all duration-500`}
              style={{ width: `${match}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSave?.()
            }}
            className={`p-2 rounded-lg transition-colors ${
              saved 
                ? 'bg-indigo-100 text-indigo-600' 
                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <FiBookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView?.()
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center space-x-1"
          >
            <span>View Details</span>
            <FiArrowRight className="w-3 h-3" />
          </button>
          {onApply ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApply()
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Apply Now
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg cursor-default text-sm font-medium"
            >
              Already Applied
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default JobCard
