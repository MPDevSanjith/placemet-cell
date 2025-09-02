import { useState } from 'react'
import { FaUsers, FaUpload, FaChartBar, FaEnvelope, FaCog, FaSignOutAlt } from 'react-icons/fa'
import Layout from '../../components/Layout'

export default function PlacementOfficerDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    { label: 'Total Students', value: '1,247', icon: FaUsers, color: 'text-blue-600' },
    { label: 'Active Drives', value: '8', icon: FaChartBar, color: 'text-green-600' },
    { label: 'Pending Applications', value: '156', icon: FaEnvelope, color: 'text-orange-600' },
    { label: 'Placement Rate', value: '94.2%', icon: FaChartBar, color: 'text-purple-600' },
  ]

  const recentActivities = [
    { action: 'Bulk upload completed', details: '150 students added', time: '2 hours ago', type: 'success' },
    { action: 'New drive published', details: 'Microsoft hiring for SDE', time: '4 hours ago', type: 'info' },
    { action: 'Application deadline', details: 'Google applications close tomorrow', time: '6 hours ago', type: 'warning' },
    { action: 'Student account created', details: 'john.doe@college.edu', time: '1 day ago', type: 'success' },
  ]

  return (
    <Layout
      title="Placement Officer Dashboard"
      subtitle="Welcome back, Officer!"
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: FaChartBar },
                { id: 'students', label: 'Students', icon: FaUsers },
                { id: 'bulk-upload', label: 'Bulk Upload', icon: FaUpload },
                { id: 'drives', label: 'Drives', icon: FaEnvelope },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="text-lg" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-gray-100 ${stat.color}`}>
                      <stat.icon className="text-2xl" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-brand-primary mb-4">Recent Activities</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-brand-primary mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-brand-secondary hover:bg-brand-muted transition-colors">
                  <FaUpload className="text-brand-secondary text-xl" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Bulk Upload Students</p>
                    <p className="text-sm text-gray-600">Add multiple students at once</p>
                  </div>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-brand-secondary hover:bg-brand-muted transition-colors">
                  <FaEnvelope className="text-brand-secondary text-xl" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Create New Drive</p>
                    <p className="text-sm text-gray-600">Publish a new placement drive</p>
                  </div>
                </button>
                <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-brand-secondary hover:bg-brand-muted transition-colors">
                  <FaChartBar className="text-brand-secondary text-xl" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-600">Analytics and insights</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bulk-upload' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Bulk Student Upload</h2>
            <p className="text-gray-600 mb-6">
              Upload a CSV file to create multiple student accounts at once. Students will receive their login credentials via email.
            </p>
            <button className="bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-secondary transition-colors">
              Go to Bulk Upload
            </button>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Student Management</h2>
            <p className="text-gray-600">Manage student accounts, view profiles, and track applications.</p>
          </div>
        )}

        {activeTab === 'drives' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-brand-primary mb-4">Placement Drives</h2>
            <p className="text-gray-600">Create and manage placement drives, track applications, and view results.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
