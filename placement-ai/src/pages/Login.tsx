import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { login, requestPasswordReset, type LoginPayload, type LoginResponse } from '../global/api'
import { saveAuth } from '../global/auth'

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-brand-soft rounded-xl p-5 flex flex-col items-center shadow-lavender transform hover:scale-105 transition duration-500">
      <p className="text-2xl font-bold text-brand-primary">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<string | null>(null)
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }
    if (hasNavigated) return // Prevent multiple submissions
    if (submitting) return // Prevent multiple submissions
    
    try {
      setSubmitting(true)
      const payload: LoginPayload = { email, password }
      console.log('🔐 Attempting login with:', { email: payload.email })
      
      const res = await login(payload) as LoginResponse
      console.log('🔐 Login response received:', res)
      console.log('🔐 Response type:', typeof res)
      console.log('🔐 Response keys:', Object.keys(res || {}))
      console.log('🔐 requiresOtp value:', res?.requiresOtp)
      console.log('🔐 otpRequired value:', res?.otpRequired)
      console.log('🔐 message value:', res?.message)
      
      // Check for OTP requirement in multiple possible fields
      const requiresOtp = res?.requiresOtp === true || res?.otpRequired === true || res?.message?.toLowerCase().includes('otp')
      console.log('🔐 Final requiresOtp decision:', requiresOtp)
      
      if (requiresOtp) {
        // Student login requires OTP - redirect to OTP page
        console.log('📱 Student login requires OTP, redirecting to /otp')
        console.log('📧 Email for OTP:', res.email || email)
        
        const otpState = { 
          email: res.email || email, 
          name: (res.email || email).split('@')[0] // Use email prefix as name for now
        }
        console.log('📱 OTP page state:', otpState)
        
        // Persist pending OTP info to survive reloads/navigation
        try {
          localStorage.setItem('pending_otp_email', otpState.email)
          localStorage.setItem('pending_otp_name', otpState.name)
        } catch {}

        // Set navigation flag to prevent multiple navigations
        setHasNavigated(true)
        
        // Force navigation to OTP page
        try {
          navigate('/otp', { 
            state: otpState, 
            replace: true 
          })
          console.log('✅ Navigation to OTP page initiated')
        } catch (navError) {
          console.error('❌ Navigation error:', navError)
          // Fallback: force redirect
          window.location.href = `/otp?email=${encodeURIComponent(otpState.email)}&name=${encodeURIComponent(otpState.name)}`
        }
      } else if (res?.user?.role) {
        // Direct login successful (placement officer or student). On iOS/mac Safari, use cookie session.
        console.log('✅ Direct login successful, role:', res.user.role)
        const role: 'placement_officer' | 'student' = res.user.role === 'placement_officer' ? 'placement_officer' : 'student'
        const tokenToStore = res.token || 'cookie-session'
        saveAuth({ token: tokenToStore, user: { id: res.user.id, email: res.user.email, name: res.user.name, role } })
        
        // Set navigation flag to prevent multiple navigations
        setHasNavigated(true)
        
        // Force navigation with a small delay to ensure auth state is properly set
        setTimeout(() => {
          window.location.href = role === 'placement_officer' ? '/placement-officer' : '/student'
        }, 100)
      } else {
        console.error('❌ Unexpected login response format:', res)
        console.error('❌ Response structure:', JSON.stringify(res, null, 2))
        setError(`Login failed - unexpected response format. Response: ${JSON.stringify(res)}`)
      }
    } catch (err: unknown) {
      console.error('❌ Login error:', err)
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgot = async () => {
    setForgotStatus(null)
    if (!forgotEmail) {
      setForgotStatus('Enter your email')
      return
    }
    try {
      setForgotSubmitting(true)
      await requestPasswordReset(forgotEmail)
      setForgotStatus('If that email exists, a reset link has been sent.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send reset link'
      setForgotStatus(message)
    } finally {
      setForgotSubmitting(false)
    }
  }

  const openForgotPassword = () => {
    setForgotOpen(true);
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="max-w-5xl w-full grid md:grid-cols-2 shadow-2xl rounded-3xl overflow-hidden bg-white border border-gray-100">
        
        {/* Left Achievement Panel */}
        <div className="hidden md:flex flex-col justify-center items-center bg-white text-brand-primary p-12 gap-6 border-r border-gray-100">
          <h1 className="text-4xl font-extrabold text-center bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] bg-clip-text text-transparent">Achieve Your Goals</h1>
          <p className="text-center text-gray-700 text-lg">Track placements, manage applications, and grow with purpose.</p>
          <div className="grid grid-cols-2 gap-6 w-full mt-4">
            <StatCard value="95%" label="Placement Rate" />
            <StatCard value="120+" label="Recruiters" />
            <StatCard value="₹18 LPA" label="Top Package" />
            <StatCard value="250+" label="Students Placed" />
          </div>
        </div>

        {/* Right Login Form */}
        <div className="glass-card bg-white border border-[#E6E6FA] shadow-lavender transform hover:scale-[1.01] transition duration-300">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-[#F3F4F6] text-[#5E286D] mb-3">✨ Welcome back</div>
          <h2 className="text-3xl font-extrabold mb-1 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] bg-clip-text text-transparent">Sign in</h2>
          <p className="text-brand-subtext mb-6">Positive mindset. Clear goals. Let’s get you in.</p>
          <hr className="border-[#E6E6FA] mb-6" />

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}



          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="email" className="block text-sm font-medium text-[#5E286D]">Email</label>
              </div>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full rounded-lg border border-[#E6E6FA] bg-white pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5E286D] focus:border-[#5E286D] shadow-inner text-left"
                  autoComplete="email"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-[#5E286D]">Password</label>
                <button type="button" onClick={() => { openForgotPassword(); setForgotEmail(email) }} className="text-sm text-brand-secondary hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-[#E6E6FA] bg-white px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#5E286D] focus:border-[#5E286D] shadow-inner"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="icon-btn absolute right-3 top-1/2 transform -translate-y-[52%] md:-translate-y-1/2 text-gray-400 hover:text-brand-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || hasNavigated}
              className="w-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>

            <p className="text-xs text-brand-subtext mt-3">By continuing you agree to our Terms and Privacy Policy.</p>
          </form>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Don’t have an account?{' '}
            <a href="#" className="text-brand-secondary hover:underline font-medium">Sign up</a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold text-brand-primary">Reset Password</h3>
            <p className="text-sm text-gray-600 mt-1">Enter your email and we’ll send you a reset link.</p>
            <div className="mt-4">
              <input value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" className="w-full border rounded-lg px-3 py-2" />
            </div>
            {forgotStatus && <p className="mt-2 text-sm text-gray-700">{forgotStatus}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setForgotOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
              <button onClick={handleForgot} disabled={forgotSubmitting} className="px-4 py-2 rounded-lg bg-brand-secondary text-white disabled:opacity-50">{forgotSubmitting ? 'Sending…' : 'Send Link'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 left-0 right-0 mx-auto text-center text-xs text-gray-500 px-4">
        Developed by <strong>Eloqix Technologies Pvt Ltd</strong> • Maintained by <strong>Datzon Technologies</strong>
      </div>
    </div>
  )
}
