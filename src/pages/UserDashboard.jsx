import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import ChatbotModal from '../components/ChatbotModal'
import './UserDashboard.css'

const activeStatuses = ['pending', 'booking_accepted', 'payment_pending', 'payment_confirmed', 'booked', 'in_progress']
const completedStatuses = ['completed']

const statusLabels = {
  pending: 'Pending',
  booking_accepted: 'Awaiting Payment',
  payment_pending: 'Payment Pending',
  payment_confirmed: 'Payment Confirmed',
  booked: 'Booked',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
}

const quickActions = [
  {
    title: 'Instant Booking',
    description: 'Need help right away? Create a lightning-fast request.',
    cta: 'Book now',
    icon: '⚡',
    path: '/instant-booking',
  },
  {
    title: 'Track Requests',
    description: 'See every booking, payment, and approval in one place.',
    cta: 'View timeline',
    icon: '🗂️',
    path: '#bookings',
  },
  {
    title: 'Support Chat',
    description: 'Talk to our concierge team about any booking.',
    cta: 'Start chat',
    icon: '💬',
    path: '#chatbot',
  },
]

const testimonials = [
  '"Loved the punctual service! Will book again soon."',
  '"Tracking my bookings is so much easier now."',
  '"Fast support and verified professionals every time."',
]

const FALLBACK_LEADERBOARD = [
  { userId: 'peer-1', name: 'Ayesha Khan', totalSpend: 235000 },
  { userId: 'peer-2', name: 'Sameer Iqbal', totalSpend: 189500 },
  { userId: 'peer-3', name: 'Nimra Shah', totalSpend: 158250 },
  { userId: 'peer-4', name: 'Bilal Raza', totalSpend: 126400 },
  { userId: 'peer-5', name: 'Kiran Malik', totalSpend: 98500 },
  { userId: 'peer-6', name: 'Umair Siddiqui', totalSpend: 74200 },
]

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
    <div className="timer-badge" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.25rem 0.6rem',
      background: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fecaca',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      marginTop: '0.5rem'
    }}>
      <span>⏳ {formatTime(timeLeft)}</span>
    </div>
  )
}

