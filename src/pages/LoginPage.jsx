import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import apiService from '../services/api.service'
import './LoginPage.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedRole, setSelectedRole] = useState('customer') // customer or provider
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Use role-specific endpoints
      const endpoint = selectedRole === 'customer'
        ? '/user/login'
        : '/provider/login'

      const response = await apiService.post(endpoint, {
        email: email.trim(),
        password: password,
      })

      if (response.error) {
        setError(response.message || 'Login failed. Please check your credentials.')
        return
      }

      // Store token - handle different response structures
      const responseData = response.data?.data || response.data
      if (responseData?.accessToken) {
        localStorage.setItem('auth_token', responseData.accessToken)
        localStorage.setItem('user_data', JSON.stringify(responseData.user || {}))

        // Navigate based on role
        if (selectedRole === 'provider') {
          navigate('/provider/dashboard')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
            onClick={() => setSelectedRole('customer')}
          >
            <span className="role-icon">👤</span> Customer
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'provider' ? 'active' : ''}`}
            onClick={() => setSelectedRole('provider')}
          >
            <span className="role-icon">🛠️</span> Provider
          </button>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {successMessage && (
            <div className="success-message fade-in">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="error-message shake-animation">
              {error}
            </div>
          )}

          <div className="form-group fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="modern-input"
            />
          </div>

          <div className="form-group fade-in-up" style={{ animationDelay: '0.2s' }}>
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="modern-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="forgot-password-link-wrapper">
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn fade-in-up"
            style={{ animationDelay: '0.3s' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

