import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import apiService from '../services/api.service'
import './InstantBookingConfirm.css'

const InstantBookingConfirm = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const provider = location.state?.provider

    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [hours, setHours] = useState('2')
    const [urgencyLevel, setUrgencyLevel] = useState('')
    const [specialInstructions, setSpecialInstructions] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    if (!provider) {
        navigate('/booking/instant')
        return null
    }

    const validateFields = () => {
        const newErrors = {}

        if (!description.trim()) {
            newErrors.description = 'Service description is required'
        }

        if (!address.trim()) {
            newErrors.address = 'Service address is required'
        }

        const hoursValue = parseFloat(hours)
        if (!hours.trim()) {
            newErrors.hours = 'Estimated hours is required'
        } else if (isNaN(hoursValue) || hoursValue <= 0) {
            newErrors.hours = 'Hours must be greater than 0'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateFields()) {
            return
        }

        setIsSubmitting(true)
        try {
            const response = await apiService.post('/customer/instant-hiring/request', {
                providerId: provider.providerId,
                subcategoryId: provider.services[0]?.subcategoryId,
                requestType: 'instant',
                description,
                location: {
                    address: address.trim(),
                    latitude: 0.0,
                    longitude: 0.0
                },
                estimatedDuration: parseFloat(hours),
                urgencyLevel: urgencyLevel || undefined,
                specialInstructions: specialInstructions.trim() || undefined
            })

            if (!response.error && response.data?.success) {
                alert('✅ Booking request sent successfully! Provider will respond soon.')
                navigate('/booking/instant')
            } else {
                alert('❌ Failed to send booking request: ' + (response.data?.message || 'Unknown error'))
            }
        } catch (error) {
            console.error('Error submitting booking:', error)
            alert('❌ Error: ' + error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isValid = description.trim() && address.trim() && hours.trim() && parseFloat(hours) > 0

    return (
        <div className="instant-booking-confirm">
            {/* Header */}
            <div className="confirm-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span className="back-icon">←</span>
                </button>
                <h1 className="confirm-title">Book Service</h1>
            </div>

            <div className="confirm-container">
                {/* Provider Info Card */}
                <div className="provider-info-card animate-slide-up">
                    <div className="provider-header-mini">
                        <div className="provider-avatar-mini">
                            {provider.imageUrl ? (
                                <img src={provider.imageUrl} alt={provider.name} />
                            ) : (
                                <div className="avatar-placeholder-mini">
                                    {(provider.name || 'P').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="provider-details-mini">
                            <h3>{provider.name}</h3>
                            <p>📍 {provider.area}, {provider.city}</p>
                            <p className="service-name">⚡ {provider.subcategory}</p>
                        </div>
                    </div>
                    <div className="rate-badge">
                        Rs {Number(provider.hourlyRate || 0).toLocaleString()}/hr
                    </div>
                </div>

                {/* Form */}
                <div className="booking-form">
                    {/* Description */}
                    <div className="form-field animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <label>Service Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what service you need..."
                            rows={4}
                            className={errors.description ? 'error' : ''}
                        />
                        {errors.description && <span className="error-text">{errors.description}</span>}
                    </div>

                    {/* Address */}
                    <div className="form-field animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <label>Service Address *</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter complete address where service is needed..."
                            rows={3}
                            className={errors.address ? 'error' : ''}
                        />
                        {errors.address && <span className="error-text">{errors.address}</span>}
                    </div>

                    {/* Hours */}
                    <div className="form-field animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <label>Estimated Hours *</label>
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            placeholder="e.g., 2, 3.5, 4"
                            step="0.5"
                            min="0.5"
                            className={errors.hours ? 'error' : ''}
                        />
                        {errors.hours && <span className="error-text">{errors.hours}</span>}
                    </div>

                    {/* Urgency Level */}
                    <div className="form-field animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        <label>Urgency Level (Optional)</label>
                        <div className="urgency-chips">
                            {[
                                { value: 'low', label: 'Low', color: '#10b981' },
                                { value: 'medium', label: 'Medium', color: '#f59e0b' },
                                { value: 'high', label: 'High', color: '#ef4444' },
                                { value: 'emergency', label: 'Emergency', color: '#7c3aed' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`urgency-chip ${urgencyLevel === option.value ? 'selected' : ''}`}
                                    style={{
                                        '--chip-color': option.color
                                    }}
                                    onClick={() => setUrgencyLevel(urgencyLevel === option.value ? '' : option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="form-field animate-slide-up" style={{ animationDelay: '0.5s' }}>
                        <label>Special Instructions (Optional)</label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any additional notes or requirements..."
                            rows={3}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        className={`submit-btn animate-slide-up ${!isValid || isSubmitting ? 'disabled' : ''}`}
                        style={{ animationDelay: '0.6s' }}
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner"></div>
                                Sending Request...
                            </>
                        ) : isValid ? (
                            <>
                                <span className="btn-icon">✓</span>
                                Confirm Instant Booking
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">ℹ</span>
                                Fill Required Fields
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InstantBookingConfirm
