import { useEffect, useMemo, useState, createRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyStudentOtp, requestStudentOtp, type LoginResponse } from '../global/api'
import { saveAuth, getAuth } from '../global/auth'

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { email?: string; name?: string } | null) || null
  const searchParams = new URLSearchParams(location.search)
  
  // Get email from state, URL params, or fallback
  const email = state?.email || searchParams.get('email') || ''
  const name = state?.name || searchParams.get('name') || email.split('@')[0] || ''
  
  console.log('📱 OTP Page Debug:', {
    location: location.pathname,
    state,
    searchParams: Object.fromEntries(searchParams.entries()),
    email,
    name,
    hasState: !!state,
    hasSearchParams: searchParams.has('email')
  })
  
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)
  const inputs = useMemo(() => Array.from({ length: 6 }).map(() => createRef<HTMLInputElement>()), [])
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    console.log('📱 OTP Page mounted with email:', email)
    if (!email) {
      console.warn('⚠️ No email found in state or URL, redirecting to login')
      if (!hasNavigated) {
        setHasNavigated(true)
        navigate('/login', { replace: true })
      }
      return
    }
    inputs[0]?.current?.focus()
  }, [email, navigate, inputs, hasNavigated])

  // Check if user is already authenticated
  useEffect(() => {
    const localAuth = getAuth()
    if (localAuth?.token && localAuth?.user?.role === 'student') {
      console.log('📱 User already authenticated, redirecting to appropriate page')
      const isAlreadyOnboarded = localStorage.getItem('student_onboarded') === 'true'
      if (isAlreadyOnboarded) {
        navigate('/student', { replace: true })
      } else {
        navigate('/student/onboarding', { replace: true })
      }
    }
  }, [navigate])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(t)
    }
    setCanResend(true)
  }, [resendTimer])

  const onInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 1)
    e.target.value = v
    if (v && index < inputs.length - 1) inputs[index + 1]?.current?.focus()
  }

  const collectCode = () => inputs.map(r => r.current?.value ?? '').join('')

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, inputs.length)
    if (!pasted) return
    e.preventDefault()
    for (let i = 0; i < inputs.length; i++) {
      const ref = inputs[i]
      if (ref.current) ref.current.value = pasted[i] ?? ''
    }
    const lastIndex = Math.min(pasted.length, inputs.length) - 1
    if (lastIndex >= 0) inputs[lastIndex]?.current?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const current = inputs[index]?.current
      const empty = !current || current.value === ''
      if (empty && index > 0) inputs[index - 1]?.current?.focus()
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputs[index - 1]?.current?.focus()
    }
    if (e.key === 'ArrowRight' && index < inputs.length - 1) {
      e.preventDefault()
      inputs[index + 1]?.current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email) return setError('Missing email. Please login again.')
    if (hasNavigated) return // Prevent multiple submissions
    if (submitting) return // Prevent multiple submissions
    
    const code = collectCode()
    if (code.length !== 6) return setError('Enter 6-digit OTP')
    
    try {
      setSubmitting(true)
      const res = await verifyStudentOtp(email, code) as LoginResponse
      console.log('🔐 OTP verification response:', res)
      
      if (res?.user?.role === 'student') {
        // Save authentication immediately for fast response
        saveAuth({ 
          token: res.token || 'cookie-session', 
          user: { 
            id: res.user.id!, 
            email: res.user.email, 
            name: res.user.name, 
            role: 'student' 
          } 
        })
        
        // Set navigation flag to prevent multiple navigations
        setHasNavigated(true)
        
        // Check if student is already onboarded
        const isAlreadyOnboarded = localStorage.getItem('student_onboarded') === 'true'
        
        if (isAlreadyOnboarded) {
          console.log('✅ Student already onboarded, redirecting to dashboard')
          navigate('/student', { replace: true })
        } else {
          // Set onboarding status in localStorage to prevent redirect loop
          localStorage.setItem('student_onboarded', 'false')
          localStorage.setItem('resume_uploaded', 'false')
          
          console.log('✅ OTP verified, redirecting to onboarding')
          navigate('/student/onboarding', { replace: true })
        }
        
        // Force a small delay to ensure auth state is properly set
        setTimeout(() => {
          window.location.href = isAlreadyOnboarded ? '/student' : '/student/onboarding'
        }, 100)
        
        // Do backend verification in background (non-blocking)
        setTimeout(async () => {
          try {
            // Verify with backend to get fresh data
            const backendRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/verify`, {
              method: 'GET',
              headers: {
                ...(res.token ? { 'Authorization': `Bearer ${res.token}` } : {}),
                'Content-Type': 'application/json'
              }
            })
            
            if (backendRes.ok) {
              console.log('✅ Backend verification completed successfully')
            }
          } catch (err) {
            console.log('⚠️ Background backend verification failed, but user is already logged in')
          }
        }, 100)
        
      } else {
        console.error('❌ Invalid OTP response:', res)
        setError('Invalid OTP or verification failed')
      }
    } catch (err: unknown) {
      console.error('❌ OTP verification error:', err)
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    try {
      setCanResend(false)
      setResendTimer(30)
      await requestStudentOtp(email)
    } catch {
      setCanResend(true)
      setResendTimer(0)
    }
  }

  return (
    <>
    <div className="otp-page">
      <div className="otp-background">
        <div className="floating-elements">
          {/* decorative elements are defined in index.css */}
        </div>
      </div>
      <div className="otp-container">
        <div className="otp-card" style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div className="otp-header" style={{ background: 'linear-gradient(135deg, #f58529, #dd2a7b 45%, #8134af 75%, #515bd4)' }}>
            <div className="otp-icon">🔐</div>
            <div className="otp-title">Verify OTP</div>
            <div className="otp-subtitle">{name ? `Hi ${name}, ` : ''}enter the 6-digit code sent to {email || 'your email'}.</div>
          </div>
          <div className="px-6 py-3">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4]" style={{ width: `${(collectCode().length / inputs.length) * 100}%`, transition: 'width 200ms ease' }} />
            </div>
          </div>
          <form className="otp-form" onSubmit={handleSubmit}>
            {error && (
              <div className="otp-error">
                <span className="error-icon">❗</span>
                <span>{error}</span>
              </div>
            )}
            <div className="otp-form-content">
              <div className="otp-input-group">
                <label className="otp-label">Enter 6-digit code</label>
                <div className="otp-inputs">
                  {inputs.map((ref, idx) => (
                    <div className="otp-input-wrapper" key={idx}>
                      <input
                        ref={ref}
                        className="otp-input"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        onChange={(e) => onInput(idx, e)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={idx === 0 ? handlePaste : undefined}
                        aria-label={`OTP digit ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">Tip: Paste the full code or type — it will auto-advance.</p>
              <button 
                className="otp-submit-btn" 
                style={{ background: 'linear-gradient(90deg, #f58529, #dd2a7b, #8134af, #515bd4)' }} 
                disabled={submitting || hasNavigated}
                type="submit"
              >
                {submitting ? (
                  <span className="submit-loading">
                    <span className="loading-spinner" /> 
                    Verifying…
                  </span>
                ) : (
                  'Verify & Continue'
                )}
              </button>
              <div className="otp-resend">
                <p className="resend-text">Didn't receive the code?</p>
                {canResend ? (
                  <button type="button" onClick={handleResend} className="resend-btn">Resend OTP</button>
                ) : (
                  <div className="resend-timer"><div className="timer-spinner" /> <span>Resend in {resendTimer}s</span></div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div className="fixed bottom-4 left-0 right-0 mx-auto text-center text-xs text-gray-500 px-4">
      Developed by <strong>Eloqix Technologies Pvt Ltd</strong> • Maintained by <strong>Datzon Technologies</strong>
    </div>
    </>
  )
}


