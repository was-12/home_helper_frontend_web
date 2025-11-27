import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './ForgotPassword.css'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const handleRequestOtp = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await apiService.post('/user/forgot-password', {
                email: email.trim(),
            })

            if (response.error) {
                setError(response.message || 'Failed to send OTP. Please check your email.')
            } else {
                setSuccessMessage('OTP sent successfully! Please check your email.')
                setStep(2)
                setError('')
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            const response = await apiService.post('/user/reset-password', {
                email: email.trim(),
                otp: otp.trim(),
                newPassword: newPassword,
            })

            if (response.error) {
                setError(response.message || 'Failed to reset password.')
            } else {
                // Success - login automatically or redirect to login?
                // Backend returns token, so we can auto-login
                const responseData = response.data?.data || response.data
                if (responseData?.accessToken) {
                    localStorage.setItem('auth_token', responseData.accessToken)
                    localStorage.setItem('user_data', JSON.stringify(responseData.user || {}))

                    // Navigate based on role
                    if (responseData.user.role === 'service_provider') {
                        navigate('/provider/dashboard')
                    } else {
                        navigate('/dashboard')
                    }
                } else {
                    // Fallback to login page
                    navigate('/login', { state: { message: 'Password reset successfully. Please login.' } })
                }
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-container">
                <div className="forgot-password-header">
                    <h1 className="forgot-password-title">
                        {step === 1 ? 'Forgot Password' : 'Reset Password'}
                    </h1>
                    <p className="forgot-password-subtitle">
                        {step === 1
                            ? 'Enter your email to receive a verification code'
                            : 'Enter the code sent to your email and your new password'}
                    </p>
                </div>

                {step === 1 ? (
                    <form className="forgot-password-form" onSubmit={handleRequestOtp}>
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form className="forgot-password-form" onSubmit={handleResetPassword}>
                        {successMessage && <div className="success-message">{successMessage}</div>}
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="otp">Verification Code</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="forgot-password-footer">
                    <Link to="/login" className="link">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
