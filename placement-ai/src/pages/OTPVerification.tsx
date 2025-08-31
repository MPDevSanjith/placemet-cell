import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OTPVerification() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError(null)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 4)
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = [...otp]
      pastedData.split('').forEach((char, index) => {
        if (index < 4) newOtp[index] = char
      })
      setOtp(newOtp)
      setError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otpString = otp.join('')
    
    if (otpString.length !== 4) {
      setError('Please enter the complete 4-digit OTP')
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      if (otpString === '1234') {
        alert('OTP verified successfully!')
      } else {
        setError('Invalid OTP. Please try again.')
      }
      setSubmitting(false)
    }, 1000)
  }

  const handleResend = () => {
    setResendTimer(30)
    setCanResend(false)
    setError(null)
    alert('OTP resent to your email!')
  }

  return (
    <div className="otp-page">
      {/* Background with brand colors */}
      <div className="otp-background">
        <div className="floating-elements">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
          <div className="floating-icon icon-1">🔒</div>
          <div className="floating-icon icon-2">✉️</div>
          <div className="floating-icon icon-3">🔐</div>
        </div>
      </div>

      <div className="otp-container">
        <div className="otp-card">
          {/* Header */}
          <div className="otp-header">
            <div className="otp-icon">🔐</div>
            <h1 className="otp-title">Verify Your Email</h1>
            <p className="otp-subtitle">Enter the 4-digit code sent to your email</p>
          </div>

          {/* Form */}
          <div className="otp-form">
            {error && (
              <div className="otp-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="otp-form-content">
              <div className="otp-input-group">
                <label className="otp-label">Enter OTP Code</label>
                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <div key={index} className="otp-input-wrapper">
                      <input
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="otp-input"
                        placeholder="•"
                      />
                      {digit && (
                        <div className="otp-digit-display">
                          <span>{digit}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || otp.join('').length !== 4}
                className="otp-submit-btn"
              >
                {submitting ? (
                  <span className="submit-loading">
                    <div className="loading-spinner"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="otp-resend">
              <p className="resend-text">Didn't receive the code?</p>
              {canResend ? (
                <button onClick={handleResend} className="resend-btn">
                  Resend OTP
                </button>
              ) : (
                <div className="resend-timer">
                  <div className="timer-spinner"></div>
                  <span>Resend in {resendTimer}s</span>
                </div>
              )}
            </div>

            {/* Back to Login */}
            <div className="otp-back-link">
              <button onClick={() => navigate('/')} className="back-btn">
                <span>←</span>
                Back to Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="otp-footer">
          <p>Secure verification powered by advanced encryption</p>
        </div>
      </div>
    </div>
  )
}
