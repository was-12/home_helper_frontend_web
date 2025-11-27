// API Service for making HTTP requests to the backend
// This service works with the shared backend used by both mobile and web apps

import API_CONFIG from '../config/api.config'

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.timeout = API_CONFIG.timeout
    this.defaultHeaders = API_CONFIG.headers
  }

  // Get auth token from localStorage
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Get authorization headers
  getAuthHeaders() {
    const token = this.getAuthToken()
    if (token) {
      return {
        ...this.defaultHeaders,
        Authorization: `Bearer ${token}`,
      }
    }
    return this.defaultHeaders
  }

  // Build full URL
  buildURL(endpoint) {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    return `${this.baseURL}/${cleanEndpoint}`
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        error: true,
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      }
    } else if (error.request) {
      // Request made but no response received
      return {
        error: true,
        message: 'Network error. Please check your connection.',
        status: null,
      }
    } else {
      // Error in request setup
      return {
        error: true,
        message: error.message || 'An unexpected error occurred',
        status: null,
      }
    }
  }

  // Generic request method
  async request(method, endpoint, data = null, options = {}) {
    const url = this.buildURL(endpoint)
    const headers = options.headers || this.getAuthHeaders()
    
    const config = {
      method,
      headers,
      ...options,
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data)
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      const responseData = await response.json().catch(() => null)

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: responseData,
          },
        }
      }

      return {
        error: false,
        data: responseData,
        status: response.status,
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          error: true,
          message: 'Request timeout. Please try again.',
          status: null,
        }
      }
      return this.handleError(error)
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options)
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options)
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options)
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options)
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options)
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch('http://localhost:3000/health')
      const data = await response.json()
      return {
        error: false,
        data,
        status: response.status,
      }
    } catch (error) {
      return {
        error: true,
        message: 'Backend server is not reachable',
        status: null,
      }
    }
  }
}

// Export singleton instance
export default new ApiService()







