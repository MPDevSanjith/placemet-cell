import React from 'react'
import { StudentProfile } from '../../global/api'

interface ProfileDetailsProps {
  profile: StudentProfile
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profile }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatLastLogin = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Details</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
            <span className="text-blue-500">👤</span>
            <span>Basic Information</span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{profile.basicInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{profile.basicInfo.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium text-gray-900">{profile.basicInfo.phone || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gender:</span>
              <span className="font-medium text-gray-900">{profile.basicInfo.gender || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date of Birth:</span>
              <span className="font-medium text-gray-900">{formatDate(profile.basicInfo.dateOfBirth)}</span>
            </div>
            {profile.basicInfo.address && (
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-gray-900 text-right max-w-xs">{profile.basicInfo.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
            <span className="text-green-500">🎓</span>
            <span>Academic Information</span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Roll Number:</span>
              <span className="font-medium text-gray-900">{profile.academicInfo.rollNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Branch:</span>
              <span className="font-medium text-gray-900">{profile.academicInfo.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Section:</span>
              <span className="font-medium text-gray-900">{profile.academicInfo.section}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Year:</span>
              <span className="font-medium text-gray-900">{profile.academicInfo.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GPA/CGPA:</span>
              <span className="font-medium text-gray-900">{profile.academicInfo.gpa || 'Not specified'}</span>
            </div>
            {profile.academicInfo.specialization && (
              <div className="flex justify-between">
                <span className="text-gray-600">Specialization:</span>
                <span className="font-medium text-gray-900">{profile.academicInfo.specialization}</span>
              </div>
            )}
          </div>
        </div>

        {/* Placement Information */}
        <div className="space-y-4 lg:col-span-2">
          <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
            <span className="text-purple-500">💼</span>
            <span>Placement Information</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Job Role:</span>
                <span className="font-medium text-gray-900">{profile.placementInfo.jobRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Preferred Domain:</span>
                <span className="font-medium text-gray-900">{profile.placementInfo.preferredDomain}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Skills:</span>
                <span className="font-medium text-gray-900">
                  {profile.placementInfo.skills.length > 0 
                    ? profile.placementInfo.skills.join(', ') 
                    : 'Not specified'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Certifications:</span>
                <span className="font-medium text-gray-900">
                  {profile.placementInfo.certifications.length > 0 
                    ? profile.placementInfo.certifications.join(', ') 
                    : 'Not specified'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Projects */}
          {profile.placementInfo.projects.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-800 mb-2">Projects:</h5>
              <div className="space-y-2">
                {profile.placementInfo.projects.map((project, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-900">{project}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Information */}
        <div className="space-y-4 lg:col-span-2">
          <h4 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
            <span className="text-orange-500">📊</span>
            <span>Status & Statistics</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-500">📈</span>
                <span className="font-medium text-gray-800">Profile Status</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {profile.status.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-gray-600">
                {profile.status.onboardingCompleted ? 'Onboarding Complete' : 'Onboarding Pending'}
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-500">📝</span>
                <span className="font-medium text-gray-800">Applications</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {profile.statistics.applicationsCount}
              </div>
              <div className="text-sm text-gray-600">Total Applied</div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-purple-500">🔔</span>
                <span className="font-medium text-gray-800">Notifications</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {profile.statistics.unreadNotifications}
              </div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600">Last Login:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatLastLogin(profile.status.lastLogin)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Eligibility Tests:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {profile.statistics.eligibilityTestsTaken} taken
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileDetails
