import React from 'react'

interface ProgressBarProps {
  percentage: number
  breakdown: {
    basicInfo: number
    academicInfo: number
    resume: number
    skillsProjects: number
    applicationsEligibility: number
  }
  showBreakdown?: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, breakdown, showBreakdown = true }) => {
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getStatusText = (percentage: number) => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Good'
    if (percentage >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="space-y-4">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Profile Completion</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClass(percentage).replace('bg-', 'text-')} ${getColorClass(percentage).replace('bg-', 'bg-')} bg-opacity-10`}>
              {getStatusText(percentage)}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${getColorClass(percentage)}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Basic Info</span>
              <span className="text-sm text-gray-500">{breakdown.basicInfo}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.basicInfo}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Academic</span>
              <span className="text-sm text-gray-500">{breakdown.academicInfo}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.academicInfo}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Resume</span>
              <span className="text-sm text-gray-500">{breakdown.resume}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.resume}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Skills</span>
              <span className="text-sm text-gray-500">{breakdown.skillsProjects}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.skillsProjects}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Applications</span>
              <span className="text-sm text-gray-500">{breakdown.applicationsEligibility}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${breakdown.applicationsEligibility}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressBar
