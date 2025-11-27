import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './ProviderDashboard.css'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

// Keep city/area options in sync with the mobile ProviderStuffScreen implementation
const CITY_AREA_OPTIONS = {
  Lahore: [
    'Allama Iqbal Town',
    'DHA',
    'Gulberg',
    'Johar Town',
    'Model Town',
    'Garden Town',
    'Cantt',
    'Faisal Town',
    'Valencia Town',
    'Bahria Town',
  ],
  Faisalabad: [
    'D Ground',
    'Civil Lines',
    'Peoples Colony',
    'Susan Road',
    'Samanabad',
    'Abdullah Pur',
    'Gulberg',
    'Millat Town',
    'Eden City',
    'Kohinoor City',
  ],
  Islamabad: [
    'F-6',
    'F-7',
    'F-8',
    'F-10',
    'F-11',
    'G-6',
    'G-7',
    'G-9',
    'G-10',
    'G-11',
  ],
}

const HERO_SLIDES = [
  {
    title: 'Deliver wow experiences every visit',
    subtitle: 'Stay on top of bookings, reviews, and payouts with a single glance.',
    accent: 'Live Sync',
    motif: '✨',
    gradient: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(248,113,113,0.2))',
  },
  {
    title: 'Showcase services with confidence',
    subtitle: 'Keep your catalog, rates, and availability in perfect harmony.',
    accent: 'Services',
    motif: '🛠️',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))',
  },
  {
    title: 'Celebrate happy customers',
    subtitle: 'Use reviews and sentiment to keep improving every day.',
    accent: 'Reputation',
    motif: '💬',
    gradient: 'linear-gradient(135deg, rgba(45,212,191,0.25), rgba(16,185,129,0.25))',
  },
]

const TAB_CONFIG = [
  { id: 0, label: 'Profile', icon: '👤', description: 'Account & security' },
  { id: 1, label: 'Services', icon: '🧰', description: 'Manage offerings' },
  { id: 2, label: 'Bookings', icon: '📅', description: 'Track requests' },
  { id: 3, label: 'Reviews', icon: '⭐', description: 'Customer love' },
]

