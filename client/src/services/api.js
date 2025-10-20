import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api', // Use environment variable or default to '/api'
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (can add auth tokens here later)
api.interceptors.request.use(
  (config) => {
    // Add any request modifications here (e.g., auth headers)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.error || data.details);
          break;
        case 404:
          console.error('Not Found:', data.error);
          break;
        case 500:
          console.error('Server Error:', data.error);
          break;
        default:
          console.error('API Error:', data.error || 'Unknown error');
      }
      
      // Return a user-friendly error
      return Promise.reject({
        message: data.error || 'Request failed',
        details: data.details || null,
        status,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response from server');
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

export default api;
