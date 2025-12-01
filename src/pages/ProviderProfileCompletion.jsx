import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './ProviderProfileCompletion.css'

const STATE_OPTIONS = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory']
const GENDER_OPTIONS = ['male', 'female', 'other']

const ProviderProfileCompletion = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    state: 'Punjab',
    serviceRadiusKm: '10',
    cnicNumber: '',
    experienceYears: '',
    age: '',
    gender: '',
  })
  const [cnicFront, setCnicFront] = useState({ preview: '', url: '', uploading: false })
  const [cnicBack, setCnicBack] = useState({ preview: '', url: '', uploading: false })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      navigate('/login', {
        state: { message: 'Please log in to finish your provider profile.' },
      })
    }
  }, [navigate])

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
    setSuccessMessage('')
  }

  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleImageUpload = async (event, position) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5 MB.')
      return
    }

    const targetSetter = position === 'front' ? setCnicFront : setCnicBack
    targetSetter((prev) => ({ ...prev, uploading: true }))
    setError('')
    setSuccessMessage('')

    try {
      const base64 = await convertFileToBase64(file)
      const response = await apiService.post('/upload/cnic', { image: base64 })

      if (response.error || !response.data?.data?.imageUrl) {
        setError(response.message || 'Unable to upload CNIC image. Please try again.')
        targetSetter((prev) => ({ ...prev, uploading: false }))
        return
      }

      targetSetter({
        preview: URL.createObjectURL(file),
        url: response.data.data.imageUrl,
        uploading: false,
      })
    } catch (err) {
      setError(err.message || 'Unable to upload CNIC image. Please try again.')
      targetSetter((prev) => ({ ...prev, uploading: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!cnicFront.url || !cnicBack.url) {
      setError('Please upload CNIC front and back images.')
      return
    }

    if (!formData.cnicNumber || formData.cnicNumber.length < 13) {
      setError('Please enter a valid CNIC number.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        state: formData.state,
        serviceRadiusKm: Number(formData.serviceRadiusKm) || 10,
        cnicNumber: formData.cnicNumber.trim(),
        cnicFrontUrl: cnicFront.url,
        cnicBackUrl: cnicBack.url,
      }

      if (formData.experienceYears) payload.experienceYears = Number(formData.experienceYears)
      if (formData.age) payload.age = Number(formData.age)
      if (formData.gender) payload.gender = formData.gender

      const response = await apiService.post('/provider/complete-profile', payload)

      if (response.error) {
        setError(response.message || 'Unable to complete profile. Please try again.')
        return
      }

      const responseData = response.data?.data || response.data
      if (responseData?.accessToken) {
        localStorage.setItem('auth_token', responseData.accessToken)
        localStorage.setItem('user_data', JSON.stringify(responseData.user || {}))
      }

      setSuccessMessage(response.data?.message || 'Profile completed! Awaiting admin approval.')
      navigate('/provider/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to complete profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="provider-profile-page">
      <div className="provider-profile-container">
        <div className="profile-header">
          <h1>Complete Provider Profile</h1>
          <p>Help us verify your identity so we can list you for customers.</p>
        </div>

        <form className="provider-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state">Province / State</label>
              <select id="state" name="state" value={formData.state} onChange={handleFieldChange} disabled={isSubmitting}>
                {STATE_OPTIONS.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="serviceRadiusKm">Service Radius (km)</label>
              <input
                type="number"
                id="serviceRadiusKm"
                name="serviceRadiusKm"
                min="5"
                max="50"
                value={formData.serviceRadiusKm}
                onChange={handleFieldChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cnicNumber">CNIC Number</label>
            <input
              type="text"
              id="cnicNumber"
              name="cnicNumber"
              value={formData.cnicNumber}
              onChange={handleFieldChange}
              placeholder="13 digit CNIC without dashes"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-row upload-row">
            <div className="upload-card">
              <span>CNIC Front</span>
              <label className="upload-box">
                {cnicFront.preview ? (
                  <img src={cnicFront.preview} alt="CNIC front preview" />
                ) : (
                  <span>{cnicFront.uploading ? 'Uploading…' : 'Upload front image'}</span>
                )}
                <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'front')} disabled={cnicFront.uploading || isSubmitting} />
              </label>
            </div>
            <div className="upload-card">
              <span>CNIC Back</span>
              <label className="upload-box">
                {cnicBack.preview ? (
                  <img src={cnicBack.preview} alt="CNIC back preview" />
                ) : (
                  <span>{cnicBack.uploading ? 'Uploading…' : 'Upload back image'}</span>
                )}
                <input type="file" accept="image/*" onChange={(event) => handleImageUpload(event, 'back')} disabled={cnicBack.uploading || isSubmitting} />
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experienceYears">Experience (years)</label>
              <input
                type="number"
                id="experienceYears"
                name="experienceYears"
                min="0"
                value={formData.experienceYears}
                onChange={handleFieldChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input type="number" id="age" name="age" min="18" value={formData.age} onChange={handleFieldChange} disabled={isSubmitting} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleFieldChange} disabled={isSubmitting}>
              <option value="">Select</option>
              {GENDER_OPTIONS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting || cnicFront.uploading || cnicBack.uploading}>
            {isSubmitting ? 'Submitting…' : 'Submit for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProviderProfileCompletion





