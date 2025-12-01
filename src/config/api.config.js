// API Configuration for Home Helper Web App
// This configuration works with the shared backend used by both mobile and web apps

const API_CONFIG = {
  // Base URL for API requests
  // For development: localhost
  // For production: Update to your deployed backend URL
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',

  // API endpoints
  endpoints: {
    // Authentication
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify: '/auth/verify',
    },

    // Customers
    customers: {
      profile: '/customers/profile',
      update: '/customers/profile',
    },

    // Providers
    providers: {
      list: '/providers',
      detail: (id) => `/providers/${id}`,
      search: '/providers/search',
      categories: '/providers/categories',
    },

    // Bookings
    bookings: {
      create: '/bookings',
      list: '/bookings',
      detail: (id) => `/bookings/${id}`,
      update: (id) => `/bookings/${id}`,
      cancel: (id) => `/bookings/${id}/cancel`,
    },

    // Categories
    categories: {
      list: '/categories',
      detail: (id) => `/categories/${id}`,
    },

    // Reviews
    reviews: {
      create: '/reviews',
      list: '/reviews',
      update: (id) => `/reviews/${id}`,
    },

    // Health check
    health: '/health',
  },

  // Request timeout (milliseconds)
  timeout: 30000,

  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
}

export default API_CONFIG










