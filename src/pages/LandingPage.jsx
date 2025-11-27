import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api.service'
import './LandingPage.css'

const heroImages = [
  'https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?auto=format&fit=crop&q=80&w=1000', // Repair/Construction
  'https://images.unsplash.com/photo-1527513913476-fa952935e20c?auto=format&fit=crop&q=80&w=1000', // Cleaning
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1000', // Electrician
  'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=1000', // Kitchen/Home
]

const howItWorks = [
  {
    step: 'Choose Your Service',
    description: 'Select from a wide range of home services tailored to your needs.',
    icon: '🔍',
  },
  {
    step: 'Find Verified Pros',
    description: 'Get matched with skilled, background-checked professionals instantly.',
    icon: '🛡️',
  },
  {
    step: 'Relax & Enjoy',
    description: 'Sit back while our experts take care of your home. Pay securely after.',
    icon: '✨',
  },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchCategories()
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await apiService.get('/categories?includeSubcategories=true')
      if (!response.error && response.data?.data) {
        setCategories(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    } finally {
      setIsLoading(false)
    }
  }

  const highlightedCategories = useMemo(() => categories.slice(0, 4), [categories])

  const handleScrollToServices = () => {
    document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing-root">
      {/* Animated Background Shapes */}
      <div className="landing-background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <nav className="landing-nav fade-in-down">
        <div className="nav-logo">HomeHelper</div>
        <div className="nav-links">
          <button onClick={handleScrollToServices}>Services</button>
          <button onClick={() => navigate('/login')}>Login</button>
          <button className="nav-primary" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="hero-content fade-in-up">
          <div className="hero-text-block">
            <span className="hero-badge">✨ Your Home, Our Priority</span>
            <h1>
              Expert Home Services <br />
              <span className="text-gradient">at Your Fingertips</span>
            </h1>
            <p className="hero-subtitle">
              Connect with top-rated professionals for cleaning, repairs, and more.
              Fast, reliable, and secure – the Home Helper way.
            </p>
            <div className="hero-cta-group">
              <button className="primary-btn" onClick={() => navigate('/signup')}>
                Book Now
              </button>
              <button className="secondary-btn" onClick={handleScrollToServices}>
                Explore Services
              </button>
            </div>
          </div>

          <div className="hero-slider-container fade-in-right">
            <div className="hero-slider-frame">
              {heroImages.map((img, index) => (
                <div
                  key={index}
                  className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))}
              <div className="slider-overlay">
                <div className="slider-card glass-card float-animation">
                  <span className="icon">⭐</span>
                  <div>
                    <strong>4.9/5 Rating</strong>
                    <p>from happy customers</p>
                  </div>
                </div>
                <div className="slider-card glass-card float-animation-delayed">
                  <span className="icon">🛡️</span>
                  <div>
                    <strong>Verified Pros</strong>
                    <p>Background checked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="stats-banner fade-in-up">
          <div className="stat-item">
            <h3>10k+</h3>
            <p>Happy Customers</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h3>500+</h3>
            <p>Verified Experts</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <h3>50+</h3>
            <p>Service Categories</p>
          </div>
        </section>

        <section id="services" className="services-section">
          <div className="section-header center-text">
            <span className="eyebrow">Our Services</span>
            <h2>Everything You Need</h2>
            <p>From quick fixes to major renovations, we've got you covered.</p>
          </div>

          {isLoading ? (
            <div className="loading-spinner-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="categories-grid">
              {highlightedCategories.map((category, index) => (
                <div
                  key={category.categoryId}
                  className="category-card glass-card fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="category-icon-wrapper">
                    {category.name.charAt(0)}
                  </div>
                  <h3>{category.name}</h3>
                  <p>{category.description || 'Professional services for your home.'}</p>
                  <div className="category-tags">
                    {(category.subcategories || []).slice(0, 2).map(sub => (
                      <span key={sub.subcategoryId}>{sub.name}</span>
                    ))}
                    {(category.subcategories?.length || 0) > 2 && (
                      <span>+{category.subcategories.length - 2} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="how-it-works-section">
          <div className="section-header center-text">
            <span className="eyebrow">Process</span>
            <h2>How Home Helper Works</h2>
          </div>
          <div className="steps-container">
            {howItWorks.map((step, index) => (
              <div key={index} className="step-card glass-card fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.step}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content glass-card">
            <h2>Ready to Transform Your Home?</h2>
            <p>Join thousands of satisfied homeowners today.</p>
            <button className="primary-btn large" onClick={() => navigate('/signup')}>
              Get Started Now
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© 2024 Home Helper. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default LandingPage