const UserDashboard = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [bookings, setBookings] = useState([])
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isBookingsLoading, setIsBookingsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false)
  const [showAllBookings, setShowAllBookings] = useState(false)
  const [spendInsights, setSpendInsights] = useState(null)
  const [hasRemoteSpendInsights, setHasRemoteSpendInsights] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [reviews, setReviews] = useState([])
  const [isReviewsLoading, setIsReviewsLoading] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const imageInputRef = useRef(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null)
  const [reviewFormData, setReviewFormData] = useState({
    reviewText: ''
  })
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCancelling, setIsCancelling] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const notifications = useMemo(() => {
    const notifs = []

    // Booking Accepted Notifications
    bookings.filter(b => b.status === 'booking_accepted').forEach(b => {
      notifs.push({
        type: 'accepted',
        message: `Your booking for ${b.subcategoryName || b.serviceName} has been accepted. Please proceed to payment.`,
        time: formatDate(b.statusUpdatedAt || b.updatedAt),
        icon: '✅'
      })
    })

    // Work Completed Notifications
    bookings.filter(b => b.status === 'completed').forEach(b => {
      // Only show if recently completed (e.g., within last 24 hours) or unreviewed? 
      // For now, showing all completed as notifications might be too much, 
      // but user asked for "if provider clicks that need to be send to user".
      // Let's limit to recent ones or just show them.
      notifs.push({
        type: 'completed',
        message: `Work for ${b.subcategoryName || b.serviceName} has been marked as completed.`,
        time: formatDate(b.statusUpdatedAt || b.updatedAt),
        icon: '🎉'
      })
    })

    // Expired Notifications
    bookings.filter(b => b.status === 'expired').forEach(b => {
      notifs.push({
        type: 'expired',
        message: `Your booking request for ${b.subcategoryName || b.serviceName} has expired.`,
        time: formatDate(b.statusUpdatedAt || b.updatedAt),
        icon: '⚠️'
      })
    })

    // Sort by time (newest first) - assuming time string is comparable or we parse it
    return notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [bookings])

  const quickTextOptions = [
    'Good service',
    'Excellent work',
    'Very professional',
    'Highly recommended',
    'Great experience',
    'Will hire again',
    'On time',
    'Quality work',
  ]

  const showToast = ({ status = 'info', title = '', message = '', duration = 3500 }) => {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      navigate('/login')
      return
    }

    const storedUser = localStorage.getItem('user_data')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed.role && parsed.role !== 'customer') {
          navigate('/provider/dashboard')
          return
        }
      } catch {
        // ignore parse errors
      }
    }

    fetchProfile()
    fetchBookings()
    fetchReviews()
    fetchSpendLeaderboard()

    // Poll for booking updates every 5 seconds
    const bookingPoll = setInterval(() => fetchBookings(true), 5000)

    // Prevent browser back button - show logout confirmation instead
    const handlePopState = (event) => {
      event.preventDefault()
      const confirmLogout = window.confirm('Do you want to logout? Press OK to logout or Cancel to stay on this page.')
      if (confirmLogout) {
        // Assuming handleLogout is defined elsewhere or will be added.
        // For now, we'll just navigate to login and clear token.
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        navigate('/login')
      } else {
        // Push state again to prevent navigation
        window.history.pushState(null, '', window.location.pathname)
      }
    }

    // Push initial state
    window.history.pushState(null, '', window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => {
      clearInterval(bookingPoll)
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const fetchProfile = async () => {
    setIsProfileLoading(true)
    try {
      const response = await apiService.get('/customer/profile')
      if (!response.error && response.data?.data) {
        setProfile(response.data.data)
        localStorage.setItem('user_data', JSON.stringify(response.data.data))
      } else {
        showToast({
          status: 'error',
          title: 'Unable to load profile',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Profile error',
        message: error.message || 'Something went wrong.',
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const fetchBookings = async (isBackground = false) => {
    const showLoading = isBackground !== true
    if (showLoading) setIsBookingsLoading(true)
    try {
      const response = await apiService.get('/customer/booking/requests')
      if (!response.error && response.data?.data?.bookings) {
        setBookings(response.data.data.bookings)
      } else {
        showToast({
          status: 'error',
          title: 'Unable to load bookings',
          message: response.message || 'Please try again.',
        })
      }
    } catch (error) {
      showToast({
        status: 'error',
        title: 'Bookings error',
        message: error.message || 'Something went wrong.',
      })
    } finally {
      if (showLoading) setIsBookingsLoading(false)
    }
  }

  const fetchSpendLeaderboard = async () => {
    setIsLeaderboardLoading(true)
    try {
      const response = await apiService.get('/customer/insights/spend-leaderboard')
      if (!response.error && response.data?.data?.leaders?.length) {
        const leaders = response.data.data.leaders
        setLeaderboard(leaders)

        if (response.data.data.viewer) {
          const viewer = response.data.data.viewer
          setSpendInsights({
            lifetimeSpend: Number(viewer.lifetimeSpend || 0),
            rank: viewer.rank,
            totalUsers: viewer.totalCustomers,
            percentile: viewer.percentile,
            nextTarget: viewer.nextTarget,
            board: leaders.slice(0, 5),
          })
          setHasRemoteSpendInsights(true)
        } else {
          setHasRemoteSpendInsights(false)
        }
        return
      }
      setHasRemoteSpendInsights(false)
    } catch {
      setHasRemoteSpendInsights(false)
      // Fallback handled below
    } finally {
      setIsLeaderboardLoading(false)
    }
  }

  const persistedLifetimeSpend =
    typeof profile?.totalSpent === 'number' ? Number(profile.totalSpent) : null

  const stats = useMemo(() => {
    const now = new Date()
    const upcoming = bookings.filter((booking) => {
      if (!booking.requestedDateTime) return false
      const bookingDate = new Date(booking.requestedDateTime)
      return bookingDate >= now && booking.status !== 'completed' && booking.status !== 'cancelled'
    })
    const active = bookings.filter((booking) => activeStatuses.includes(booking.status))
    const completed = bookings.filter((booking) => completedStatuses.includes(booking.status))
    const pendingPayment = bookings.filter((booking) => booking.status === 'payment_pending')
    const calculatedSpend = completed.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)

    return {
      upcomingCount: upcoming.length,
      activeCount: active.length,
      completedCount: completed.length,
      pendingPaymentCount: pendingPayment.length,
      totalSpend: typeof persistedLifetimeSpend === 'number' ? persistedLifetimeSpend : calculatedSpend,
      calculatedSpend,
    }
  }, [bookings, persistedLifetimeSpend])

  const nextBooking = useMemo(() => {
    const futureBookings = bookings
      .filter((booking) => booking.requestedDateTime && booking.status !== 'completed' && booking.status !== 'cancelled')
      .map((booking) => ({
        ...booking,
        requestedDate: new Date(booking.requestedDateTime),
      }))
      .sort((a, b) => a.requestedDate - b.requestedDate)
    return futureBookings[0] || null
  }, [bookings])



  const recentBookings = useMemo(() => {
    return bookings
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.statusUpdatedAt || a.createdAt || a.requestedDateTime || 0)
        const dateB = new Date(b.statusUpdatedAt || b.createdAt || b.requestedDateTime || 0)
        return dateB - dateA
      })
      .slice(0, 4)
  }, [bookings])

  const sliderBookings = useMemo(() => {
    return bookings
      .filter(b => b.status === 'completed')
      .sort((a, b) => {
        const dateA = new Date(a.statusUpdatedAt || a.createdAt || a.requestedDateTime || 0)
        const dateB = new Date(b.statusUpdatedAt || b.createdAt || b.requestedDateTime || 0)
        return dateB - dateA
      })
  }, [bookings])

  // NEW: Filtered Bookings based on search and status filter
  const filteredBookings = useMemo(() => {
    return bookings
      .filter(booking => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
          booking.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.subcategoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())

        // Status filter
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const dateA = new Date(a.statusUpdatedAt || a.createdAt || a.requestedDateTime || 0)
        const dateB = new Date(b.statusUpdatedAt || b.createdAt || b.requestedDateTime || 0)
        return dateB - dateA
      })
  }, [bookings, searchTerm, statusFilter])

  useEffect(() => {
    if (hasRemoteSpendInsights) return
    if (!isBookingsLoading) {
      const fallbackLifetimeSpend =
        typeof persistedLifetimeSpend === 'number' ? persistedLifetimeSpend : stats.calculatedSpend
      deriveSpendInsights(fallbackLifetimeSpend)
    }
  }, [stats.calculatedSpend, leaderboard, persistedLifetimeSpend, isBookingsLoading, hasRemoteSpendInsights])

  const deriveSpendInsights = (lifetimeValue) => {
    const lifetimeSpend = lifetimeValue || 0
    const currentUserId = profile?.userId || 'current-user'
    const sourceBoard =
      leaderboard && leaderboard.length
        ? leaderboard
        : buildFallbackLeaderboard(lifetimeSpend, profile?.name)

    const boardWithUser = sourceBoard.some((entry) => entry.userId === currentUserId)
      ? sourceBoard.slice()
      : [
        ...sourceBoard,
        {
          userId: currentUserId,
          name: profile?.name || 'You',
          totalSpend: lifetimeSpend,
        },
      ]

    const sortedBoard = boardWithUser
      .map((entry) => ({
        ...entry,
        totalSpend: Number(entry.totalSpend || 0),
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)

    const rank = sortedBoard.findIndex((entry) => entry.userId === currentUserId) + 1
    const totalUsers = sortedBoard.length
    const percentile = totalUsers > 0 ? Math.max(1, Math.round((rank / totalUsers) * 100)) : null
    const nextAhead = rank > 1 ? sortedBoard[rank - 2] : null
    const nextTarget = nextAhead ? Math.max(nextAhead.totalSpend - lifetimeSpend, 0) : 0

    setSpendInsights({
      lifetimeSpend,
      rank,
      totalUsers,
      percentile,
      nextTarget,
      board: sortedBoard.slice(0, 5),
    })
    setHasRemoteSpendInsights(false)
  }

  const buildFallbackLeaderboard = (lifetimeSpend) => {
    const adjustedPeers = FALLBACK_LEADERBOARD.map((peer, index) => ({
      ...peer,
      totalSpend: peer.totalSpend + index * 1200,
    }))

    if (lifetimeSpend > 0 && lifetimeSpend > adjustedPeers[adjustedPeers.length - 1].totalSpend) {
      adjustedPeers[adjustedPeers.length - 1].totalSpend = Math.max(
        adjustedPeers[adjustedPeers.length - 1].totalSpend,
        lifetimeSpend * 0.92,
      )
    }

    return adjustedPeers
  }

  const isLoading = isProfileLoading || isBookingsLoading

  const handleQuickAction = (path) => {
    if (path === '#chatbot') {
      setShowChatbot(true)
      return
    }

    if (path.startsWith('#')) {
      const element = document.querySelector(path)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(path)
    }
  }

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`



  const renderStatus = (status) => {
    const label = statusLabels[status] || status
    return <span className={`status-chip ${status}`}>{label}</span>
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    navigate('/login')
  }

  // NEW: Cancel Booking Function
  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return
    }

    setIsCancelling(true)
    try {
      const response = await apiService.post(`/customer/booking/${bookingId}/cancel`)

      if (!response.error) {
        showToast({
          status: 'success',
          title: 'Booking Cancelled',
          message: 'Your booking has been cancelled successfully.'
        })
        fetchBookings() // Refresh bookings list
      } else {
        showToast({
          status: 'error',
          title: 'Cancellation Failed',
          message: response.message || 'Could not cancel booking. Please try again.'
        })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      showToast({
        status: 'error',
        title: 'Error',
        message: error.message || 'Failed to cancel booking'
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const openReviewModal = (booking) => {
    // Check if review already exists
    if (hasReviewForBooking(booking.requestId)) {
      showToast({
        status: 'info',
        title: 'Review Already Submitted',
        message: 'You have already written a review for this booking.'
      })
      return
    }

    setSelectedBookingForReview(booking)
    setReviewFormData({
      reviewText: ''
    })
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setSelectedBookingForReview(null)
    setReviewFormData({
      reviewText: ''
    })
  }

  const insertQuickText = (text) => {
    setReviewFormData(prev => ({
      ...prev,
      reviewText: prev.reviewText ? `${prev.reviewText} ${text}` : text
    }))
  }

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return

    // Double check if review already exists
    if (hasReviewForBooking(selectedBookingForReview.requestId)) {
      showToast({
        status: 'error',
        title: 'Review Already Exists',
        message: 'A review for this booking has already been submitted.'
      })
      return
    }

    setIsSubmittingReview(true)
    try {
      const response = await apiService.post('/customer/reviews', {
        requestId: selectedBookingForReview.requestId,
        rating: 5, // Default 5-star rating
        reviewText: reviewFormData.reviewText || undefined
      })

      if (!response.error) {
        showToast({
          status: 'success',
          title: 'Review Submitted',
          message: 'Thank you for your feedback!'
        })
        closeReviewModal()
        // Refresh bookings and reviews to update UI
        fetchBookings()
        fetchReviews()
      } else {
        showToast({
          status: 'error',
          title: 'Submission Failed',
          message: response.message || 'Could not submit review'
        })
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      showToast({
        status: 'error',
        title: 'Error',
        message: error.message || 'Failed to submit review'
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const fetchReviews = async () => {
    setIsReviewsLoading(true)
    try {
      const response = await apiService.get('/reviews')
      if (!response.error && response.data?.data) {
        setReviews(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsReviewsLoading(false)
    }
  }

  const hasReviewForBooking = (requestId) => {
    if (!profile?.userId) return false

    return reviews.some(review => {
      // Handle potential populated requestId (if it's an object)
      const rId = (typeof review.requestId === 'object' && review.requestId !== null)
        ? (review.requestId.requestId || review.requestId._id)
        : review.requestId

      // Handle potential populated customer
      const cId = (typeof review.customer === 'object' && review.customer !== null)
        ? (review.customer.userId || review.customer._id)
        : (review.customerId || review.customer)

      // Compare as strings to avoid type mismatches
      return String(rId) === String(requestId) && String(cId) === String(profile.userId)
    })
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
      const response = await apiService.put('/customer/profile', {
        profileImage: dataUrl,
      })

      if (!response.error) {
        showToast({
          status: 'success',
          title: 'Photo updated',
          message: 'Your profile photo has been updated.',
        })
        fetchProfile()
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
        message: 'Unable to upload image right now.',
      })
    } finally {
      setIsUploadingImage(false)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      // Only send fields that the backend supports (name, phone, profileImage)
      // Address is not supported in the current backend UpdateCustomerProfileRequest
      const updatePayload = {
        name: editFormData.name,
        phone: editFormData.phone,
      }

      const response = await apiService.put('/customer/profile', updatePayload)
      if (!response.error) {
        showToast({ status: 'success', title: 'Profile Updated', message: 'Your changes have been saved.' })
        fetchProfile()
      } else {
        showToast({ status: 'error', title: 'Update Failed', message: response.message || 'Please try again.' })
      }
    } catch (error) {
      showToast({ status: 'error', title: 'Error', message: error.message })
    } finally {
      setIsSavingProfile(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchReviews()
    }
    if (activeTab === 'profile' && profile) {
      setEditFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      })
    }
  }, [activeTab, profile])

  return (
    <div className="user-dashboard">
      {toast && (
        <div className={`toast-notification ${toast.status}`}>
          <div className="toast-icon-circle">
            {toast.status === 'success' ? '✨' : toast.status === 'error' ? '⚠️' : 'ℹ️'}
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

      {/* Top Navigation */}
      <header className="dashboard-top-nav">
        <div className="nav-brand">HomeHelper</div>
        <div className="nav-actions">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>

            <button
              className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Edit Profile
            </button>
          </div>

          {/* Notification Bell */}
          <div className="notification-wrapper" style={{ position: 'relative' }}>
            <button
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  <button onClick={() => setShowNotifications(false)}>×</button>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No new notifications</p>
                  ) : (
                    notifications.map((notif, index) => (
                      <div key={index} className={`notification-item ${notif.type}`}>
                        <div className="notif-icon">{notif.icon}</div>
                        <div className="notif-content">
                          <p>{notif.message}</p>
                          <small>{notif.time}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="logout-btn-animated" onClick={handleLogout}>
            <span>Logout</span>
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </button>
        </div>
      </header>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <section className="user-hero">
            <div className="hero-overlay"></div>
            <div className="hero-grid">
              <div className="hero-profile-card">
                <div className="hero-avatar-wrap">
                  {profile?.imageUrl || profile?.profileImageUrl ? (
                    <img src={profile.imageUrl || profile.profileImageUrl} alt={profile.name} />
                  ) : (
                    <span>{profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="hero-profile-meta">
                  <p>Hello again,</p>
                  <h2>{profile?.name || 'Customer'}</h2>
                  <span>{profile?.email}</span>
                </div>
              </div>
              <div className="hero-text">
                <p className="hero-eyebrow">Your personal dashboard</p>
                <h1>{profile?.name ? `${profile.name.split(' ')[0]}, manage your home like a pro` : 'Manage your home like a pro'}</h1>
                <p className="hero-subtitle">
                  Track every booking, confirm payments, and discover your next household hero in seconds.
                </p>
                <div className="hero-actions">
                  <button className="primary-cta" onClick={() => handleQuickAction('/')}>
                    Book a service
                  </button>
                  <button className="ghost-cta" onClick={fetchBookings}>
                    Refresh timeline
                  </button>
                </div>
              </div>
              <div className="hero-slider">
                {sliderBookings.length > 0 ? (
                  sliderBookings.map((booking) => (
                    <div key={booking.requestId} className="hero-slide-card">
                      <div>
                        <h4>{booking.subcategoryName || booking.serviceName || 'Service'}</h4>
                        <p>{formatDate(booking.requestedDateTime)}</p>
                      </div>
                      {renderStatus(booking.status)}
                    </div>
                  ))
                ) : (
                  <div className="hero-slide-card" style={{ width: '100%', justifyContent: 'center' }}>
                    <p style={{ margin: 0, opacity: 0.8 }}>No completed bookings yet</p>
                  </div>
                )}
              </div>
              <div className="hero-stat">
                <div className="hero-stat-card">
                  <span>Active requests</span>
                  <strong>{stats.activeCount}</strong>
                </div>
                <div className="hero-stat-card">
                  <span>Lifetime spend</span>
                  <strong>{formatCurrency(stats.totalSpend)}</strong>
                </div>
                <p className="hero-quote">{testimonials[testimonialIndex]}</p>
              </div>
            </div>
          </section>

          {!isLoading && spendInsights && (
            <section className="spend-highlight-row">
              <div className="spend-card glass-card lifetime-card">
                <div className="card-chip">Lifetime spend</div>
                <h2>{formatCurrency(spendInsights.lifetimeSpend)}</h2>
                <p>You’ve invested in {stats.completedCount} completed projects.</p>
                <div className="spark-line" aria-hidden="true"></div>
              </div>
              <div className="spend-card glass-card rank-card">
                <div className="rank-badge">
                  #{spendInsights.rank || '—'}
                  <span>overall</span>
                </div>
                <p className="rank-subtitle">
                  Top {spendInsights.percentile || '—'}% of our most loyal customers
                </p>
                {spendInsights.nextTarget > 0 ? (
                  <div className="rank-progress">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            (spendInsights.lifetimeSpend /
                              (spendInsights.lifetimeSpend + spendInsights.nextTarget)) *
                            100,
                            100,
                          ).toFixed(1)}%`,
                        }}
                      ></div>
                    </div>
                    <small>{formatCurrency(spendInsights.nextTarget)} to reach the next spot</small>
                  </div>
                ) : (
                  <small>You’re leading the board right now. Keep it up!</small>
                )}
              </div>
              <div className="spend-card glass-card leaderboard-card">
                <div className="card-chip">{isLeaderboardLoading ? 'Loading leaderboard…' : 'Top spenders'}</div>
                <div className="leaderboard-list">
                  {(spendInsights.board || []).map((entry, index) => (
                    <div
                      key={entry.userId || index}
                      className={`leaderboard-item ${entry.userId === (profile?.userId || 'current-user') ? 'active' : ''
                        }`}
                    >
                      <div className="leaderboard-rank">#{index + 1}</div>
                      <div>
                        <strong>{entry.userId === (profile?.userId || 'current-user') ? 'You' : entry.name}</strong>
                        <p>{formatCurrency(entry.totalSpend)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="user-dashboard-content">
            {isLoading ? (
              <div className="user-loading">
                <div className="loading-spinner"></div>
                <p>Curating your personalized dashboard…</p>
              </div>
            ) : (
              <>
                <section className="user-stats-grid">
                  <div className="stat-card">
                    <div>
                      <p>Upcoming visits</p>
                      <h3>{stats.upcomingCount}</h3>
                    </div>
                    <span className="stat-icon">📅</span>
                  </div>
                  <div className="stat-card">
                    <div>
                      <p>Active requests</p>
                      <h3>{stats.activeCount}</h3>
                    </div>
                    <span className="stat-icon">⚙️</span>
                  </div>
                  <div className="stat-card">
                    <div>
                      <p>Completed jobs</p>
                      <h3>{stats.completedCount}</h3>
                    </div>
                    <span className="stat-icon">🏁</span>
                  </div>
                  <div className="stat-card">
                    <div>
                      <p>Pending payments</p>
                      <h3>{stats.pendingPaymentCount}</h3>
                    </div>
                    <span className="stat-icon">💸</span>
                  </div>
                </section>

                <section className="user-main-grid">
                  <div className="card next-booking-card" id="next-booking">
                    <div className="section-header">
                      <div>
                        <h3>Next booking</h3>
                        <p>Keep an eye on your upcoming visits</p>
                      </div>
                      <button className="link-btn" onClick={() => handleQuickAction('#bookings')}>
                        View all
                      </button>
                    </div>
                    {nextBooking ? (
                      <div className="next-booking-body">
                        <div>
                          <p className="provider-name">{nextBooking.provider?.name || 'Assigned soon'}</p>
                          <p className="service-name">
                            {nextBooking.subcategoryName || nextBooking.serviceName || 'Service'}
                          </p>
                        </div>
                        <div className="next-booking-meta">
                          <span>{formatDate(nextBooking.requestedDateTime)}</span>
                          {renderStatus(nextBooking.status)}
                        </div>
                      </div>
                    ) : (
                      <div className="next-booking-empty">
                        <p>No upcoming bookings yet.</p>
                        <button className="primary-cta small" onClick={() => handleQuickAction('/')}>
                          Find providers
                        </button>
                      </div>
                    )}
                    <div className="booking-methods-grid">
                      <button
                        type="button"
                        className="booking-method-card instant-card"
                        onClick={() => handleQuickAction('/instant-booking')}
                      >
                        <div>
                          <p className="method-eyebrow">Need help now?</p>
                          <h4>Instant booking</h4>
                          <p>Summon a vetted pro right away with our lightning-fast instant flow.</p>
                        </div>
                        <span className="method-chip">⚡ under 60s</span>
                      </button>
                      <button
                        type="button"
                        className="booking-method-card schedule-card"
                        onClick={() => handleQuickAction('/booking/schedule')}
                      >
                        <div>
                          <p className="method-eyebrow">Plan ahead</p>
                          <h4>Schedule booking</h4>
                          <p>Pick dates, add notes, and send elegant briefs to preferred providers.</p>
                        </div>
                        <span className="method-chip">🗓️ smart plan</span>
                      </button>
                    </div>
                  </div>

                  <div className="card quick-actions-card" id="support">
                    <div className="section-header">
                      <div>
                        <h3>Quick actions</h3>
                        <p>Everything you need in one tap</p>
                      </div>
                    </div>
                    <div className="quick-actions-list">
                      {quickActions.map((action) => (
                        <button
                          key={action.title}
                          className="quick-action"
                          onClick={() => handleQuickAction(action.path)}
                        >
                          <div className="quick-action-icon">{action.icon}</div>
                          <div>
                            <strong>{action.title}</strong>
                            <p>{action.description}</p>
                          </div>
                          <span className="quick-action-cta">{action.cta} →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="card bookings-section" id="bookings">
                  <div className="section-header">
                    <div>
                      <h3>Recent Bookings</h3>
                      <p>Track your accepted and upcoming jobs</p>
                    </div>
                    <button className="ghost-cta" onClick={() => navigate('/bookings/history')}>
                      View All Booking Records
                    </button>
                  </div>

                  {/* NEW: Search and Filter Controls */}
                  <div className="booking-filters" style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="text"
                      placeholder="🔍 Search by provider or service..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        flex: '1',
                        minWidth: '250px',
                        padding: '10px 15px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: '10px 15px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Bookings</option>
                      <option value="pending">Pending</option>
                      <option value="booking_accepted">Awaiting Payment</option>
                      <option value="payment_pending">Payment Pending</option>
                      <option value="payment_confirmed">Payment Confirmed</option>
                      <option value="booked">Booked</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                      <p>{searchTerm || statusFilter !== 'all' ? 'No bookings match your filters.' : 'No bookings yet. Start by creating your first request.'}</p>
                    </div>
                  ) : (
                    <div className="user-bookings-list">
                      {filteredBookings.slice(0, showAllBookings ? undefined : 4).map((booking) => (
                        <div key={booking.requestId} className="user-booking-card">
                          <div className="booking-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Provider Avatar */}
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                              }}>
                                {booking.provider?.imageUrl ? (
                                  <img
                                    src={booking.provider.imageUrl}
                                    alt={booking.provider.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <span style={{
                                  display: booking.provider?.imageUrl ? 'none' : 'flex',
                                  fontSize: '1.2rem',
                                  fontWeight: '700',
                                  color: '#4f46e5'
                                }}>
                                  {(booking.provider?.name || booking.providerName || 'P').charAt(0).toUpperCase()}
                                </span>
                              </div>

                              <div>
                                <p className="service-name">
                                  {booking.subcategoryName || booking.serviceName || 'Service'}
                                </p>
                                <span className="booking-provider">
                                  {booking.provider?.name || booking.providerName || 'Provider assigning'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                              {renderStatus(booking.status)}
                              {booking.status === 'pending' && booking.bookingExpiresAt && (
                                <BookingTimer
                                  expiresAt={booking.bookingExpiresAt}
                                  onExpire={() => fetchBookings()}
                                />
                              )}
                            </div>
                          </div>
                          <div className="booking-row subtle">
                            <span>Scheduled: {formatDate(booking.requestedDateTime)}</span>
                            <span>Total: {formatCurrency(booking.totalAmount || booking.hourlyRate || 0)}</span>
                          </div>
                          {booking.paymentStatus && (
                            <div className={`payment-badge ${booking.paymentStatus}`}>
                              Payment: {booking.paymentStatus.replace('_', ' ')}
                            </div>
                          )}

                          {/* NEW: Provider Contact Display (when booking accepted) */}
                          {['booking_accepted', 'payment_confirmed', 'booked', 'in_progress'].includes(booking.status) && booking.providerPhone && (
                            <div style={{
                              marginTop: '12px',
                              padding: '12px',
                              background: '#f0fdf4',
                              borderRadius: '8px',
                              border: '1px solid #86efac'
                            }}>
                              <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#166534' }}>
                                📞 Provider Contact
                              </h4>
                              <p style={{ fontSize: '13px', marginBottom: '8px', color: '#374151' }}>
                                Phone: <strong>{booking.providerPhone}</strong>
                              </p>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => window.open(`tel:${booking.providerPhone}`)}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                  }}
                                >
                                  📞 Call
                                </button>
                                <button
                                  onClick={() => window.open(`https://wa.me/${booking.providerPhone?.replace(/[^0-9]/g, '')}`)}
                                  style={{
                                    flex: 1,
                                    padding: '8px 12px',
                                    background: '#25D366',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                  }}
                                >
                                  💬 WhatsApp
                                </button>
                              </div>
                            </div>
                          )}

                          {/* NEW: Cancel Button (for cancellable statuses) */}
                          {['pending', 'booking_accepted', 'payment_pending'].includes(booking.status) && (
                            <button
                              className="cancel-booking-btn"
                              onClick={() => handleCancelBooking(booking.requestId)}
                              disabled={isCancelling}
                              style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                width: '100%'
                              }}
                            >
                              {isCancelling ? 'Cancelling...' : '❌ Cancel Booking'}
                            </button>
                          )}

                          {booking.status === 'completed' && (
                            hasReviewForBooking(booking.requestId) ? (
                              <div className="review-submitted-badge">
                                ✓ Review Submitted
                              </div>
                            ) : (
                              <button
                                className="write-review-btn"
                                onClick={() => openReviewModal(booking)}
                              >
                                ✍️ Write Review
                              </button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </>
      )}



      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="edit-profile-container">
          <h2>Edit Profile</h2>

          <div className="profile-image-upload-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div className="profile-image-preview" style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', border: '3px solid #e2e8f0' }}>
              {profile?.imageUrl || profile?.profileImageUrl ? (
                <img src={profile.imageUrl || profile.profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#94a3b8' }}>
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="ghost-cta"
              style={{ color: '#4f46e5', borderColor: '#4f46e5', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <button type="submit" className="save-btn" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* View All Bookings Modal */}
      {showAllBookings && (
        <div className="modal-overlay" onClick={() => setShowAllBookings(false)}>
          <div className="modal-content scroll-view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>All Bookings</h3>
              <button className="close-btn" onClick={() => setShowAllBookings(false)}>×</button>
            </div>
            <div className="modal-body animated-list">
              {bookings.map((booking, index) => (
                <div
                  key={booking.requestId || index}
                  className="user-booking-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="booking-row">
                    <div>
                      <p className="service-name">
                        {booking.subcategoryName || booking.serviceName || 'Service'}
                      </p>
                      <span className="booking-provider">
                        {booking.provider?.name || 'Provider assigning'}
                      </span>
                    </div>
                    {renderStatus(booking.status)}
                  </div>
                  <div className="booking-row subtle">
                    <span>Scheduled: {formatDate(booking.requestedDateTime)}</span>
                    <span>Total: {formatCurrency(booking.totalAmount || booking.hourlyRate || 0)}</span>
                  </div>
                  {booking.paymentStatus && (
                    <div className={`payment-badge ${booking.paymentStatus}`}>
                      Payment: {booking.paymentStatus.replace('_', ' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBookingForReview && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Write a Review</h3>
              <button className="close-btn" onClick={closeReviewModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="review-booking-info">
                <p className="review-service-name">
                  {selectedBookingForReview.subcategoryName || selectedBookingForReview.serviceName}
                </p>
                <p className="review-provider-name">
                  Provider: {selectedBookingForReview.provider?.name || 'Unknown'}
                </p>
              </div>

              {/* Quick Text Options */}
              <div className="tags-section">
                <label>Quick Text</label>
                <div className="review-tags">
                  {quickTextOptions.map((text, index) => (
                    <button
                      key={index}
                      type="button"
                      className="tag-btn"
                      onClick={() => insertQuickText(text)}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="review-text-section">
                <label>Your Review (Optional)</label>
                <textarea
                  className="review-textarea"
                  placeholder="Share your experience with this provider..."
                  value={reviewFormData.reviewText}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, reviewText: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="modal-actions">
                <button
                  className="ghost-cta"
                  onClick={closeReviewModal}
                  disabled={isSubmittingReview}
                >
                  Cancel
                </button>
                <button
                  className="primary-cta"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Modal */}
      {showChatbot && (
        <ChatbotModal
          onClose={() => setShowChatbot(false)}
          userName={profile?.name}
        />
      )}
    </div>
  )
}

export default UserDashboard
// Refreshed
