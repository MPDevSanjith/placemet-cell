import { useEffect, useMemo, useState, createRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyStudentOtp, requestStudentOtp, type LoginResponse } from '../global/api'
import { saveAuth } from '../global/auth'

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { email?: string; name?: string } | null) || null
  const email = state?.email
  const name = state?.name
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputs = useMemo(() => Array.from({ length: 6 }).map(() => createRef<HTMLInputElement>()), [])
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    inputs[0]?.current?.focus()
  }, [inputs])

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
    const code = collectCode()
    if (code.length !== 6) return setError('Enter 6-digit OTP')
    try {
      setSubmitting(true)
      const res = await verifyStudentOtp(email, code) as LoginResponse
      if (res?.token && res?.user?.role === 'student') {
        saveAuth({ token: res.token, user: { id: res.user.id!, email: res.user.email, name: res.user.name, role: 'student' } })
        navigate('/student/onboarding', { replace: true })
      } else {
        setError('Invalid OTP')
      }
    } catch (err: unknown) {
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
              <button className="otp-submit-btn" style={{ background: 'linear-gradient(90deg, #f58529, #dd2a7b, #8134af, #515bd4)' }} disabled={submitting}>
                {submitting ? <span className="submit-loading"><span className="loading-spinner" /> Verifying…</span> : 'Verify & Continue'}
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


