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

  useEffect(() => {
    fetchCategories()
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
              <button className="primary-btn" onClick={handleScrollToServices}>
                Book Now
              </button>
              <button className="secondary-btn" onClick={handleScrollToServices}>
                Explore Services
              </button>
            </div>
          </div>

          <div className="hero-visual fade-in-right">
            <div className="hero-circle-bg"></div>
            <div className="floating-card card-1 glass-card">
              <span className="icon">🧹</span>
              <div className="card-info">
                <strong>Cleaning</strong>
                <span>Booked 2m ago</span>
              </div>
            </div>
            <div className="floating-card card-2 glass-card">
              <span className="icon">⭐</span>
              <div className="card-info">
                <strong>4.9 Rating</strong>
                <span>Verified Pros</span>
              </div>
            </div>
            <div className="floating-card card-3 glass-card">
              <span className="icon">🛡️</span>
              <div className="card-info">
                <strong>Secure</strong>
                <span>Payment Protection</span>
              </div>
            </div>
            <div className="hero-app-mockup glass-card">
              <div className="mockup-header">
                <div className="mockup-dot"></div>
                <div className="mockup-dot"></div>
              </div>
              <div className="mockup-body">
                <div className="mockup-row"></div>
                <div className="mockup-row short"></div>
                <div className="mockup-card"></div>
                <div className="mockup-card"></div>
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

        <section id="solutions" className="solutions-section">
          <div className="section-header center-text">
            <span className="eyebrow">Tailored For You</span>
            <h2>Solutions for Everyone</h2>
            <p>Specific services designed for your unique needs.</p>
          </div>
          <div className="solutions-grid">
            <div className="solution-card float-animation">
              <div className="solution-icon-wrapper">
                <span className="solution-icon">🔧</span>
              </div>
              <div className="solution-content">
                <h3>Need a Plumber?</h3>
                <p>Leaky taps or pipe issues? Get expert plumbers instantly.</p>
                <button className="text-btn" onClick={() => navigate('/instant-booking')}>Book Now →</button>
              </div>
            </div>
            <div className="solution-card float-animation-delayed">
              <div className="solution-icon-wrapper">
                <span className="solution-icon">💼</span>
              </div>
              <div className="solution-content">
                <h3>Want Work in Home?</h3>
                <p>Join our team of professionals and earn on your schedule.</p>
                <button className="text-btn" onClick={() => navigate('/signup')}>Join Us →</button>
              </div>
            </div>
            <div className="solution-card float-animation">
              <div className="solution-icon-wrapper">
                <span className="solution-icon">🎓</span>
              </div>
              <div className="solution-content">
                <h3>Need Help for Hostellite?</h3>
                <p>Affordable and quick services tailored for students.</p>
                <button className="text-btn" onClick={() => navigate('/instant-booking')}>Get Help →</button>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works-section">
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
