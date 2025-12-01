import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import ProviderCard from '../components/ProviderCard'
import './BookingPages.css'

const InstantBooking = () => {
  const navigate = useNavigate()

  // State management
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [providers, setProviders] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [cities, setCities] = useState([])
  const [areas, setAreas] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingProviders, setIsLoadingProviders] = useState(false)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  // Refs for auto-scrolling
  const subcategoryRef = useRef(null)
  const locationRef = useRef(null)
  const resultsRef = useRef(null)

  // Load categories and locations on mount
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
        }
      } catch {
        // ignore parse errors
      }
    }

    loadCategories()
    loadLocations()

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [navigate])

  // Load categories from backend
  const loadCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const response = await apiService.get('/categories?includeSubcategories=true')
      if (!response.error && response.data?.success && response.data?.data) {
        setCategories(response.data.data)
        console.log('✅ Loaded categories:', response.data.data)
      } else {
        showToast({
          status: 'error',
          title: 'Failed to load categories',
          message: response.message || 'Could not fetch service categories',
        })
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      showToast({
        status: 'error',
        title: 'Network error',
        message: 'Could not connect to server',
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Load locations (cities and areas) from backend
  const loadLocations = async () => {
    setIsLoadingLocations(true)
    try {
      const response = await apiService.get('/locations')
      if (!response.error && response.data?.success && response.data?.data) {
        const locationData = response.data.data
        setCities(locationData.cities || [])
        console.log('✅ Loaded locations:', locationData)
      } else {
        showToast({
          status: 'error',
          title: 'Failed to load locations',
          message: 'Could not fetch cities and areas',
        })
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      showToast({
        status: 'error',
        title: 'Network error',
        message: 'Could not load location data',
      })
    } finally {
      setIsLoadingLocations(false)
    }
  }

  // Handle city selection and load corresponding areas
  const handleCityChange = async (selectedCity) => {
    setCity(selectedCity)
    setArea('') // Reset area when city changes
    setAreas([]) // Clear areas

    if (!selectedCity) return

    try {
      const response = await apiService.get(`/locations/${selectedCity}/areas`)
      if (!response.error && response.data?.success && response.data?.data?.cityAreas?.[0]) {
        const cityData = response.data.data.cityAreas[0]
        setAreas(cityData.areas || [])
        console.log('✅ Loaded areas for', selectedCity, ':', cityData.areas)
      }
    } catch (error) {
      console.error('Error loading areas:', error)
      showToast({
        status: 'error',
        title: 'Failed to load areas',
        message: `Could not load areas for ${selectedCity}`,
      })
    }
  }

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setProviders([])
    setSubcategories(category.subcategories || [])
    console.log('Selected category:', category)

    // Auto-scroll to subcategories
    setTimeout(() => {
      subcategoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handle subcategory selection (no longer auto-fetches providers)
  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory)
    setProviders([])
    console.log('Selected subcategory:', subcategory)

    // Auto-scroll to location
    setTimeout(() => {
      locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Handle Find Provider button click
  const handleFindProviders = async () => {
    // Validate inputs
    if (!selectedCategory) {
      showToast({
        status: 'error',
        title: 'Category Required',
        message: 'Please select a service category first',
      })
      return
    }

    if (!selectedSubcategory) {
      showToast({
        status: 'error',
        title: 'Subcategory Required',
        message: 'Please select a subcategory',
      })
      return
    }

    if (!city.trim()) {
      showToast({
        status: 'error',
        title: 'City Required',
        message: 'Please enter your city',
      })
      return
    }

    if (!area.trim()) {
      showToast({
        status: 'error',
        title: 'Area Required',
        message: 'Please enter your area',
      })
      return
    }

    console.log('Fetching providers for:', {
      category: selectedCategory.name,
      subcategory: selectedSubcategory.name,
      city: city.trim(),
      area: area.trim()
    })

    await fetchProviders(selectedCategory.categoryId, selectedSubcategory.subcategoryId, city.trim(), area.trim())
  }

  // Handle booking a provider
  const handleBookProvider = (provider) => {
    navigate('/booking/instant/confirm', {
      state: {
        provider,
        selectedSubcategory
      }
    })
  }

  // Handle viewing provider profile
  const handleViewProfile = (provider) => {
    navigate('/provider/profile', {
      state: {
        provider,
        prioritySubcategoryId: selectedSubcategory?.subcategoryId
      }
    })
  }

  // Fetch providers from backend
  const fetchProviders = async (categoryId, subcategoryId, city, area) => {
    setIsLoadingProviders(true)
    try {
      const params = new URLSearchParams({
        city,
        area,
        categoryId: categoryId.toString(),
        subcategoryId: subcategoryId.toString(),
        page: '1',
        limit: '20'
      })

      const response = await apiService.get(`/customer/instant-hiring/providers/by-location?${params.toString()}`)

      console.log('Provider response:', response)

      if (!response.error && response.data?.success && response.data?.data?.providers) {
        const fetchedProviders = response.data.data.providers
        setProviders(fetchedProviders)
        console.log('✅ Found providers:', fetchedProviders)

        showToast({
          status: 'success',
          title: `Found ${fetchedProviders.length} provider(s)`,
          message: 'Select a provider to book their service',
        })
      } else {
        setProviders([])
        showToast({
          status: 'info',
          title: 'No providers found',
          message: 'Try selecting a different subcategory',
        })
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
      setProviders([])
      showToast({
        status: 'error',
        title: 'Failed to load providers',
        message: error.message || 'Could not fetch providers',
      })
    } finally {
      setIsLoadingProviders(false)
    }
  }

  const showToast = ({ status = 'info', title = '', message = '', duration = 3200 }) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
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
            <button onClick={() => setToast(null)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="booking-shell">
        <header className="booking-hero">
          <div className="booking-hero-grid">
            <div className="booking-hero-text">
              <p className="booking-pill">Instant booking · live availability</p>
              <h1>Need someone right now?</h1>
              <p>
                Select a service category and subcategory to find verified professionals ready to help.
                Browse providers and book instantly.
              </p>
              <div className="booking-pill-row">
                <span className="booking-pill">Average match &lt; 60s</span>
                <span className="booking-pill">Live provider radar</span>
                <span className="booking-pill">Verified pros only</span>
              </div>
            </div>
            <div className="booking-hero-stats">
              <div className="booking-stat-card">
                <span>available categories</span>
                <strong>{categories.length} services</strong>
              </div>
              <div className="booking-stat-card">
                <span>urban coverage</span>
                <strong>3 cities</strong>
              </div>
            </div>
          </div>
        </header>

        <main className="booking-content-grid">
          <section className="booking-form-card">
            <h2>Select Service Category</h2>

            {isLoadingCategories ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading categories...</p>
              </div>
            ) : (
              <>
                {/* Category Selection */}
                <div className="form-group">
                  <label>1. Choose a Category</label>
                  <div className="category-grid">
                    {categories.map((category) => (
                      <button
                        key={category.categoryId}
                        type="button"
                        className={`category-card ${selectedCategory?.categoryId === category.categoryId ? 'selected' : ''}`}
                        onClick={() => handleCategorySelect(category)}
                      >
                        <div className="category-icon">
                          {category.icon || '🔧'}
                        </div>
                        <strong>{category.name}</strong>
                        <p>{category.description || ''}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory Selection */}
                {selectedCategory && subcategories.length > 0 && (
                  <div className="form-group" ref={subcategoryRef}>
                    <label>2. Choose a Subcategory</label>
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

                {/* City and Area Dropdowns */}
                {selectedSubcategory && (
                  <div ref={locationRef}>
                    <div className="form-group">
                      <label>3. Select Your City</label>
                      <select
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={isLoadingLocations}
                      >
                        <option value="">-- Select a city --</option>
                        {cities.map((cityName) => (
                          <option key={cityName} value={cityName}>
                            {cityName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {city && (
                      <div className="form-group">
                        <label>Select Your Area</label>
                        <select
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          disabled={areas.length === 0}
                        >
                          <option value="">-- Select an area --</option>
                          {areas.map((areaName) => (
                            <option key={areaName} value={areaName}>
                              {areaName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Find Provider Button */}
                    <div className="form-group">
                      <button
                        className="booking-btn"
                        onClick={handleFindProviders}
                        disabled={isLoadingProviders}
                      >
                        {isLoadingProviders ? 'Searching...' : '🔍 Find Providers'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading Providers */}
                {isLoadingProviders && (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Finding providers...</p>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="booking-info-card">
            <h3>How Instant Booking Works</h3>
            <ul className="info-list">
              <li>
                <span className="info-chip">1️⃣</span>
                <div>
                  <strong>Select Category</strong>
                  <p>Choose the type of service you need from our available categories.</p>
                </div>
              </li>
              <li>
                <span className="info-chip">2️⃣</span>
                <div>
                  <strong>Pick Subcategory</strong>
                  <p>Narrow down to the specific service you require.</p>
                </div>
              </li>
              <li>
                <span className="info-chip">3️⃣</span>
                <div>
                  <strong>Enter Location</strong>
                  <p>Provide your city and area to find nearby providers.</p>
                </div>
              </li>
              <li>
                <span className="info-chip">4️⃣</span>
                <div>
                  <strong>Find Providers</strong>
                  <p>Click the button to search for available providers in your area.</p>
                </div>
              </li>
              <li>
                <span className="info-chip">5️⃣</span>
                <div>
                  <strong>Book Instantly</strong>
                  <p>Select a provider and confirm your booking right away.</p>
                </div>
              </li>
            </ul>

            <div className="booking-timeline">
              <div className="timeline-step">
                <span className="info-chip">✓</span>
                <div>
                  <strong>Verified Professionals</strong>
                  <p>All providers are verified and rated by real customers.</p>
                </div>
              </div>
              <div className="timeline-step">
                <span className="info-chip">✓</span>
                <div>
                  <strong>Transparent Pricing</strong>
                  <p>See hourly rates upfront with no hidden fees.</p>
                </div>
              </div>
              <div className="timeline-step">
                <span className="info-chip">✓</span>
                <div>
                  <strong>Secure Payments</strong>
                  <p>Payment and status updates sync automatically.</p>
                </div>
              </div>
            </div>
          </aside>
        </main>

        {/* Provider Results */}
        {selectedSubcategory && !isLoadingProviders && (
          <section className="booking-results" ref={resultsRef}>
            <h3>Available Providers</h3>
            <p>
              {providers.length > 0
                ? `Found ${providers.length} provider(s) for ${selectedSubcategory.name}`
                : 'No providers available for this service in your area'}
            </p>
            {providers.length === 0 ? (
              <div className="empty-hint">
                No providers found. Try selecting a different subcategory or check back later.
              </div>
            ) : (
              <div className="providers-grid">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    onBook={handleBookProvider}
                    onViewProfile={handleViewProfile}
                    subcategoryId={selectedSubcategory?.subcategoryId}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div className="booking-footer-actions">
          <button className="ghost-link" onClick={() => navigate('/booking/schedule')}>
            Plan a scheduled booking →
          </button>
          <button className="ghost-link" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstantBooking





