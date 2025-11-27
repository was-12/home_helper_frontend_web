import { useState, useEffect } from 'react'
import apiService from '../services/api.service'
import './ProviderCard.css'

const ProviderCard = ({ provider, onBook }) => {
    const [sentiment, setSentiment] = useState(null)
    const [loadingSentiment, setLoadingSentiment] = useState(true)

    useEffect(() => {
        loadSentiment()
    }, [provider.providerId])

    const loadSentiment = async () => {
        setLoadingSentiment(true)
        try {
            const response = await apiService.get(`/providers/${provider.providerId}/reviews/sentiment`)
            if (!response.error && response.data?.success && response.data?.data) {
                setSentiment(response.data.data)
            }
        } catch (error) {
            console.error('Error loading sentiment:', error)
        } finally {
            setLoadingSentiment(false)
        }
    }

    // Calculate good review percentage
    const goodReviewPercent = sentiment?.positive || 0

    return (
        <div className="provider-card-enhanced">
            {/* Header */}
            <div className="provider-card-header">
                <div className="provider-avatar-compact">
                    {provider.imageUrl ? (
                        <img src={provider.imageUrl} alt={provider.name} />
                    ) : (
                        <div className="avatar-placeholder-compact">
                            {(provider.name || 'P').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="provider-main-info">
                    <h3 className="provider-name">{provider.name || 'Provider'}</h3>
                    <p className="provider-location">📍 {provider.area}, {provider.city}</p>
                    <div className="provider-rating-row">
                        <span className="rating-stars">⭐ {Number(provider.rating || 0).toFixed(1)}</span>
                        <span className="rating-count">({provider.totalReviews || 0})</span>
                    </div>
                </div>
            </div>

            {/* Compact Stats */}
            <div className="provider-stats-compact">
                <div className="stat-item">
                    <span className="stat-label">Rate</span>
                    <span className="stat-value">Rs {Number(provider.hourlyRate || 0).toLocaleString()}/hr</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Bookings</span>
                    <span className="stat-value">{provider.completedServices || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Exp</span>
                    <span className="stat-value">{provider.experienceYears || 0}y</span>
                </div>
            </div>

            {/* Sentiment Breakdown */}
            {!loadingSentiment && sentiment && (
                <div className="sentiment-stats-container">
                    <div className="sentiment-bar-wrapper">
                        <div className="sentiment-bar">
                            <div className="bar-segment positive" style={{ width: `${sentiment.positive}%` }}></div>
                            <div className="bar-segment neutral" style={{ width: `${sentiment.neutral}%` }}></div>
                            <div className="bar-segment negative" style={{ width: `${sentiment.negative}%` }}></div>
                        </div>
                    </div>
                    <div className="sentiment-text-row">
                        <span className="sentiment-pill positive">
                            👍 {sentiment.positive}%
                        </span>
                        {sentiment.negative > 10 && (
                            <span className="sentiment-pill negative">
                                👎 {sentiment.negative}%
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Book Button */}
            <button className="provider-book-btn-compact" onClick={() => onBook(provider)}>
                Book Now
            </button>
        </div>
    )
}

export default ProviderCard
