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
                                {provider.name.charAt(0)}
                            </div>
                            <div>
                                <h3>{provider.name}</h3>
                                <p>{provider.subcategory || 'Service Professional'}</p>
                                <span className="rating-badge">★ {Number(provider.rating || 0).toFixed(1)}</span>
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
                            <div className="detail-item">
                                <label>Estimated Total</label>
                                <strong>Rs {(Number(provider.hourlyRate || 0) * Number(formData.durationHours)).toLocaleString()}</strong>
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
                                    onClick={() => navigate(-1)}
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
