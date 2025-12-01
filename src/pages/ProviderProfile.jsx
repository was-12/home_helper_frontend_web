import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './ProviderProfile.css'

const ProviderProfile = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [provider, setProvider] = useState(location.state?.provider || null)
    const prioritySubcategoryId = location.state?.prioritySubcategoryId

    // Review & Sentiment state
    const [selectedService, setSelectedService] = useState(null)
    const [reviews, setReviews] = useState([])
    const [sentimentData, setSentimentData] = useState(null)
    const [isLoadingReviews, setIsLoadingReviews] = useState(false)
    const reviewsRef = useRef(null)

    // Debug logging
    useEffect(() => {
        console.log('ProviderProfile mounted')
        console.log('Location state:', location.state)
        console.log('Provider state:', provider)
    }, [location, provider])

    // Sort services to put priority one first
    const sortedServices = useMemo(() => {
        if (!provider?.services) return []

        const services = [...provider.services]
        if (prioritySubcategoryId) {
            services.sort((a, b) => {
                if (a.subcategoryId === prioritySubcategoryId) return -1
                if (b.subcategoryId === prioritySubcategoryId) return 1
                return 0
            })
        }
        return services
    }, [provider, prioritySubcategoryId])

    // Handle service click
    const handleServiceClick = async (service) => {
        setSelectedService(service)
        setIsLoadingReviews(true)
        setReviews([])
        setSentimentData(null)

        try {
            // 1. Fetch Reviews
            const reviewsPromise = apiService.get(`/providers/${provider.providerId}/reviews?subcategoryId=${service.subcategoryId}`)

            // 2. Fetch Sentiment Analysis
            const sentimentPromise = apiService.get(`/providers/${provider.providerId}/reviews/sentiment?subcategoryId=${service.subcategoryId}`)

            const [reviewsResponse, sentimentResponse] = await Promise.all([reviewsPromise, sentimentPromise])

            // Handle Reviews
            if (reviewsResponse.data?.success && reviewsResponse.data?.data?.reviews) {
                setReviews(reviewsResponse.data.data.reviews)
            } else {
                setReviews([])
            }

            // Handle Sentiment
            if (sentimentResponse.data?.success && sentimentResponse.data?.data) {
                setSentimentData(sentimentResponse.data.data)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
            setReviews([])
        } finally {
            setIsLoadingReviews(false)
            setTimeout(() => {
                reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
        }
    }

    // If no provider, show a message
    if (!provider) {
        return (
            <div className="provider-profile-page" style={{ paddingTop: '100px', textAlign: 'center', color: 'white' }}>
                <h1>⚠️ No Provider Data Found</h1>
                <button onClick={() => navigate('/booking/instant')}>Back to Booking</button>
            </div>
        )
    }

    return (
        <div className="provider-profile-page" style={{ minHeight: '100vh', background: '#f8fafc', paddingTop: '80px' }}>
            {/* Header */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                background: 'white',
                padding: '15px 20px',
                zIndex: 1000,
                display: 'flex', alignItems: 'center', gap: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white', border: 'none', padding: '8px 16px',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    ← Back
                </button>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
                    {provider.name || 'Provider Profile'}
                </h1>
            </div>

            {/* Full Page Layout */}
            <div style={{ width: '100%', padding: '0' }}>

                {/* Hero Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px 20px',
                    color: 'white',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    {provider.imageUrl ? (
                        <img
                            src={provider.imageUrl} alt={provider.name}
                            style={{
                                width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover',
                                border: '5px solid rgba(255,255,255,0.3)', marginBottom: '20px',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                animation: 'scaleIn 0.5s ease-out'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '150px', height: '150px', borderRadius: '50%', background: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '60px', fontWeight: 'bold', color: '#667eea',
                            margin: '0 auto 20px auto', border: '5px solid rgba(255,255,255,0.3)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                            animation: 'scaleIn 0.5s ease-out'
                        }}>
                            {(provider.name || 'P').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '800', animation: 'fadeInUp 0.5s ease-out 0.2s backwards' }}>{provider.name}</h2>
                    <p style={{ margin: 0, fontSize: '18px', opacity: 0.9, animation: 'fadeInUp 0.5s ease-out 0.3s backwards' }}>📍 {provider.area}, {provider.city}</p>

                    <button
                        onClick={() => {
                            const subcategoryToBook = provider.services.find(s => s.subcategoryId === prioritySubcategoryId) || provider.services[0];
                            navigate('/booking/instant/confirm', {
                                state: {
                                    provider,
                                    selectedSubcategory: subcategoryToBook
                                }
                            })
                        }}
                        style={{
                            marginTop: '30px', padding: '15px 40px',
                            background: 'white', color: '#667eea',
                            border: 'none', borderRadius: '50px',
                            fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                            transition: 'transform 0.2s',
                            animation: 'fadeInUp 0.5s ease-out 0.4s backwards'
                        }}
                    >
                        📅 Book This Provider Now
                    </button>
                </div>

                {/* Content Container */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px', marginBottom: '40px'
                    }}>
                        {[
                            { icon: '💼', value: provider.experienceYears || 0, label: 'Years Experience' },
                            { icon: '✅', value: provider.completedServices || 0, label: 'Total Bookings Completed' },
                            { icon: '💰', value: `Rs ${provider.hourlyRate || 0}`, label: 'Per Hour' }
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'white', padding: '25px', borderRadius: '16px', textAlign: 'center',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                                animation: `fadeInUp 0.5s ease-out ${0.5 + (i * 0.1)}s backwards`
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{stat.icon}</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stat.value}</div>
                                <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Services List */}
                    {sortedServices.length > 0 && (
                        <div style={{
                            background: 'white', borderRadius: '20px', padding: '40px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '40px',
                            animation: 'fadeInUp 0.5s ease-out 0.8s backwards'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '25px', color: '#333', fontSize: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                🛠️ Services Offered
                            </h3>
                            <p style={{ color: '#666', marginBottom: '20px' }}>Click on a service to view specific reviews & analytics.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                {sortedServices.map((service, index) => {
                                    const isPriority = service.subcategoryId === prioritySubcategoryId
                                    const isSelected = selectedService?.subcategoryId === service.subcategoryId

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => handleServiceClick(service)}
                                            className="service-card-hover"
                                            style={{
                                                padding: '20px',
                                                background: isSelected ? '#667eea' : (isPriority ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : '#f8fafc'),
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                color: isSelected ? 'white' : (isPriority ? '#667eea' : '#475569'),
                                                border: isSelected ? '2px solid #667eea' : (isPriority ? '2px solid #667eea' : '1px solid #e2e8f0'),
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                position: 'relative', cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                                boxShadow: isSelected ? '0 10px 25px rgba(102, 126, 234, 0.3)' : 'none'
                                            }}
                                        >
                                            <span style={{ color: isSelected ? 'white' : (isPriority ? '#667eea' : '#94a3b8') }}>•</span>
                                            {service.subcategoryName || service.name || 'Service'}
                                            {isPriority && !isSelected && (
                                                <span style={{
                                                    position: 'absolute', top: '-10px', right: '10px',
                                                    background: '#667eea', color: 'white', fontSize: '10px',
                                                    padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold'
                                                }}>Requested</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Reviews & Sentiment Section */}
                    <div ref={reviewsRef}>
                        {selectedService && (
                            <div className="glass-card" style={{
                                background: 'white', borderRadius: '20px', padding: '40px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                animation: 'scaleIn 0.5s ease-out'
                            }}>
                                <h3 style={{ marginTop: 0, marginBottom: '30px', color: '#333', fontSize: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
                                    📊 Analytics & Reviews for {selectedService.subcategoryName || selectedService.name}
                                </h3>

                                {isLoadingReviews ? (
                                    <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                                        <div className="spinner" style={{ margin: '0 auto 20px auto', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        <p style={{ fontSize: '18px', fontWeight: '500' }}>Analyzing reviews...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Animated Sentiment Analysis */}
                                        {sentimentData && (
                                            <div style={{ marginBottom: '50px', animation: 'fadeInUp 0.6s ease-out' }}>
                                                <h4 style={{ margin: '0 0 20px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>AI Sentiment Analysis</h4>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                                                    {/* Positive Bar */}
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '600', color: '#166534' }}>
                                                            <span>😊 Positive</span>
                                                            <span>{sentimentData.positive}%</span>
                                                        </div>
                                                        <div className="sentiment-bar-container">
                                                            <div className="sentiment-bar-fill" style={{ width: `${sentimentData.positive}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}></div>
                                                        </div>
                                                    </div>

                                                    {/* Neutral Bar */}
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                                                            <span>😐 Neutral</span>
                                                            <span>{sentimentData.neutral}%</span>
                                                        </div>
                                                        <div className="sentiment-bar-container">
                                                            <div className="sentiment-bar-fill" style={{ width: `${sentimentData.neutral}%`, background: 'linear-gradient(90deg, #94a3b8, #64748b)' }}></div>
                                                        </div>
                                                    </div>

                                                    {/* Negative Bar */}
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '600', color: '#991b1b' }}>
                                                            <span>😞 Negative</span>
                                                            <span>{sentimentData.negative}%</span>
                                                        </div>
                                                        <div className="sentiment-bar-container">
                                                            <div className="sentiment-bar-fill" style={{ width: `${sentimentData.negative}%`, background: 'linear-gradient(90deg, #ef4444, #dc2626)' }}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
                                                    Based on {sentimentData.total} verified reviews
                                                </div>
                                            </div>
                                        )}

                                        {/* Reviews List */}
                                        {reviews.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {reviews.map((review, index) => (
                                                    <div key={index} style={{
                                                        padding: '25px',
                                                        background: '#fff',
                                                        borderRadius: '16px',
                                                        border: '1px solid #f1f5f9',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                                        animation: `slideInRight 0.5s ease-out ${index * 0.1}s backwards`,
                                                        transition: 'transform 0.2s'
                                                    }}
                                                        className="service-card-hover"
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                                            {review.customer?.imageUrl ? (
                                                                <img
                                                                    src={review.customer.imageUrl} alt={review.customer.name}
                                                                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                                                                />
                                                            ) : (
                                                                <div style={{
                                                                    width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#475569', fontSize: '18px'
                                                                }}>
                                                                    {(review.customer?.name || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>{review.customer?.name || 'Anonymous User'}</div>
                                                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                                                    {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </div>
                                                            </div>
                                                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', padding: '6px 12px', borderRadius: '20px', border: '1px solid #ffedd5' }}>
                                                                <span style={{ color: '#f59e0b', fontSize: '14px' }}>⭐</span>
                                                                <span style={{ fontWeight: 'bold', color: '#9a3412' }}>{review.rating}</span>
                                                            </div>
                                                        </div>

                                                        <p style={{ color: '#334155', lineHeight: '1.7', margin: '0 0 15px 0', fontSize: '15px' }}>
                                                            {review.reviewText}
                                                        </p>

                                                        {review.sentiment && (
                                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                                <span style={{
                                                                    fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
                                                                    background: review.sentiment === 'positive' ? '#dcfce7' : review.sentiment === 'negative' ? '#fee2e2' : '#f1f5f9',
                                                                    color: review.sentiment === 'positive' ? '#166534' : review.sentiment === 'negative' ? '#991b1b' : '#475569',
                                                                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px'
                                                                }}>
                                                                    {review.sentiment === 'positive' ? '😊 Positive' : review.sentiment === 'negative' ? '😞 Negative' : '😐 Neutral'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                                                <div style={{ fontSize: '50px', marginBottom: '15px', animation: 'pulse 2s infinite' }}>📝</div>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>No reviews yet</h4>
                                                <p style={{ color: '#64748b', margin: 0 }}>Be the first to review this service!</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProviderProfile
