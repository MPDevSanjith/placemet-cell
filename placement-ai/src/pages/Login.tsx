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

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<string | null>(null)
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }
    try {
      setSubmitting(true)
      const payload: LoginPayload = { email, password }
      const res = await login(payload) as LoginResponse
      if (res?.user?.role === 'student' && res?.otpRequired) {
        // move to OTP page, do not save token yet
        navigate('/otp', { state: { email: res.user.email, name: res.user.name }, replace: true })
      } else if (res?.token && res?.user?.role) {
        const role: 'placement_officer' | 'student' = res.user.role === 'placement_officer' ? 'placement_officer' : 'student'
        saveAuth({ token: res.token, user: { id: res.user.id, email: res.user.email, name: res.user.name, role } })
        navigate(role === 'placement_officer' ? '/placement-officer' : '/student', { replace: true })
      } else {
        setError('Login failed')
      }
    } catch (err: unknown) {
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
                <button type="button" onClick={() => { setForgotOpen(true); setForgotEmail(email) }} className="text-sm text-brand-secondary hover:underline">Forgot?</button>
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
              disabled={submitting}
              className="w-full rounded-lg px-4 py-2.5 font-medium shadow-md bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] hover:opacity-95 text-white focus:outline-none focus:ring-2 focus:ring-[#dd2a7b] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
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
