import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './OtpVerification.css'

const OtpVerification = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const initialEmail = location.state?.email || localStorage.getItem('pending_signup_email') || ''
  const initialRole = location.state?.role || localStorage.getItem('pending_signup_role') || 'customer'

  const [email, setEmail] = useState(initialEmail)
  const [role, setRole] = useState(initialRole)
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email)
      localStorage.setItem('pending_signup_email', location.state.email)
    }
    if (location.state?.role) {
      setRole(location.state.role)
      localStorage.setItem('pending_signup_role', location.state.role)
    }
  }, [location.state])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!email) {
      setError('Missing email. Please restart signup.')
      return
    }

    if (otp.trim().length < 6) {
      setError('Please enter the 6 digit verification code sent to your email.')
      return
    }

    setIsVerifying(true)

    try {
      const endpoint = role === 'provider' ? '/provider/verify-otp' : '/user/verify-otp'
      const response = await apiService.post(endpoint, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      })

      if (response.error) {
        setError(response.message || 'Verification failed. Please try again.')
        return
      }

      const responseData = response.data?.data || response.data
      if (!responseData?.accessToken) {
        setError('Unexpected response from server.')
        return
      }

      localStorage.setItem('auth_token', responseData.accessToken)
      localStorage.setItem('user_data', JSON.stringify(responseData.user || {}))

      setSuccessMessage('Email verified successfully!')

      if (role === 'provider') {
        const registrationStatus = responseData.provider?.registrationStatus
        if (registrationStatus && registrationStatus !== 'approved') {
          navigate('/provider/complete-profile')
        } else {
          navigate('/provider/dashboard')
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccessMessage('')

    if (!email) {
      setError('Missing email. Please restart signup.')
      return
    }

    setIsResending(true)

    try {
      const endpoint = role === 'provider' ? '/provider/resend-otp' : '/user/resend-otp'
      const response = await apiService.post(endpoint, {
        email: email.trim().toLowerCase(),
      })

      if (response.error) {
        setError(response.message || 'Unable to resend code. Please try again later.')
      } else {
        setSuccessMessage(response.data?.message || 'A new verification code has been sent to your email.')
      }
    } catch (err) {
      setError(err.message || 'Unable to resend code. Please try again later.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="otp-page">
      <div className="otp-container">
        <div className="otp-header">
          <h1>Verify Your Email</h1>
          <p>
            Enter the verification code we sent to <strong>{email || 'your email'}</strong>
          </p>
        </div>

        <form className="otp-form" onSubmit={handleVerify}>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter 6 digit code"
              maxLength={6}
              disabled={isVerifying}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isVerifying}>
            {isVerifying ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>

        <div className="otp-footer">
          <p>Didn’t receive the code?</p>
          <button type="button" className="link-button" onClick={handleResend} disabled={isResending}>
            {isResending ? 'Sending…' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OtpVerification


