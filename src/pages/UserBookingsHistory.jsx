import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './UserBookingsHistory.css'

const BookingTimer = ({ expiresAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(null)

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!expiresAt) return null
            const now = new Date()
            const expiration = new Date(expiresAt)
            const diff = expiration - now

            if (diff <= 0) return 0
            return Math.floor(diff / 1000) // seconds
        }

        setTimeLeft(calculateTimeLeft())

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft()
            setTimeLeft(remaining)
            if (remaining === 0) {
                clearInterval(timer)
                if (onExpire) onExpire()
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [expiresAt, onExpire])

    const formatTime = (seconds) => {
        if (seconds === null) return '--:--'
        if (seconds <= 0) return 'Expired'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (timeLeft === null || timeLeft <= 0) return null

    return (
        <div className="timer-badge">
            <span>⏳ Expires in {formatTime(timeLeft)}</span>
        </div>
    )
}

const UserBookingsHistory = () => {
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isCancelling, setIsCancelling] = useState(false)

    const [reviews, setReviews] = useState([])
    const [profile, setProfile] = useState(null)

    useEffect(() => {
        fetchProfile()
        fetchBookings()
        fetchReviews()
        // Poll for updates
        const interval = setInterval(() => fetchBookings(true), 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await apiService.get('/customer/profile')
            if (!response.error && response.data?.data) {
                setProfile(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const fetchReviews = async () => {
        try {
            const response = await apiService.get('/reviews')
            if (!response.error && response.data?.data) {
                setReviews(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
        }
    }

    const fetchBookings = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true)
        try {
            const response = await apiService.get('/customer/booking/requests')
            if (!response.error && response.data?.data?.bookings) {
                setBookings(response.data.data.bookings)
            }
        } catch (error) {
            console.error('Error fetching bookings:', error)
        } finally {
            if (!isBackground) setIsLoading(false)
        }
    }

    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return

        setIsCancelling(true)
        try {
            const response = await apiService.post(`/customer/booking/${bookingId}/cancel`)
            if (!response.error) {
                alert('Booking cancelled successfully')
                fetchBookings()
            } else {
                alert('Failed to cancel booking: ' + (response.message || 'Unknown error'))
            }
        } catch (error) {
            alert('Error cancelling booking: ' + error.message)
        } finally {
            setIsCancelling(false)
        }
    }

    const filteredBookings = useMemo(() => {
        return bookings
            .filter(booking => {
                const matchesSearch = searchTerm === '' ||
                    booking.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.subcategoryName?.toLowerCase().includes(searchTerm.toLowerCase())

                const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

                return matchesSearch && matchesStatus
            })
            .sort((a, b) => {
                const dateA = new Date(a.statusUpdatedAt || a.createdAt || a.requestedDateTime || 0)
                const dateB = new Date(b.statusUpdatedAt || b.createdAt || b.requestedDateTime || 0)
                return dateB - dateA
            })
    }, [bookings, searchTerm, statusFilter])

    const formatDate = (dateString) => {
        if (!dateString) return 'Not scheduled'
        return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    }

    const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`

    return (
        <div className="bookings-history-page">
            <div className="history-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ←
                </button>
                <h1>My Bookings History</h1>
            </div>

            <div className="history-container">
                <div className="history-filters">
                    <div className="filter-group">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search bookings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="booking_accepted">Accepted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="expired">Expired</option>
                        </select>
                        {(searchTerm || statusFilter !== 'all') && (
                            <button
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchTerm('')
                                    setStatusFilter('all')
                                }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    <div className="filter-actions">
                        <span className="booking-count">
                            {filteredBookings.length} Record{filteredBookings.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            className="refresh-btn"
                            onClick={() => fetchBookings()}
                            title="Refresh Bookings"
                        >
                            🔄
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="empty-state">
                        <p>No bookings found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="bookings-grid">
                        {filteredBookings.map((booking, index) => (
                            <div
                                key={booking.requestId || index}
                                className="history-card"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="card-header">
                                    <div className="provider-info">
                                        {booking.provider?.imageUrl ? (
                                            <img
                                                src={booking.provider.imageUrl}
                                                alt={booking.provider.name}
                                                className="provider-img"
                                            />
                                        ) : (
                                            <div className="provider-placeholder">
                                                {(booking.provider?.name || 'P').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="service-details">
                                            <h3>{booking.subcategoryName || booking.serviceName || 'Service'}</h3>
                                            <p>{booking.provider?.name || 'Provider Assigning'}</p>
                                        </div>
                                    </div>
                                    <span className={`status-badge ${booking.status}`}>
                                        {booking.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="info-item">
                                        <span className="info-label">Date & Time</span>
                                        <span className="info-value">{formatDate(booking.requestedDateTime)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Total Amount</span>
                                        <span className="info-value">{formatCurrency(booking.totalAmount || booking.hourlyRate)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Address</span>
                                        <span className="info-value">{booking.serviceAddress || 'No address provided'}</span>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div>
                                        {booking.status === 'pending' && booking.bookingExpiresAt && (
                                            <BookingTimer
                                                expiresAt={booking.bookingExpiresAt}
                                                onExpire={() => fetchBookings()}
                                            />
                                        )}
                                        {booking.status === 'completed' && hasReviewForBooking(booking.requestId) && (
                                            <div className="review-submitted-badge" style={{
                                                padding: '0.4rem 0.8rem',
                                                background: '#f1f5f9',
                                                color: '#64748b',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                ✓ Review Submitted
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['pending', 'booking_accepted'].includes(booking.status) && (
                                            <button
                                                className="action-btn btn-cancel"
                                                onClick={() => handleCancelBooking(booking.requestId)}
                                                disabled={isCancelling}
                                            >
                                                {isCancelling ? '...' : 'Cancel'}
                                            </button>
                                        )}
                                        {['booking_accepted', 'in_progress'].includes(booking.status) && booking.providerPhone && (
                                            <button
                                                className="action-btn btn-contact"
                                                onClick={() => window.open(`tel:${booking.providerPhone}`)}
                                            >
                                                📞 Contact Provider
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    )
}

export default UserBookingsHistory
