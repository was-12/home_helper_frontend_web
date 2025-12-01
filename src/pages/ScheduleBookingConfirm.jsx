import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './BookingPages.css'

const ScheduleBookingConfirm = () => {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { provider, formData } = state || {}

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [address, setAddress] = useState(formData?.location ? `${formData.location.area}, ${formData.location.city}` : '')
    const [error, setError] = useState('')

    useEffect(() => {
        if (!state || !provider) {
            navigate('/booking/schedule')
        }
    }, [state, provider, navigate])

    if (!provider || !formData) return null

    const formatDateTime = (date, time) => {
        return new Date(`${date}T${time}:00`).toLocaleString(undefined, {
            dateStyle: 'full',
            timeStyle: 'short'
        })
    }

    const [specialInstructions, setSpecialInstructions] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!address.trim()) {
            setError('Please enter a service address')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const requestedDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString()

            const payload = {
                providerId: provider.providerId,
                subcategoryId: formData.subcategoryId,
                requestType: 'scheduled', // Required by backend
                requestedDateTime: requestedDateTime,
                estimatedDuration: Number(formData.durationHours),
                location: {
                    address: address.trim(),
                    latitude: 0.0, // Default coordinates as we don't have map picker yet
                    longitude: 0.0
                },
                description: formData.notes || 'Scheduled booking',
                specialInstructions: specialInstructions.trim()
            }

            const response = await apiService.post('/customer/booking/request', payload)

            if (!response.error) {
                navigate('/dashboard')
            } else {
                setError(response.message || 'Failed to create booking request')
            }
        } catch (err) {
            setError(err.message || 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="booking-page">
            <div className="booking-shell">
                <header className="booking-hero small">
                    <div className="booking-hero-text">
                        <p className="booking-pill">Final Step</p>
                        <h1>Confirm your booking</h1>
                        <p>Review the details and confirm your appointment with {provider.name}.</p>
                    </div>
                </header>

                <main className="booking-content-grid">
                    <section className="booking-form-card">
                        <h2>Booking Details</h2>

                        <div className="provider-summary-card">
                            <div className="provider-avatar-placeholder">
                                {(provider.imageUrl || provider.profileImageUrl) ? (
                                    <img
                                        src={provider.imageUrl || provider.profileImageUrl}
                                        alt={provider.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) {
                                                e.target.nextSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : null}
                                <div style={{ display: (provider.imageUrl || provider.profileImageUrl) ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                    {provider.name.charAt(0)}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{provider.name}</h3>
                                    {provider.rating >= 4 && (
                                        <span className="verified-badge" title="Verified Provider" style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '20px',
                                            height: '20px',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            fontSize: '0.7rem',
                                            fontWeight: '800'
                                        }}>✓</span>
                                    )}
                                </div>
                                <p>{provider.subcategory || 'Service Professional'}</p>
                                <span className="rating-badge">★ {Number(provider.rating || 0).toFixed(1)}</span>
                                {provider.completedServices > 0 && (
                                    <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', marginTop: '0.5rem' }}>
                                        ✓ {provider.completedServices} jobs completed
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="details-grid">
                            <div className="detail-item">
                                <label>Service Date & Time</label>
                                <strong>{formatDateTime(formData.date, formData.time)}</strong>
                            </div>
                            <div className="detail-item">
                                <label>Duration</label>
                                <strong>{formData.durationHours} hours</strong>
                            </div>
                            <div className="detail-item">
                                <label>Hourly Rate</label>
                                <strong>Rs {Number(provider.hourlyRate || 0).toLocaleString()} / hr</strong>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="price-breakdown" style={{ marginTop: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                            <h4 style={{ marginBottom: '12px', color: '#374151' }}>💰 Cost Breakdown</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Service Cost ({formData.durationHours}h × Rs {Number(provider.hourlyRate || 0).toLocaleString()})</span>
                                <strong>Rs {(Number(provider.hourlyRate || 0) * Number(formData.durationHours)).toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Platform Fee (10%)</span>
                                <strong>Rs {((Number(provider.hourlyRate || 0) * Number(formData.durationHours)) * 0.10).toLocaleString()}</strong>
                            </div>
                            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total Cost</span>
                                <strong style={{ fontSize: '1.2rem', color: '#7C3AED' }}>Rs {((Number(provider.hourlyRate || 0) * Number(formData.durationHours)) * 1.10).toLocaleString()}</strong>
                            </div>
                            <div style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span>💳 Pay Now (50%):</span>
                                    <strong style={{ color: '#10b981' }}>Rs {(((Number(provider.hourlyRate || 0) * Number(formData.durationHours)) * 1.10) * 0.50).toLocaleString()}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>✅ Pay on Completion (50%):</span>
                                    <strong style={{ color: '#6b7280' }}>Rs {(((Number(provider.hourlyRate || 0) * Number(formData.durationHours)) * 1.10) * 0.50).toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        <form className="booking-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="address">Service Address *</label>
                                <textarea
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter full address for the service..."
                                    required
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="instructions">Special Instructions (Optional)</label>
                                <textarea
                                    id="instructions"
                                    value={specialInstructions}
                                    onChange={(e) => setSpecialInstructions(e.target.value)}
                                    placeholder="Any specific details like 'Key under mat', 'Beware of dog', etc."
                                    rows={3}
                                />
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => navigate('/booking/schedule')}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="booking-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <aside className="booking-info-card">
                        <h3>What happens next?</h3>
                        <ul className="info-list">
                            <li>
                                <span className="info-chip">1</span>
                                <div>
                                    <strong>Provider Confirmation</strong>
                                    <p>The provider will review your request and accept or reject it.</p>
                                </div>
                            </li>
                            <li>
                                <span className="info-chip">2</span>
                                <div>
                                    <strong>Payment</strong>
                                    <p>Once accepted, you'll need to pay 20% upfront to secure the slot.</p>
                                </div>
                            </li>
                            <li>
                                <span className="info-chip">3</span>
                                <div>
                                    <strong>Service Delivery</strong>
                                    <p>The provider will arrive at the scheduled time.</p>
                                </div>
                            </li>
                        </ul>
                    </aside>
                </main>
            </div>
        </div>
    )
}

export default ScheduleBookingConfirm
