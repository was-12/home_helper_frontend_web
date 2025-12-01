import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import apiService from '../services/api.service'
import './InstantBookingConfirm.css'

const InstantBookingConfirm = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const provider = location.state?.provider
    const selectedSubcategory = location.state?.selectedSubcategory

    // Determine the service details to use
    const serviceToBook = selectedSubcategory || (provider?.services && provider.services[0])
    const subcategoryId = serviceToBook?.subcategoryId
    const serviceName = serviceToBook?.subcategoryName || serviceToBook?.name || provider?.subcategory || 'Service'
    const hourlyRate = serviceToBook?.hourlyRate ? Number(serviceToBook.hourlyRate) : Number(provider?.hourlyRate || 0)

    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [hours, setHours] = useState('2')
    const [urgencyLevel, setUrgencyLevel] = useState('')
    const [specialInstructions, setSpecialInstructions] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    if (!provider) {
        navigate('/instant-booking')
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
                subcategoryId: subcategoryId,
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
                navigate('/instant-booking')
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

    // Calculate price breakdown
    const calculateCosts = () => {
        const hoursValue = parseFloat(hours) || 0
        const serviceCost = hourlyRate * hoursValue
        const platformFee = serviceCost * 0.10 // 10% platform fee
        const total = serviceCost + platformFee

        return {
            serviceCost: serviceCost.toFixed(2),
            platformFee: platformFee.toFixed(2),
            total: total.toFixed(2),
            upfront: (total * 0.50).toFixed(2),      // 50% upfront
            remaining: (total * 0.50).toFixed(2)     // 50% on completion
        }
    }

    const costs = calculateCosts()

    return (
        <div className="instant-booking-confirm">
            <div className="confirm-header">
                <button className="back-btn" onClick={() => navigate('/instant-booking')}>
                    <span className="back-icon">←</span>
                </button>
                <h1 className="confirm-title">Book Service</h1>
            </div>

            <div className="confirm-container">
                <div className="provider-card-enhanced" style={{ marginBottom: '20px' }}>
                    <div className="provider-card-header">
                        <div className="provider-avatar-compact">
                            {(provider.imageUrl || provider.profileImageUrl) ? (
                                <img
                                    src={provider.imageUrl || provider.profileImageUrl}
                                    alt={provider.name}
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                                    }}
                                />
                            ) : null}
                            <div className="avatar-placeholder-compact" style={{ display: (provider.imageUrl || provider.profileImageUrl) ? 'none' : 'flex' }}>
                                {(provider.name || 'P').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="provider-main-info">
                            <h3 className="provider-name">{provider.name}</h3>
                            {provider.rating >= 4 && (
                                <span className="verified-badge" title="Verified Provider">✓</span>
                            )}
                            <p className="provider-location">📍 {provider.area}, {provider.city}</p>
                            <div className="provider-rating-row">
                                <span className="rating-stars">⭐ {Number(provider.rating || 0).toFixed(1)}</span>
                                <span className="rating-count">({provider.totalReviews || 0} reviews)</span>
                            </div>
                            <p className="service-name">⚡ {serviceName}</p>
                            {provider.completedServices > 0 && (
                                <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', marginTop: '0.5rem' }}>
                                    ✓ {provider.completedServices} jobs completed
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="provider-stats-compact">
                        <div className="stat-item">
                            <span className="stat-label">Rate</span>
                            <span className="stat-value">Rs {hourlyRate.toLocaleString()}/hr</span>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="price-breakdown-card animate-slide-up" style={{ animationDelay: '0.05s' }}>
                    <h3>💰 Cost Breakdown</h3>
                    <div className="cost-row">
                        <span>Service Cost ({hours || 0}h × Rs {hourlyRate.toLocaleString()})</span>
                        <strong>Rs {Number(costs.serviceCost).toLocaleString()}</strong>
                    </div>
                    <div className="cost-row">
                        <span>Platform Fee (10%)</span>
                        <strong>Rs {Number(costs.platformFee).toLocaleString()}</strong>
                    </div>
                    <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                    <div className="cost-row total">
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total Cost</span>
                        <strong style={{ fontSize: '1.3rem', color: '#7C3AED' }}>Rs {Number(costs.total).toLocaleString()}</strong>
                    </div>
                    <div className="cost-split" style={{ marginTop: '15px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>💳 Pay Now (50%):</span>
                            <strong style={{ color: '#10b981' }}>Rs {Number(costs.upfront).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>✅ Pay on Completion (50%):</span>
                            <strong style={{ color: '#6b7280' }}>Rs {Number(costs.remaining).toLocaleString()}</strong>
                        </div>
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
