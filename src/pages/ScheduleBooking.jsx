import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import ProviderCard from '../components/ProviderCard'
import './BookingPages.css'

const ScheduleBooking = () => {
  const navigate = useNavigate()

  // --- State Management ---
  // Selection Data
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [cities, setCities] = useState([])
  const [areas, setAreas] = useState([])

  // User Selections
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')

  // Booking Details Form
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    durationHours: 3,
    notes: '',
  })

  // Results & UI State
  const [providers, setProviders] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  // --- Effects ---
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      navigate('/login')
      return
    }
    loadCategories()
    loadLocations()

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [navigate])

  // --- Data Loading ---
  const loadCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const response = await apiService.get('/categories?includeSubcategories=true')
      if (!response.error && response.data?.success && response.data?.data) {
        setCategories(response.data.data)
      } else {
        showToast({ status: 'error', title: 'Error', message: 'Could not fetch categories' })
      }
    } catch (error) {
      showToast({ status: 'error', title: 'Network error', message: 'Could not connect to server' })
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const loadLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const response = await apiService.get('/locations')
      if (!response.error && response.data?.success && response.data?.data) {
        setCities(response.data.data.cities || [])
      }
    } catch (error) {
      showToast({ status: 'error', title: 'Error', message: 'Could not load locations' })
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const handleCityChange = async (selectedCity) => {
    setCity(selectedCity)
    setArea('')
    setAreas([])
    if (!selectedCity) return

    setIsLoadingAreas(true)
    try {
      const response = await apiService.get(`/locations/${selectedCity}/areas`)
      if (!response.error && response.data?.success && response.data?.data?.cityAreas?.[0]) {
        setAreas(response.data.data.cityAreas[0].areas || [])
      }
    } catch (error) {
      console.error('Error loading areas:', error)
      showToast({ status: 'error', title: 'Error', message: 'Could not load areas' })
    } finally {
      setIsLoadingAreas(false)
    }
  }

  // --- Handlers ---
  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setSubcategories(category.subcategories || [])
    setProviders([])
  }

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory)
    setProviders([])
  }

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const buildRequestedDate = () => {
    if (!formData.date || !formData.time) return null
    const candidate = new Date(`${formData.date}T${formData.time}:00`)
    if (Number.isNaN(candidate.getTime())) return null
    return candidate.toISOString()
  }

  const handleFindProviders = async (event) => {
    event.preventDefault()

    // Validation
    if (!selectedCategory || !selectedSubcategory) {
      showToast({ status: 'error', title: 'Service required', message: 'Please select a category and subcategory.' })
      return
    }
    if (!city || !area) {
      showToast({ status: 'error', title: 'Location required', message: 'Please select your city and area.' })
      return
    }
    const requestedDateTime = buildRequestedDate()
    if (!requestedDateTime) {
      showToast({ status: 'error', title: 'Date & Time required', message: 'Please select when you need the service.' })
      return
    }

    setIsSubmitting(true)
    setProviders([])

    try {
      const params = new URLSearchParams({
        requestedDateTime,
        durationHours: String(formData.durationHours),
        categoryId: selectedCategory.categoryId.toString(),
        subcategoryId: selectedSubcategory.subcategoryId.toString(),
      })

      const response = await apiService.get(`/customer/booking/providers/available?${params.toString()}`)

      if (!response.error && response.data?.data?.providers) {
        // Client-side filtering for City (since backend might not support it for this endpoint)
        let fetchedProviders = response.data.data.providers

        if (city) {
          fetchedProviders = fetchedProviders.filter(p =>
            p.city?.toLowerCase() === city.toLowerCase()
          )
        }

        setProviders(fetchedProviders)

        if (fetchedProviders.length > 0) {
          showToast({ status: 'success', title: 'Providers Found', message: `Found ${fetchedProviders.length} available providers.` })
        } else {
          showToast({ status: 'info', title: 'No providers found', message: 'No providers available for this slot in your city.' })
        }
      } else {
        showToast({ status: 'error', title: 'No providers found', message: response.message || 'Try another slot.' })
      }
    } catch (error) {
      showToast({ status: 'error', title: 'Network error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBookProvider = (provider) => {
    navigate('/booking/schedule/confirm', {
      state: {
        provider,
        formData: {
          ...formData,
          service: selectedSubcategory.name, // Pass subcategory name as service name
          category: selectedCategory.name,
          subcategoryId: selectedSubcategory.subcategoryId,
          location: { city, area }
        }
      }
    })
  }

  const showToast = ({ status = 'info', title = '', message = '', duration = 3200 }) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ status, title, message })
    toastTimerRef.current = setTimeout(() => setToast(null), duration)
  }

  return (
    <div className="booking-page">
      {toast && (
        <div className="booking-toasts">
          <div className={`booking-toast ${toast.status}`}>
            <span className="icon">{toast.status === 'success' ? '✨' : toast.status === 'error' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <strong>{toast.title}</strong>
              {toast.message && <p>{toast.message}</p>}
            </div>
            <button onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
          </div>
        </div>
      )}

      <div className="booking-shell">
        <header className="booking-hero">
          <div className="booking-hero-grid">
            <div className="booking-hero-text">
              <p className="booking-pill">Schedule booking · curated briefs</p>
              <h1>Design the perfect service window</h1>
              <p>Share your dream schedule, attach project notes, and we'll deliver the brief to verified providers.</p>
            </div>
          </div>
        </header>

        <main className="booking-content-grid">
          <section className="booking-form-card">
            <h2>1. Select Service & Location</h2>

            {/* Category Selection */}
            <div className="form-group">
              <label>Choose Category</label>
              <div className="category-grid">
                {categories.map((category) => (
                  <button
                    key={category.categoryId}
                    type="button"
                    className={`category-card ${selectedCategory?.categoryId === category.categoryId ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div className="category-icon">{category.icon || '🔧'}</div>
                    <strong>{category.name}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory Selection */}
            {selectedCategory && (
              <div className="form-group">
                <label>Choose Subcategory</label>
                <div className="subcategory-grid">
                  {subcategories.map((subcategory) => (
                    <button
                      key={subcategory.subcategoryId}
                      type="button"
                      className={`subcategory-chip ${selectedSubcategory?.subcategoryId === subcategory.subcategoryId ? 'selected' : ''}`}
                      onClick={() => handleSubcategorySelect(subcategory)}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location Selection */}
            {selectedSubcategory && (
              <div className="form-group-row">
                <div className="form-group">
                  <label>City</label>
                  <select value={city} onChange={(e) => handleCityChange(e.target.value)}>
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Area</label>
                  <select value={area} onChange={(e) => setArea(e.target.value)} disabled={!city}>
                    <option value="">Select Area</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Date & Time Form */}
            {city && area && (
              <>
                <h2 style={{ marginTop: '2rem' }}>2. Set Date & Time</h2>
                <form className="booking-form" onSubmit={handleFindProviders}>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label htmlFor="date">Date</label>
                      <input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleFormChange('date', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="time">Start Time</label>
                      <input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleFormChange('time', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="duration">Duration: {formData.durationHours}h</label>
                    <input
                      id="duration"
                      type="range"
                      min="1"
                      max="8"
                      step="0.5"
                      value={formData.durationHours}
                      onChange={(e) => handleFormChange('durationHours', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Notes (Optional)</label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder="Describe the task..."
                      rows={3}
                    />
                  </div>

                  <button className="booking-btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Checking Availability...' : 'Find Available Providers'}
                  </button>
                </form>
              </>
            )}
          </section>

          {/* Results Section */}
          <section className="booking-results">
            <h3>Available Providers</h3>
            {providers.length === 0 ? (
              <div className="empty-hint">
                {isSubmitting ? 'Searching...' : 'Select service, location, and time to find providers.'}
              </div>
            ) : (
              <div className="providers-grid">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={{ ...provider, area: area }} // Pass selected area as provider area for display if needed
                    onBook={handleBookProvider}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default ScheduleBooking





