import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './SignupPage.css'

const CITY_OPTIONS = [
  {
    value: 'Lahore',
    label: 'Lahore',
    areas: ['Allama Iqbal Town', 'DHA', 'Gulberg', 'Johar Town', 'Model Town', 'Garden Town', 'Cantt', 'Faisal Town', 'Valencia Town', 'Bahria Town'],
  },
  {
    value: 'Faisalabad',
    label: 'Faisalabad',
    areas: ['D Ground', 'Civil Lines', 'Peoples Colony', 'Susan Road', 'Samanabad', 'Abdullah Pur', 'Gulberg', 'Millat Town', 'Eden City', 'Kohinoor City'],
  },
  {
    value: 'Islamabad',
    label: 'Islamabad',
    areas: ['F-8', 'F-7', 'F-10', 'F-11', 'G-6', 'G-7', 'G-9', 'G-10', 'G-11', 'E-11', 'Blue Area', 'I-8', 'I-9', 'I-10'],
  },
]

const formatPakistaniPhone = (value = '') => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('92') && digits.length >= 12) {
    return `+${digits}`
  }

  if (digits.startsWith('0') && digits.length >= 11) {
    return `+92${digits.slice(1)}`
  }

  if (digits.length === 10) {
    return `+92${digits}`
  }

  return `+${digits}`
}

const formatAddress = (address, area, city) => {
  const parts = [address?.trim(), area?.trim(), city?.trim()].filter(Boolean)
  return parts.join(', ')
}

const SignupPage = () => {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('customer')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    area: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Password Strength State
  const [passwordCriteria, setPasswordCriteria] = useState({
    hasLength: false,
    hasUpper: false,
    hasSpecial: false,
  })

  useEffect(() => {
    const pwd = formData.password
    setPasswordCriteria({
      hasLength: pwd.length >= 6,
      hasUpper: /[A-Z]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    })
  }, [formData.password])

  const availableAreas = useMemo(() => {
    const selectedCity = CITY_OPTIONS.find((city) => city.value === formData.city)
    return selectedCity?.areas || []
  }, [formData.city])

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
    setSuccessMessage('')
  }

  const handleCityChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      city: value,
      area: '',
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (!passwordCriteria.hasLength) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (!passwordCriteria.hasUpper) {
      setError('Password must contain at least one uppercase letter')
      return false
    }

    if (!passwordCriteria.hasSpecial) {
      setError('Password must contain at least one special character')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (!formData.name || formData.name.trim().length < 2) {
      setError('Please enter your full name')
      return false
    }

    if (selectedRole === 'provider' && (!formData.phone || formData.phone.trim().length === 0)) {
      setError('Phone number is required for providers')
      return false
    }

    if (selectedRole === 'provider' && (!formData.address || formData.address.trim().length === 0)) {
      setError('Address is required for providers')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const formattedPhone = formatPakistaniPhone(formData.phone)
      const formattedAddress = formatAddress(formData.address, formData.area, formData.city)

      const signupPayload = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      }

      if (formattedPhone) signupPayload.phone = formattedPhone
      if (formattedAddress) signupPayload.address = formattedAddress
      if (formData.city) signupPayload.city = formData.city
      if (formData.area) signupPayload.area = formData.area

      const endpoint = selectedRole === 'customer' ? '/user/signup' : '/provider/signup-basic'
      const response = await apiService.post(endpoint, signupPayload)
      console.log('Signup Response:', response)

      if (response.error) {
        console.error('Signup Error:', response)
        setError(response.message || 'Signup failed. Please try again.')
        return
      }

      if (response.data?.success) {
        const trimmedEmail = formData.email.trim().toLowerCase()
        localStorage.setItem('pending_signup_email', trimmedEmail)
        localStorage.setItem('pending_signup_role', selectedRole)

        setSuccessMessage('Account created! Please verify the OTP sent to your email.')
        navigate('/verify-otp', {
          state: {
            email: trimmedEmail,
            role: selectedRole,
          },
        })
      } else {
        console.error('Signup Failed (Success=false):', response.data)
        setError(response.data?.message || 'Signup failed. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <div className="signup-background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="signup-container">
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Join Home Helper today</p>
        </div>

        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('customer')
              setError('')
            }}
          >
            <span className="role-icon">👤</span> Customer
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'provider' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('provider')
              setError('')
            }}
          >
            <span className="role-icon">🛠️</span> Provider
          </button>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          {error && <div className="error-message shake-animation">{error}</div>}
          {successMessage && <div className="success-message fade-in">{successMessage}</div>}

          <div className="form-group fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              placeholder="Enter your full name"
              required
              disabled={isLoading}
              className="modern-input"
            />
          </div>

          <div className="form-group fade-in-up" style={{ animationDelay: '0.2s' }}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleFieldChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              className="modern-input"
            />
          </div>

          <div className="form-row fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFieldChange}
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                  className="modern-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="password-strength-meter">
                <div className={`strength-item ${passwordCriteria.hasLength ? 'valid' : ''}`}>
                  <span className="check-icon">{passwordCriteria.hasLength ? '✓' : '○'}</span>
                  At least 6 characters
                </div>
                <div className={`strength-item ${passwordCriteria.hasUpper ? 'valid' : ''}`}>
                  <span className="check-icon">{passwordCriteria.hasUpper ? '✓' : '○'}</span>
                  One uppercase letter
                </div>
                <div className={`strength-item ${passwordCriteria.hasSpecial ? 'valid' : ''}`}>
                  <span className="check-icon">{passwordCriteria.hasSpecial ? '✓' : '○'}</span>
                  One special character
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFieldChange}
                  placeholder="Confirm password"
                  required
                  disabled={isLoading}
                  className="modern-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group fade-in-up" style={{ animationDelay: '0.4s' }}>
            <label htmlFor="phone">
              Phone Number {selectedRole === 'provider' && <span className="input-required">*</span>}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleFieldChange}
              placeholder="+92XXXXXXXXXX"
              required={selectedRole === 'provider'}
              disabled={isLoading}
              className="modern-input"
            />
            <p className="input-hint">Pakistani phone numbers only (+92).</p>
          </div>

          <div className="form-group fade-in-up" style={{ animationDelay: '0.5s' }}>
            <label htmlFor="address">
              Address {selectedRole === 'provider' && <span className="input-required">*</span>}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleFieldChange}
              placeholder="House / Street / Block"
              required={selectedRole === 'provider'}
              disabled={isLoading}
              className="modern-input"
            />
          </div>

          <div className="form-row fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={(event) => handleCityChange(event.target.value)}
                disabled={isLoading}
                className="modern-select"
              >
                <option value="">Select city</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="area">Area</label>
              <select
                id="area"
                name="area"
                value={formData.area}
                onChange={handleFieldChange}
                disabled={isLoading || availableAreas.length === 0}
                className="modern-select"
              >
                <option value="">{availableAreas.length ? 'Select area' : 'Select city first'}</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn fade-in-up" style={{ animationDelay: '0.7s' }} disabled={isLoading}>
            {isLoading ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>

        <div className="signup-footer fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage


