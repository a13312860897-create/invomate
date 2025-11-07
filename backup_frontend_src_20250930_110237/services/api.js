import axios from 'axios';

// Create axios instance with default config
// 根据环境使用不同的API地址
const API_ORIGIN = process.env.NODE_ENV === 'production' 
  ? (process.env.REACT_APP_API_URL || 'https://your-backend-api.herokuapp.com')
  : 'http://localhost:3002';
const computedBaseURL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: computedBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true', // Bypass localtunnel security page
  },
  withCredentials: true, // Enable sending cookies with cross-origin requests
});

// Request interceptor for API calls
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Save current path for redirect after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      // Clear the invalid token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;