const ProviderDashboard = () => {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState(0) // 0: Profile, 1: Services, 2: Bookings, 3: Reviews
  const [selectedBookingTab, setSelectedBookingTab] = useState(0) // 0: Pending, 1: Completed
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [myServices, setMyServices] = useState([])
  const [pendingBookings, setPendingBookings] = useState([])
  const [completedBookings, setCompletedBookings] = useState([])
  const [instantRequests, setInstantRequests] = useState([])

  useEffect(() => {
    if (selectedTab === 2 && userData) {
      loadBookings()
    }
  }, [selectedTab, userData])
  const [reviews, setReviews] = useState([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [sentimentData, setSentimentData] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const toastIcons = {
    success: '✨',
    error: '⚠️',
    info: 'ℹ️',
  }

  const showToast = ({ status = 'success', title = '', message = '', duration = 4000 }) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToast({ status, title, message, duration })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, duration)
  }

  const dismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    setToast(null)
  }
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTab === 1) {
      loadServices()
    } else if (selectedTab === 2) {
      loadBookings()
    } else if (selectedTab === 3) {
      loadReviews()
    }
  }, [selectedTab])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      navigate('/login')
      return
    }
    const userDataStr = localStorage.getItem('user_data')
    if (userDataStr) {
      setUserData(JSON.parse(userDataStr))
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load user profile
      const profileResponse = await apiService.get('/provider/profile')
      if (!profileResponse.error && profileResponse.data?.data) {
        // Merge user and provider data for easier access
        const profileData = {
          ...profileResponse.data.data.user,
          provider: profileResponse.data.data.provider,
        }
        setUserData(profileData)
        localStorage.setItem('user_data', JSON.stringify(profileData))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadServices = async () => {
    setIsLoadingServices(true)
    try {
      const response = await apiService.get('/provider/services')
      if (!response.error && response.data?.data) {
        // Handle both direct array and nested services array
        let services = response.data.data
        if (services.services) {
          services = services.services
        }
        setMyServices(Array.isArray(services) ? services : [])
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setIsLoadingServices(false)
    }
  }

  const loadBookings = async () => {
    setIsLoadingBookings(true)
    try {
      const activePromise = apiService.get('/provider/bookings')
      const completedPromise = apiService.get('/provider/bookings?status=completed')
      const instantPromise = apiService.get('/provider/instant-hiring/requests')

      const [activeResponse, completedResponse, instantResponse] = await Promise.all([
        activePromise,
        completedPromise,
        instantPromise
      ])

      // Handle Active Bookings
      if (activeResponse?.data?.data) {
        const activeData = activeResponse.data.data
        const activeBookings = Array.isArray(activeData?.bookings)
          ? activeData.bookings
          : (Array.isArray(activeData) ? activeData : [])

        setPendingBookings(activeBookings)
      } else {
        setPendingBookings([])
      }

      // Handle Completed Bookings
      if (completedResponse?.data?.data) {
        const completedData = completedResponse.data.data
        const completedBookingsList = Array.isArray(completedData?.bookings)
          ? completedData.bookings
          : (Array.isArray(completedData) ? completedData : [])

        setCompletedBookings(completedBookingsList)
      } else {
        setCompletedBookings([])
      }

      // Handle Instant Hiring Requests
      if (instantResponse?.data?.data) {
        const instantData = instantResponse.data.data
        const requests = Array.isArray(instantData?.requests)
          ? instantData.requests
          : (Array.isArray(instantData) ? instantData : [])

        // Filter out expired requests (older than 5 minutes)
        const now = new Date()
        const activeRequests = requests.filter(req => {
          if (!req.bookingExpiresAt) return true
          const expiresAt = new Date(req.bookingExpiresAt)
          return expiresAt > now
        })

        setInstantRequests(activeRequests)
      } else {
        setInstantRequests([])
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      setPendingBookings([])
      setCompletedBookings([])
      setInstantRequests([])
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const handleAcceptBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to accept this booking?')) return
    try {
      const response = await apiService.post(`/provider/bookings/${bookingId}/accept`, {})
      if (!response.error) {
        showToast({
          status: 'success',
          title: 'Booking accepted',
          message: 'The customer has been notified.',
        })
        loadBookings()
      } else {
        showToast({
          status: 'error',
          title: 'Unable to accept booking',
          message: response.message || 'Something went wrong. Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error accepting booking',
        message: error.message,
      })
    }
  }

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectBookingId, setRejectBookingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const openRejectModal = (bookingId) => {
    setRejectBookingId(bookingId)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectBooking = async () => {
    if (!rejectionReason.trim()) {
      showToast({
        status: 'error',
        title: 'Reason required',
        message: 'Please enter a reason for rejection.',
      })
      return
    }

    setIsRejecting(true)
    try {
      const response = await apiService.post(`/provider/bookings/${rejectBookingId}/reject`, {
        rejectionReason: rejectionReason
      })
      if (!response.error) {
        showToast({
          status: 'info',
          title: 'Booking rejected',
          message: 'The customer will be informed about the rejection.',
        })
        setShowRejectModal(false)
        loadBookings()
      } else {
        showToast({
          status: 'error',
          title: 'Unable to reject booking',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error rejecting booking',
        message: error.message,
      })
    } finally {
      setIsRejecting(false)
    }
  }

  const handleCompleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to mark this work as completed?')) return
    try {
      const response = await apiService.post(`/provider/bookings/${bookingId}/complete`, {})
      if (!response.error) {
        showToast({
          status: 'success',
          title: 'Booking completed',
          message: 'Great job! This booking is now marked as done.',
        })
        loadBookings()
      } else {
        showToast({
          status: 'error',
          title: 'Unable to complete booking',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error completing booking',
        message: error.message,
      })
    }
  }

  const handleAcceptInstantRequest = async (requestId) => {
    if (!confirm('Accept this instant booking request?')) return
    try {
      const response = await apiService.post(`/provider/instant-hiring/requests/${requestId}/accept`, {})
      if (!response.error) {
        showToast({
          status: 'success',
          title: 'Request accepted!',
          message: 'Customer has been notified.',
        })
        loadBookings()
      } else {
        showToast({
          status: 'error',
          title: 'Unable to accept',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error accepting request',
        message: error.message,
      })
    }
  }

  const handleRejectInstantRequest = async (requestId) => {
    if (!confirm('Reject this instant booking request?')) return
    try {
      const response = await apiService.post(`/provider/instant-hiring/requests/${requestId}/reject`, {})
      if (!response.error) {
        showToast({
          status: 'info',
          title: 'Request rejected',
          message: 'The request has been removed.',
        })
        loadBookings()
      } else {
        showToast({
          status: 'error',
          title: 'Unable to reject',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error rejecting request',
        message: error.message,
      })
    }
  }

  const handleRequestExpired = (requestId) => {
    setInstantRequests(prev => prev.filter(req => req.requestId !== requestId))
    showToast({
      status: 'info',
      title: 'Request Expired',
      message: 'An instant booking request has expired and was removed.',
    })
  }

  const handleBookingExpired = (bookingId) => {
    setPendingBookings(prev => prev.filter(b => (b.bookingId || b.requestId) !== bookingId))
    showToast({
      status: 'info',
      title: 'Booking Expired',
      message: 'A booking request has expired and was removed.',
    })
  }

  const loadReviews = async () => {
    setIsLoadingReviews(true)
    try {
      const providerId = userData?.provider?.providerId || userData?.providerId
      if (!providerId) {
        setIsLoadingReviews(false)
        return
      }
      const response = await apiService.get(`/providers/${providerId}/reviews`)
      if (!response.error && response.data?.data) {
        // Handle different response structures
        let reviewsData = response.data.data
        if (reviewsData.reviews) {
          reviewsData = reviewsData.reviews
        }
        // Map review data to match expected format
        const mappedReviews = Array.isArray(reviewsData) ? reviewsData.map(review => ({
          ...review,
          customerName: review.customer?.name || 'Anonymous',
          customerImage: review.customer?.imageUrl,
          comment: review.reviewText || review.comment,
          rating: review.rating || 0,
          serviceName: review.subcategoryName || 'General Service',
          createdAt: review.createdAt,
        })) : []
        setReviews(mappedReviews)

        if (response.data.data.sentimentDistribution) {
          setSentimentData(response.data.data.sentimentDistribution)
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="provider-dashboard loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="provider-dashboard">
      {toast && (
        <div className={`toast-notification ${toast.status}`}>
          <div className="toast-icon-circle">
            {toastIcons[toast.status] || toastIcons.info}
          </div>
          <div className="toast-body">
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </div>
          <button className="toast-close" onClick={dismissToast} aria-label="Dismiss notification">
            ×
          </button>
          <span
            className={`toast-progress ${toast.status}`}
            style={{ animationDuration: `${toast.duration}ms` }}
          ></span>
        </div>
      )}
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="profile-row">
              <div className="profile-section hero-profile">
                <div className="profile-image">
                  {userData?.profileImageUrl ? (
                    <img src={userData.profileImageUrl} alt="Profile" />
                  ) : (
                    <div className="profile-placeholder">
                      {userData?.name?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <h2>{userData?.name || 'Provider'}</h2>
                  <p>{userData?.email || ''}</p>
                  <div className="profile-tags">
                    <span className="profile-badge">Service Provider</span>
                    {(userData?.provider?.city || userData?.city) && (
                      <span className="profile-location">
                        📍 {(userData?.provider?.area || userData?.area || '').trim()} {(userData?.provider?.area || userData?.area) && (userData?.provider?.city || userData?.city) ? ',' : ''}
                        {' '}
                        {userData?.provider?.city || userData?.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button className="glass-btn" onClick={loadData}>
                  Sync Data
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>

            <div className="hero-showcase" style={{ background: HERO_SLIDES[activeHeroIndex].gradient }}>
              <span className="hero-pill">
                {HERO_SLIDES[activeHeroIndex].motif} {HERO_SLIDES[activeHeroIndex].accent}
              </span>
              <h1>{HERO_SLIDES[activeHeroIndex].title}</h1>
              <p>{HERO_SLIDES[activeHeroIndex].subtitle}</p>
              <div className="hero-dots">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    className={index === activeHeroIndex ? 'active' : ''}
                    onClick={() => setActiveHeroIndex(index)}
                  ></button>
                ))}
              </div>
            </div>

            <div className="hero-metrics">
              <div className="metric-card">
                <span className="metric-label">Active Services</span>
                <strong>{myServices.length}</strong>
                <p>Published offerings</p>
              </div>
              <div className="metric-card">
                <span className="metric-label">Pending Bookings</span>
                <strong>{pendingBookings.length}</strong>
                <p>Need your action</p>
              </div>
              <div className="metric-card">
                <span className="metric-label">Completed</span>
                <strong>{completedBookings.length}</strong>
                <p>Finished jobs</p>
              </div>
              <div className="metric-card">
                <span className="metric-label">Reviews</span>
                <strong>{reviews.length}</strong>
                <p>Customer love</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="floating-card">
              <p>Sentiment</p>
              <h3>{sentimentData?.positive ? `${sentimentData.positive}%` : 'N/A'}</h3>
              <span>Positive feedback</span>
            </div>
            <div className="floating-orb orb-one"></div>
            <div className="floating-orb orb-two"></div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar modern">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            className={`tab-card ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <div className="tab-icon-wrapper">{tab.icon}</div>
            <div className="tab-meta">
              <span className="tab-title">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </div>
            {tab.id === 2 && (pendingBookings.length + instantRequests.length) > 0 && (
              <span className="tab-badge">{pendingBookings.length + instantRequests.length}</span>
            )}
            <span className="tab-chevron">→</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {selectedTab === 0 && <ProfileTab userData={userData} onDataUpdate={loadData} showToast={showToast} />}
        {selectedTab === 1 && (
          <ServicesTab
            services={myServices}
            isLoading={isLoadingServices}
            onRefresh={loadServices}
            showToast={showToast}
          />
        )}
        {selectedTab === 2 && (
          <BookingsTab
            pendingBookings={pendingBookings}
            completedBookings={completedBookings}
            instantRequests={instantRequests}
            selectedBookingTab={selectedBookingTab}
            onTabChange={setSelectedBookingTab}
            isLoading={isLoadingBookings}
            onRefresh={loadBookings}
            onAccept={handleAcceptBooking}
            onReject={openRejectModal}
            onComplete={handleCompleteBooking}
            onAcceptInstant={handleAcceptInstantRequest}
            onRejectInstant={handleRejectInstantRequest}
            onExpireInstant={handleRequestExpired}
            onExpireBooking={handleBookingExpired}
          />
        )}
        {selectedTab === 3 && (
          <ReviewsTab
            reviews={reviews}
            isLoading={isLoadingReviews}
            onRefresh={loadReviews}
            sentimentData={sentimentData}
          />
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Booking</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Please provide a reason for rejecting this booking. This will be shared with the customer.
              </p>
              <textarea
                className="form-textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Schedule conflict, Service not available in this area..."
                rows="4"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleRejectBooking}
                disabled={!rejectionReason.trim() || isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Profile Tab Component
const ProfileTab = ({ userData, onDataUpdate, showToast }) => {
  const resolveCity = () => userData?.provider?.city || userData?.city || ''
  const resolveArea = () => userData?.provider?.area || userData?.area || ''

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [isSavingInfo, setIsSavingInfo] = useState(false)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    name: userData?.name || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
  })

  const [locationData, setLocationData] = useState({
    city: resolveCity(),
    area: resolveArea(),
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const imageInputRef = useRef(null)

  useEffect(() => {
    setFormData({
      name: userData?.name || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
    })
    setLocationData({
      city: resolveCity(),
      area: resolveArea(),
    })
  }, [userData])

  const resetPersonalForm = () => {
    setFormData({
      name: userData?.name || '',
      phone: userData?.phone || '',
      address: userData?.address || '',
    })
  }

  const resetLocationForm = () => {
    setLocationData({
      city: resolveCity(),
      area: resolveArea(),
    })
  }

  const areaOptions = locationData.city ? (CITY_AREA_OPTIONS[locationData.city] || []) : []
  const isPasswordFormValid =
    passwordData.currentPassword &&
    passwordData.newPassword &&
    passwordData.newPassword === passwordData.confirmPassword

  const handleInfoSave = async () => {
    setIsSavingInfo(true)
    try {
      const response = await apiService.put('/provider/profile', {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      })

      if (!response.error) {
        setIsEditingInfo(false)
        onDataUpdate()
        showToast({
          status: 'success',
          title: 'Profile updated',
          message: 'Your personal information has been saved.',
        })
      } else {
        showToast({
          status: 'error',
          title: 'Update failed',
          message: response.message || 'Could not update profile information.',
        })
      }
    } catch (error) {
      console.error('Error updating profile information:', error)
      showToast({
        status: 'error',
        title: 'Update error',
        message: 'Unable to update profile information right now.',
      })
    } finally {
      setIsSavingInfo(false)
    }
  }

  const handleLocationSave = async () => {
    if (!locationData.city || !locationData.area) {
      showToast({
        status: 'error',
        title: 'Missing location',
        message: 'Please select both a city and an area.',
      })
      return
    }

    setIsSavingLocation(true)
    try {
      const response = await apiService.put('/provider/profile', {
        city: locationData.city,
        area: locationData.area,
      })

      if (!response.error) {
        setIsEditingLocation(false)
        onDataUpdate()
        showToast({
          status: 'success',
          title: 'Location updated',
          message: `${locationData.area}, ${locationData.city}`,
        })
      } else {
        showToast({
          status: 'error',
          title: 'Location update failed',
          message: response.message || 'Failed to update your location.',
        })
      }
    } catch (error) {
      console.error('Error updating location:', error)
      showToast({
        status: 'error',
        title: 'Update error',
        message: 'Unable to update location right now.',
      })
    } finally {
      setIsSavingLocation(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast({
        status: 'error',
        title: 'Missing fields',
        message: 'Please fill in all password fields.',
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      showToast({
        status: 'error',
        title: 'Password too short',
        message: 'New password must be at least 6 characters long.',
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast({
        status: 'error',
        title: 'Passwords do not match',
        message: 'New password and confirm password must match.',
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await apiService.put('/provider/profile', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })

      if (!response.error) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        showToast({
          status: 'success',
          title: 'Password updated',
          message: 'Your password was updated successfully.',
        })
      } else {
        showToast({
          status: 'error',
          title: 'Unable to update password',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      showToast({
        status: 'error',
        title: 'Update error',
        message: 'Unable to update password right now.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast({
        status: 'error',
        title: 'Invalid file',
        message: 'Please select a valid image file.',
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast({
        status: 'error',
        title: 'File too large',
        message: 'Please choose an image smaller than 2MB.',
      })
      return
    }

    try {
      setIsUploadingImage(true)
      const dataUrl = await fileToDataUrl(file)
      const response = await apiService.put('/provider/profile', {
        profileImage: dataUrl,
      })

      if (!response.error) {
        onDataUpdate()
        showToast({
          status: 'success',
          title: 'Profile photo updated',
          message: 'Looking sharp! Your new photo is live.',
        })
      } else {
        showToast({
          status: 'error',
          title: 'Photo update failed',
          message: response.message || 'Failed to update profile photo.',
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      showToast({
        status: 'error',
        title: 'Upload error',
        message: 'Unable to update profile photo right now.',
      })
    } finally {
      setIsUploadingImage(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  return (
    <div className="profile-tab">
      <div className="profile-grid">
        <div className="profile-card elevated-card">
          <div className="card-header">
            <div>
              <h3>Personal Details</h3>
              <p className="card-description">Keep your name and phone number in sync with the provider mobile app.</p>
            </div>
            <div className="card-actions">
              {!isEditingInfo ? (
                <button className="btn-ghost" onClick={() => setIsEditingInfo(true)}>
                  Edit
                </button>
              ) : (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      resetPersonalForm()
                      setIsEditingInfo(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleInfoSave} disabled={isSavingInfo}>
                    {isSavingInfo ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="two-column-form">
            <div className="avatar-uploader">
              <div className="avatar-preview">
                {userData?.profileImageUrl ? (
                  <img src={userData.profileImageUrl} alt="Profile avatar" />
                ) : (
                  <span>{userData?.name?.charAt(0)?.toUpperCase() || 'P'}</span>
                )}
              </div>
              <div className="avatar-actions">
                <div>
                  <strong>Profile Photo</strong>
                  <p>Use a clear photo so customers recognize you</p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditingInfo}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={userData?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditingInfo}
              />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditingInfo}
              />
            </div>
          </div>
        </div>

        <div className="profile-card elevated-card location-card">
          <div className="card-header">
            <div>
              <h3>Service City & Area</h3>
              <p className="card-description">Use the same locations that exist in the database so mobile and web stay aligned.</p>
            </div>
            <div className="card-actions">
              {!isEditingLocation ? (
                <button className="btn-ghost" onClick={() => setIsEditingLocation(true)}>
                  Change
                </button>
              ) : (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      resetLocationForm()
                      setIsEditingLocation(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleLocationSave}
                    disabled={isSavingLocation || !locationData.city || !locationData.area}
                  >
                    {isSavingLocation ? 'Saving...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="location-summary">
            <span className="pill-badge primary">{locationData.city || 'City not set'}</span>
            <span className="pill-badge neutral">{locationData.area || 'Area not set'}</span>
          </div>

          <div className="two-column-form">
            <div className="form-group">
              <label>Select City</label>
              <select
                className="form-select"
                value={locationData.city}
                onChange={(e) => setLocationData({ city: e.target.value, area: '' })}
                disabled={!isEditingLocation}
              >
                <option value="">Choose city</option>
                {Object.keys(CITY_AREA_OPTIONS).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Area</label>
              <select
                className="form-select"
                value={locationData.area}
                onChange={(e) => setLocationData({ ...locationData, area: e.target.value })}
                disabled={!isEditingLocation || !locationData.city}
              >
                <option value="">{locationData.city ? 'Choose area' : 'Pick city first'}</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="form-note">These options mirror the ProviderStuffScreen so both platforms store identical location values.</p>
        </div>

        <div className="profile-card elevated-card security-card">
          <div className="card-header stretch">
            <div>
              <h3>Change Password</h3>
              <p className="card-description">Set a fresh password to keep your provider account secure.</p>
            </div>
          </div>
          <div className="two-column-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <div className="card-actions align-end">
            <button
              className="btn-secondary"
              onClick={() =>
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                })
              }
            >
              Reset
            </button>
            <button
              className="btn-primary"
              onClick={handlePasswordChange}
              disabled={!isPasswordFormValid || isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Services Tab Component
const ServicesTab = ({ services, isLoading, onRefresh, showToast }) => {
  // Load categories when the Services tab mounts
  useEffect(() => {
    loadCategories();
  }, []);
  const [showAddModal, setShowAddModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [hourlyRate, setHourlyRate] = useState('')
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (showAddModal) {
      loadCategories()
      // Reset selections when modal opens
      setSelectedCategory(null)
      setSubcategories([])
      setSelectedSubcategory(null)
      setHourlyRate('')
    }
  }, [showAddModal])

  const loadCategories = async () => {
    setIsLoadingCategories(true)
    try {
      // Use the public categories endpoint which includes subcategories, same as mobile app
      const response = await apiService.get('/categories?includeSubcategories=true')
      if (!response.error && response.data?.data) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      showToast({
        status: 'error',
        title: 'Unable to load categories',
        message: 'Please try again in a moment.',
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }



  const handleCategoryChange = (e) => {
    const categoryId = parseInt(e.target.value)
    if (categoryId) {
      const category = categories.find(cat => cat.categoryId === categoryId)
      setSelectedCategory(category)
      // Subcategories are already included in the category object
      setSubcategories(category?.subcategories || [])
      setSelectedSubcategory(null)
      setHourlyRate('')
    } else {
      setSelectedCategory(null)
      setSubcategories([])
      setSelectedSubcategory(null)
      setHourlyRate('')
    }
  }

  const handleSubcategoryChange = (e) => {
    const subcategoryId = parseInt(e.target.value)
    if (subcategoryId) {
      const subcategory = subcategories.find(sub => sub.subcategoryId === subcategoryId)
      setSelectedSubcategory(subcategory)
    } else {
      setSelectedSubcategory(null)
    }
  }

  const handleAddService = async () => {
    if (!selectedSubcategory || !hourlyRate || parseFloat(hourlyRate) <= 0) {
      showToast({
        status: 'error',
        title: 'Missing details',
        message: 'Please select a service and enter a valid hourly rate.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiService.post('/provider/services', {
        subcategoryId: selectedSubcategory.subcategoryId,
        hourlyRate: parseFloat(hourlyRate)
      })

      if (!response.error) {
        setShowAddModal(false)
        setSelectedCategory(null)
        setSubcategories([])
        setSelectedSubcategory(null)
        setHourlyRate('')
        onRefresh()
        showToast({
          status: 'success',
          title: 'Service added',
          message: 'Your new service is live.',
        })
      } else {
        showToast({
          status: 'error',
          title: 'Unable to add service',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error adding service',
        message: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditService = async (serviceId, currentRate) => {
    const newRate = prompt('Enter new hourly rate:', currentRate)
    if (!newRate || parseFloat(newRate) <= 0) return

    try {
      const response = await apiService.put(`/provider/services/${serviceId}`, {
        hourlyRate: parseFloat(newRate)
      })

      if (!response.error) {
        onRefresh()
        showToast({
          status: 'success',
          title: 'Service updated',
          message: 'Hourly rate updated successfully.',
        })
      } else {
        showToast({
          status: 'error',
          title: 'Update failed',
          message: response.message || 'Unable to update service.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error updating service',
        message: error.message,
      })
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await apiService.delete(`/provider/services/${serviceId}`)
      if (!response.error) {
        onRefresh()
        showToast({
          status: 'info',
          title: 'Service removed',
          message: 'This service is no longer visible to customers.',
        })
      } else {
        showToast({
          status: 'error',
          title: 'Unable to delete service',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Error deleting service',
        message: error.message,
      })
    }
  }

  return (
    <div className="services-tab">
      <div className="services-header">
        <h2>My Services</h2>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          Add Service
        </button>
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Service</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {isLoadingCategories ? (
                <div className="loading-state">Loading categories...</div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Category *</label>
                    <select
                      className="form-select"
                      value={selectedCategory?.categoryId || ''}
                      onChange={handleCategoryChange}
                    >
                      <option value="">Choose a category...</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <div className="form-group">
                      <label>Select Service *</label>
                      <select
                        className="form-select"
                        value={selectedSubcategory?.subcategoryId || ''}
                        onChange={handleSubcategoryChange}
                      >
                        <option value="">Choose a service...</option>
                        {subcategories.map(subcategory => (
                          <option key={subcategory.subcategoryId} value={subcategory.subcategoryId}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedSubcategory && (
                    <div className="form-group">
                      <label>Hourly Rate (Rs) *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="Enter hourly rate"
                        min="0"
                        step="0.01"
                      />
                      {selectedSubcategory.minPrice && selectedSubcategory.maxPrice && (
                        <small className="form-hint">
                          Suggested: Rs {selectedSubcategory.minPrice} - Rs {selectedSubcategory.maxPrice}
                        </small>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAddService}
                disabled={!selectedSubcategory || !hourlyRate || isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services List */}
      {isLoading ? (
        <div className="loading-state">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <p>No services added yet</p>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            Add Your First Service
          </button>
        </div>
      ) : (
        <div className="services-list">
          {services.map((service, index) => (
            <div key={service.serviceId || index} className="service-card">
              <div className="service-info">
                <h3>{service.subcategoryName || service.name || 'Service'}</h3>
                <p className="service-rate">Rs {service.hourlyRate || service.rate || 0}/hour</p>
                {service.categoryName && (
                  <p className="service-category">{service.categoryName}</p>
                )}
              </div>
              <div className="service-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEditService(service.serviceId, service.hourlyRate || service.rate)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteService(service.serviceId)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Bookings Tab Component
const BookingsTab = ({
  pendingBookings,
  completedBookings,
  instantRequests,
  selectedBookingTab,
  onTabChange,
  isLoading,
  onAccept,
  onReject,
  onComplete,
  onAcceptInstant,
  onRejectInstant,
  onExpireInstant,
  onExpireBooking
}) => {
  const currentBookings = selectedBookingTab === 0 ? pendingBookings : completedBookings
  const bookings = Array.isArray(currentBookings) ? currentBookings : []
  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState('customer')
  const [filterDate, setFilterDate] = useState('')
  const [featuredBooking, setFeaturedBooking] = useState(null)

  const normalizedTerm = searchTerm.trim().toLowerCase()

  const matchesSearch = (booking) => {
    if (!normalizedTerm) return true

    const bookingId = (booking.bookingId || booking.requestId || '').toString()
    const customerName = booking.customer?.name || ''
    const serviceName = booking.service?.subcategory?.name || booking.serviceName || ''
    const address = booking.serviceAddress || ''

    switch (searchField) {
      case 'service':
        return serviceName.toLowerCase().includes(normalizedTerm)
      case 'id':
        return bookingId.toLowerCase().includes(normalizedTerm)
      case 'location':
        return address.toLowerCase().includes(normalizedTerm)
      case 'customer':
      default:
        return customerName.toLowerCase().includes(normalizedTerm)
    }
  }

  const matchesDate = (booking) => {
    if (!filterDate) return true
    if (!booking.requestedDateTime) return false
    const bookingDate = new Date(booking.requestedDateTime).toISOString().split('T')[0]
    return bookingDate === filterDate
  }

  const filteredBookings = bookings.filter((booking) => matchesSearch(booking) && matchesDate(booking))
  const isFiltering = Boolean(normalizedTerm || filterDate)

  useEffect(() => {
    if (selectedBookingTab === 1) {
      let highest = null
      let maxAmount = 0
      completedBookings.forEach((booking) => {
        if (!booking) return
        const amount = booking.payments && booking.payments.length > 0
          ? Number(booking.payments[0].amount) || 0
          : Number(booking.totalAmount) || 0
        if (amount >= maxAmount) {
          highest = { booking, amount }
          maxAmount = amount
        }
      })
      setFeaturedBooking(highest)
    } else {
      setFeaturedBooking(null)
    }
  }, [completedBookings, selectedBookingTab])

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterDate('')
  }

  return (
    <div className="bookings-tab">
      <div className="bookings-toggle">
        <button
          className={`toggle-btn ${selectedBookingTab === 0 ? 'active' : ''}`}
          onClick={() => onTabChange(0)}
        >
          To Be
          {(pendingBookings.length + instantRequests.length) > 0 && (
            <span className="inner-badge">{pendingBookings.length + instantRequests.length}</span>
          )}
        </button>
        <button
          className={`toggle-btn ${selectedBookingTab === 1 ? 'active' : ''}`}
          onClick={() => onTabChange(1)}
        >
          Completed
        </button>
      </div>
      {selectedBookingTab === 1 && featuredBooking && (
        <div className="featured-booking-card">
          <div className="featured-header">
            <div className="featured-tag">
              <span>💎</span>
              Top Earning Booking
            </div>
            <span className="featured-date">
              {featuredBooking.booking.completedAt
                ? new Date(featuredBooking.booking.completedAt).toLocaleDateString()
                : new Date(featuredBooking.booking.requestedDateTime).toLocaleDateString()}
            </span>
          </div>
          <div className="featured-body">
            <div className="featured-info">
              <h3>{featuredBooking.booking.customer?.name || 'Unknown customer'}</h3>
              <p>{featuredBooking.booking.service?.subcategory?.name || featuredBooking.booking.serviceName || 'Service'}</p>
              <span>{featuredBooking.booking.serviceAddress || 'No address provided'}</span>
            </div>
            <div className="featured-amount">
              <span>Total Earned</span>
              <strong>Rs {featuredBooking.amount.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}
      <div className="booking-filters-card">
        <div className="filter-badges">
          <span className="filter-pill">{selectedBookingTab === 0 ? 'Active queue' : 'Completed history'}</span>
          {filterDate && (
            <span className="filter-pill soft">Date: {new Date(filterDate).toLocaleDateString()}</span>
          )}
          {searchTerm && (
            <span className="filter-pill soft">
              {searchField.charAt(0).toUpperCase() + searchField.slice(1)}: "{searchTerm}"
            </span>
          )}
        </div>
        <div className="filter-controls">
          <div className="search-input-wrapper">
            <span className="filter-icon">🔍</span>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="customer">Customer</option>
            <option value="service">Service</option>
            <option value="location">Location</option>
            <option value="id">Booking ID</option>
          </select>
          <div className="date-input-wrapper">
            <span className="filter-icon">📅</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <button className="filter-reset" onClick={handleClearFilters} disabled={!searchTerm && !filterDate}>
            Reset
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="loading-state">Loading bookings...</div>
      ) : filteredBookings.length === 0 && (!instantRequests || instantRequests.length === 0 || selectedBookingTab !== 0) ? (
        <div className="empty-state">
          <p>
            {isFiltering
              ? 'No bookings match your search filters.'
              : `No ${selectedBookingTab === 0 ? 'pending' : 'completed'} bookings`}
          </p>
        </div>
      ) : (
        <div className="bookings-list">
          {/* Instant Requests (only in "To Be" tab) */}
          {selectedBookingTab === 0 && instantRequests && instantRequests.length > 0 && (
            <>
              {instantRequests.map((request, index) => (
                <InstantRequestCard
                  key={request.requestId || index}
                  request={request}
                  onAccept={onAcceptInstant}
                  onReject={onRejectInstant}
                  onExpire={onExpireInstant}
                />
              ))}
            </>
          )}

          {/* Regular Bookings */}
          {filteredBookings.map((booking, index) => {
            if (!booking) return null

            const isCompleted = selectedBookingTab === 1
            const customerName = booking.customer?.name || 'Unknown Customer'
            const customerImage = booking.customer?.imageUrl
            const serviceName = booking.service?.subcategory?.name || booking.serviceName || 'Unknown Service'
            const requestedDate = booking.requestedDateTime
              ? new Date(booking.requestedDateTime).toLocaleDateString()
              : 'Date not available'

            let amount = 0
            if (booking.payments && booking.payments.length > 0) {
              amount = Number(booking.payments[0].amount) || 0
            } else {
              amount = Number(booking.totalAmount) || 0
            }

            const serviceAddress = booking.serviceAddress || ''
            const estimatedHours = Number(booking.durationHours) || 0
            const hourlyRate = Number(booking.hourlyRate || booking.service?.hourlyRate) || 0
            const totalForHours = Number(booking.totalAmount) || amount
            const calculatedHours = hourlyRate > 0 ? totalForHours / hourlyRate : 0
            const displayHours = estimatedHours > 0 ? estimatedHours : calculatedHours
            const customerNotes = booking.customerNotes || ''
            const status = booking.status || 'pending'
            const bookingId = booking.bookingId || booking.requestId

            return (
              <div key={bookingId || index} className={`booking-card ${isCompleted ? 'completed' : ''}`}>
                <div className="booking-header">
                  <div className="customer-info">
                    <div className="customer-avatar">
                      {customerImage ? (
                        <img src={customerImage} alt={customerName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="customer-details">
                      <h4>{customerName}</h4>
                      <p className="service-name">{serviceName}</p>
                    </div>
                  </div>
                  <div className="status-wrapper">
                    {booking.requestType === 'booking' && (
                      <span className="type-badge scheduled">📅 Scheduled</span>
                    )}
                    {status === 'pending' && booking.bookingExpiresAt && (
                      <BookingTimer
                        expiresAt={booking.bookingExpiresAt}
                        onExpire={() => onExpireBooking && onExpireBooking(bookingId)}
                      />
                    )}
                    <div className={`status-badge status-${status}`}>
                      {isCompleted ? 'Completed' : (status === 'booking_accepted' ? 'Accepted' : 'Pending')}
                    </div>
                  </div>
                </div>

                <div className="booking-body">
                  <div className="info-row">
                    <div className="info-item">
                      <span className="icon">📅</span>
                      <span>{requestedDate}</span>
                    </div>
                    <div className="info-item price">
                      <span className="icon">💰</span>
                      <span>Rs {amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {serviceAddress && (
                    <div className="info-row address">
                      <span className="icon">📍</span>
                      <span>{serviceAddress}</span>
                    </div>
                  )}

                  {displayHours > 0 && (
                    <div className="info-row">
                      <span className="icon">⏱️</span>
                      <span>
                        {isCompleted ? 'Hours Worked' : 'Estimated Duration'}: {displayHours.toFixed(1)} {displayHours === 1 ? 'hour' : 'hours'}
                      </span>
                    </div>
                  )}

                  {customerNotes && (
                    <div className="special-instructions">
                      <div className="instruction-header">
                        <span className="icon">📝</span>
                        <span>Special Instructions</span>
                      </div>
                      <p>{customerNotes}</p>
                    </div>
                  )}
                </div>

                {!isCompleted && (
                  <div className="booking-actions">
                    {status === 'pending' && (
                      <>
                        <button
                          className="btn-reject"
                          onClick={() => onReject(bookingId)}
                        >
                          Reject
                        </button>
                        <button
                          className="btn-accept"
                          onClick={() => onAccept(bookingId)}
                        >
                          Accept
                        </button>
                      </>
                    )}
                    {status === 'booking_accepted' && (
                      <button
                        className="btn-complete"
                        onClick={() => onComplete(bookingId)}
                      >
                        <span className="icon">✅</span>
                        Mark Work Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Reviews Tab Component
const ReviewsTab = ({ reviews, isLoading, onRefresh, sentimentData }) => {
  const filteredReviews = reviews
  const chartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          sentimentData?.positive || 0,
          sentimentData?.neutral || 0,
          sentimentData?.negative || 0,
        ],
        backgroundColor: [
          '#10B981', // Green
          '#F59E0B', // Yellow
          '#EF4444', // Red
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.raw}%`
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 2000,
      easing: 'easeOutQuart'
    },
    maintainAspectRatio: false,
  }

  return (
    <div className="reviews-tab">
      <h2>Reviews & Sentiment</h2>

      {isLoading ? (
        <div className="loading-state">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <p>No reviews yet</p>
        </div>
      ) : (
        <>
          {sentimentData && (
            <div className="sentiment-section animated-card">
              <div className="chart-container">
                <div className="chart-wrapper">
                  <Doughnut data={chartData} options={chartOptions} />
                  <div className="chart-center-text">
                    <span className="total-score">
                      {sentimentData.positive}%
                    </span>
                    <span className="label">Positive</span>
                  </div>
                </div>
                <div className="sentiment-stats">
                  <div className="stat-item">
                    <span className="dot positive"></span>
                    <span className="stat-label">Positive</span>
                    <span className="stat-value">{sentimentData.positive}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="dot neutral"></span>
                    <span className="stat-label">Neutral</span>
                    <span className="stat-value">{sentimentData.neutral}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="dot negative"></span>
                    <span className="stat-label">Negative</span>
                    <span className="stat-value">{sentimentData.negative}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredReviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews in this segment yet.</p>
            </div>
          ) : (
            <div className="review-carousel">
              {filteredReviews.map((review, index) => (
                <div
                  key={index}
                  className="review-card animated-card slider-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="review-header">
                    <div className="review-user-info">
                      <div className="review-avatar">
                        {review.customerImage ? (
                          <img src={review.customerImage} alt={review.customerName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {review.customerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="review-meta">
                        <h4>{review.customerName || 'Anonymous'}</h4>
                        <span className="service-tag">{review.serviceName}</span>
                      </div>
                    </div>
                    <div className="review-right">
                      <span className={`sentiment-badge ${review.sentiment}`}>
                        {review.sentiment === 'positive' ? '😊' : review.sentiment === 'negative' ? '😞' : '😐'}
                      </span>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="review-content">
                    <p className="review-comment">"{review.comment || 'No comment'}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Reusable Timer Component
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
    <div className="booking-timer">
      <span className="timer-icon">⏳</span>
      <span className="timer-text">Expires in {formatTime(timeLeft)}</span>
    </div>
  )
}

// Instant Request Card Component with Timer
const InstantRequestCard = ({ request, onAccept, onReject, onExpire }) => {
  const customerName = request.customer?.name || 'Customer'
  const customerImage = request.customer?.imageUrl
  const serviceName = request.subcategoryName || 'Service'
  const address = request.serviceAddress || 'No address'
  const amount = Number(request.totalAmount) || 0
  const distance = request.distance || 'Unknown distance'

  return (
    <div className="instant-request-card">
      <div className="instant-header">
        <div className="instant-badge">⚡ Instant Request</div>
        <BookingTimer
          expiresAt={request.bookingExpiresAt}
          onExpire={() => onExpire(request.requestId)}
        />
      </div>

      <div className="instant-body">
        <div className="customer-section">
          <div className="customer-avatar">
            {customerImage ? (
              <img src={customerImage} alt={customerName} />
            ) : (
              <div className="avatar-placeholder">{customerName.charAt(0)}</div>
            )}
          </div>
          <div className="customer-info">
            <h4>{customerName}</h4>
            <p>{serviceName}</p>
          </div>
        </div>

        <div className="request-details">
          <div className="detail-item">
            <span className="icon">📍</span>
            <span>{address}</span>
          </div>
          <div className="detail-item">
            <span className="icon">💰</span>
            <span>Rs {amount.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="icon">📏</span>
            <span>{distance}</span>
          </div>
        </div>
      </div>

      <div className="instant-actions">
        <button className="btn-reject" onClick={() => onReject(request.requestId)}>
          Reject
        </button>
        <button className="btn-accept" onClick={() => onAccept(request.requestId)}>
          Accept Now
        </button>
      </div>
    </div>
  )
}


export default ProviderDashboard
