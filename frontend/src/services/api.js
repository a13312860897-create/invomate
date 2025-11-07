import axios from 'axios';

// Create axios instance with default config
// 开发环境直接连接后端 3001 端口，避免代理异常
const isProd = process.env.NODE_ENV === 'production';
const devOrigin = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_ORIGIN = isProd
  ? (process.env.REACT_APP_API_URL || 'https://your-backend-api.herokuapp.com')
  : devOrigin;
const computedBaseURL = `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: computedBaseURL,
  timeout: 30000, // 增加到30秒，因为邮件发送可能需要更长时间
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true', // Bypass localtunnel security page
  },
  withCredentials: true, // 发送 cookie（若使用）
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
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      const currentPath = (window.location?.pathname || '/').toLowerCase();
      const isLoginRoute = currentPath.includes('/login');
      const isRegisterRoute = currentPath.includes('/register');
      const isAuthRoute = isLoginRoute || isRegisterRoute;
      const isAuthRequest = (originalRequest?.url || '').includes('/auth/login') ||
                            (originalRequest?.url || '').includes('/auth/register') ||
                            (originalRequest?.url || '').includes('/auth/profile');

      // 清除无效token
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];

      // 仅在非登录/注册页且不是登录请求时进行重定向，避免刷新循环
      if (!isAuthRoute && !isAuthRequest) {
        // 记录当前路径以便成功登录后返回
        try { localStorage.setItem('redirectAfterLogin', currentPath); } catch (_) {}
        window.location.href = '/login';
      }
      // 若是登录页或登录请求，交由调用方处理错误，不进行强制刷新
    }
    return Promise.reject(error);
  }
);

export default api;