import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Lock, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Database,
  Users
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { getOfficerProfile, updateOfficerProfile, changeOfficerPassword, getEligibilitySettings, updateEligibilitySettings, type OfficerProfile } from '../../global/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { useToast } from '../../hooks/use-toast'

const Settings = () => {
  const { auth } = useAuth()
  const { toast } = useToast()
  
  // Profile state
  const [profile, setProfile] = useState<OfficerProfile>({
    _id: '',
    name: '',
    email: '',
    role: 'placement_officer',
    status: 'active',
    createdAt: '',
    updatedAt: '',
    lastLogin: undefined
  })
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [eligibilityForm, setEligibilityForm] = useState({
    attendanceMin: 80,
    backlogMax: 0,
    cgpaMin: 6.0
  })
  
  // UI states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!auth?.token) return
      
      try {
        setIsLoading(true)
        console.log('🔍 Loading settings with token:', auth.token?.substring(0, 20) + '...')
        
        // Load profile and eligibility settings in parallel
        const [profileRes, eligibilityRes] = await Promise.all([
          getOfficerProfile(auth.token),
          getEligibilitySettings(auth.token)
        ])
        
        if (profileRes.success) {
          const user = profileRes.user
          setProfile(user)
          setProfileForm({
            name: user.name,
            email: user.email
          })
        }
        
        if (eligibilityRes.success) {
          const settings = eligibilityRes.settings
          setEligibilityForm({
            attendanceMin: settings.attendanceMin,
            backlogMax: settings.backlogMax,
            cgpaMin: settings.cgpaMin
          })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load settings data',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [auth?.token])

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth?.token) return
    
    try {
      setIsSaving(true)
      const response = await updateOfficerProfile(auth.token, profileForm)
      
      if (response.success) {
        setProfile(response.user)
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth?.token) return
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      })
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'New password must be at least 6 characters long',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setIsSaving(true)
      const response = await changeOfficerPassword(auth.token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      if (response.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        toast({
          title: 'Success',
          description: 'Password changed successfully',
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle eligibility settings update
  const handleEligibilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth?.token) return
    
    try {
      setIsSaving(true)
      const response = await updateEligibilitySettings(auth.token, {
        ...eligibilityForm,
        updatedBy: String(auth.user?.id ?? '') || undefined
      })
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Eligibility settings updated successfully',
          variant: 'default'
        })
      }
    } catch (error: any) {
      console.error('Eligibility update error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update eligibility settings',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'eligibility', label: 'Eligibility', icon: Shield },
    { id: 'system', label: 'System', icon: SettingsIcon }
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <Input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 capitalize">{profile.role?.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm text-gray-700 capitalize">{profile.status}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Last Login</label>
                        <span className="text-sm text-gray-700">
                          {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Password Requirements</h4>
                          <ul className="mt-2 text-sm text-blue-800 space-y-1">
                            <li>• At least 6 characters long</li>
                            <li>• Use a combination of letters, numbers, and symbols</li>
                            <li>• Avoid using personal information</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* Eligibility Tab */}
            {activeTab === 'eligibility' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Eligibility Criteria</h2>
                  </div>

                  <form onSubmit={handleEligibilityUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Attendance (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={eligibilityForm.attendanceMin}
                          onChange={(e) => setEligibilityForm(prev => ({ ...prev, attendanceMin: Number(e.target.value) }))}
                          placeholder="80"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Backlogs
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={eligibilityForm.backlogMax}
                          onChange={(e) => setEligibilityForm(prev => ({ ...prev, backlogMax: Number(e.target.value) }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum CGPA
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={eligibilityForm.cgpaMin}
                          onChange={(e) => setEligibilityForm(prev => ({ ...prev, cgpaMin: Number(e.target.value) }))}
                          placeholder="6.0"
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-amber-900">Important Note</h4>
                          <p className="mt-1 text-sm text-amber-800">
                            Changes to eligibility criteria will immediately affect student eligibility calculations across the system.
                            This will update the dashboard statistics and student filtering options.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        {isSaving ? 'Updating...' : 'Update Criteria'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <SettingsIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Database className="w-5 h-5 text-gray-600" />
                          <h3 className="font-medium text-gray-900">Account Details</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account ID:</span>
                            <span className="font-mono text-gray-900">{profile._id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="text-gray-900">{new Date(profile.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="text-gray-900">{new Date(profile.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Users className="w-5 h-5 text-gray-600" />
                          <h3 className="font-medium text-gray-900">Permissions</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">Student Management</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">Job Posting</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">Analytics & Reports</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">Eligibility Settings</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">System Status</h4>
                          <p className="mt-1 text-sm text-blue-800">
                            All systems are operational. Your account has full access to all placement officer features.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings
