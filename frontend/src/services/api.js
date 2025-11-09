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

// 离线模式与默认数据：在后端不可用时，返回合理的空数据以降低日志噪声
let offlineWarned = false;
const offlineStubs = [
  {
    test: (url) => url.startsWith('/settings/profile'),
    build: () => ({ data: { id: 'offline', name: '离线用户', email: '' } })
  },
  {
    test: (url) => url === '/clients' || url.startsWith('/clients?') || url.startsWith('/clients/'),
    build: () => ([])
  },
  {
    test: (url) => url.startsWith('/dashboard/stats'),
    build: () => ({ success: true, data: { totals: { invoiceCount: 0, revenue: 0 }, charts: {} } })
  },
  {
    test: (url) => url.startsWith('/invoices/stats/dashboard'),
    build: () => ({ recentInvoices: [], overdueInvoices: [], summary: {} })
  },
  {
    test: (url) => url.startsWith('/dashboard/unified-chart-data'),
    build: () => ({
      success: true,
      data: {
        statusDistribution: { distribution: [], totalInvoices: 0 },
        revenueTrend: {
          totalRevenue: 0,
          totalCount: 0,
          // 组件期望的字段：trendData（包含 date/time 与 revenue）
          trendData: []
        }
      }
    })
  },
  {
    test: (url) => url.startsWith('/notifications'),
    build: () => ({ success: true, data: { notifications: [], total: 0, unreadCount: 0 } })
  },
  // 订阅相关（统一到 /api/subscriptions/* 路径）
  {
    test: (url) => url.startsWith('/subscriptions/current'),
    build: () => ({ subscription: { status: 'inactive', plan: 'free', current_period_end: null } })
  },
  {
    test: (url) => url.startsWith('/subscriptions/features'),
    build: () => ({ features: {} })
  },
  {
    test: (url) => url.startsWith('/subscriptions/history'),
    build: () => ({ history: [] })
  },
  {
    test: (url) => url.startsWith('/subscriptions/billing-history'),
    build: () => ({ bills: [] })
  },
];

function tryBuildOfflineResponse(originalRequest) {
  const url = originalRequest?.url || '';
  const stub = offlineStubs.find(s => s.test(url));
  if (!stub) return null;
  const data = stub.build();
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: originalRequest,
    request: { offline: true }
  };
}

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
    // 网络错误（后端不可达）时，返回离线默认数据，避免前端产生大量错误日志
    const isNetworkError = !error.response && (
      error.code === 'ERR_NETWORK' || /Network Error/i.test(error.message || '')
    );
    if (isNetworkError) {
      if (!offlineWarned) {
        offlineWarned = true;
        // 仅提示一次，避免刷屏
        console.warn('[API] 后端不可用，进入离线模式：返回默认数据以降低噪声');
        try { window.__API_OFFLINE__ = true; } catch (_) {}
      }

      const offlineResponse = tryBuildOfflineResponse(originalRequest);
      if (offlineResponse) {
        return Promise.resolve(offlineResponse);
      }
      // 无匹配默认数据的请求，保持原有错误以便调用方明确失败
    }
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      // 兼容 HashRouter：优先使用 hash 作为当前路径
      const hashPath = (typeof window !== 'undefined' && window.location?.hash)
        ? window.location.hash.replace(/^#/, '')
        : '';
      const pathName = (typeof window !== 'undefined' && window.location?.pathname)
        ? window.location.pathname
        : '/';
      const currentPath = (hashPath || pathName || '/').toLowerCase();
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
        // 使用 HashRouter 的登录地址，避免 GitHub Pages 的 404
        try {
          if (typeof window !== 'undefined') {
            window.location.hash = '#/login';
          }
        } catch (_) {
          // 回退方案
          window.location.href = '/#/login';
        }
      }
      // 若是登录页或登录请求，交由调用方处理错误，不进行强制刷新
    }
    return Promise.reject(error);
  }
);

export default api;