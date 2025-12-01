import { useState, useEffect } from 'react'
import apiService from '../services/api.service'
import './ProviderCard.css'

const ProviderCard = ({ provider, onBook, onViewProfile, subcategoryId }) => {
    const [sentiment, setSentiment] = useState(null)
    const [loadingSentiment, setLoadingSentiment] = useState(true)

    useEffect(() => {
        loadSentiment()
    }, [provider.providerId, subcategoryId])

    const loadSentiment = async () => {
        setLoadingSentiment(true)
        try {
            // Build URL with optional subcategoryId parameter
            let url = `/providers/${provider.providerId}/reviews/sentiment`
            if (subcategoryId) {
                url += `?subcategoryId=${subcategoryId}`
            }

            const response = await apiService.get(url)
            if (!response.error && response.data?.success && response.data?.data) {
                setSentiment(response.data.data)
            }
        } catch (error) {
            console.error('Error loading sentiment:', error)
        } finally {
            setLoadingSentiment(false)
        }
    }

    // Get provider image from various possible fields
    const providerImage = provider.imageUrl ||
        provider.profileImageUrl ||
        provider.profileImage ||
        provider.image ||
        provider.profilePicture ||
        provider.photo ||
        provider.avatar

    // Debug logging
    useEffect(() => {
        console.log('🖼️ Provider Card Image Debug:', {
            providerId: provider.providerId,
            name: provider.name,
            imageUrl: provider.imageUrl,
            profileImageUrl: provider.profileImageUrl,
            profileImage: provider.profileImage,
            image: provider.image,
            finalImage: providerImage,
            allKeys: Object.keys(provider)
        })
    }, [provider, providerImage])

    return (
        <div className="provider-card-enhanced">
            {/* Header */}
            <div className="provider-card-header">
                <div className="provider-avatar-compact">
                    {providerImage ? (
                        <img
                            src={providerImage}
                            alt={provider.name}
                            onError={(e) => {
                                console.error('❌ Image failed to load:', providerImage)
                                e.target.style.display = 'none'
                                const placeholder = e.target.nextSibling
                                if (placeholder) {
                                    placeholder.style.display = 'flex'
                                }
                            }}
                            onLoad={() => {
                                console.log('✅ Image loaded successfully:', providerImage)
                            }}
                        />
                    ) : null}
                    <div
                        className="avatar-placeholder-compact"
                        style={{ display: providerImage ? 'none' : 'flex' }}
                    >
                        {(provider.name || 'P').charAt(0).toUpperCase()}
                    </div>
                </div>
                <div className="provider-main-info">
                    <h3 className="provider-name">{provider.name || 'Provider'}</h3>
                    <p className="provider-location">📍 {provider.area}, {provider.city}</p>
                    <div className="provider-rating-row">
                        <span className="rating-count" style={{ marginLeft: 0, fontSize: '0.9rem', color: '#64748b' }}>
                            {provider.totalReviews || 0} Reviews
                        </span>
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
                    <span className="stat-label">Experience</span>
                    <span className="stat-value">{provider.experienceYears || 0} years</span>
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

            {/* Action Buttons */}
            <div className="provider-action-buttons">
                <button className="provider-view-btn" onClick={() => onViewProfile(provider)}>
                    👤 View Profile
                </button>
                <button className="provider-book-btn-compact" onClick={() => onBook(provider)}>
                    📅 Book Now
                </button>
            </div>
        </div>
    )
}

export default ProviderCard
