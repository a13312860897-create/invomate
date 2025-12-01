const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { getDatabase } = require('./config/dbFactory');
let scheduleReminderCron = null;
try {
  if (String(process.env.DISABLE_REMINDER_CRON).toLowerCase() !== 'true') {
    ({ scheduleReminderCron } = require('./services/reminderService'));
  }
} catch (e) {
  console.warn(`Reminder service disabled: ${e.message}`);
}
const { createDefaultUser } = require('./scripts/initDefaultUser');

// Route imports
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const invoiceNumberRoutes = require('./routes/invoiceNumber');
const clientRoutes = require('./routes/clients');
const settingsRoutes = require('./routes/settings');
const reminderRoutes = require('./routes/reminderRoutes');
const paddleRoutes = require('./routes/paddle');
const dashboardRoutes = require('./routes/dashboard');
// const testRoutes = require('./routes/test-routes'); // File does not exist, temporarily commented
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
// const ocrRoutes = require('./routes/ocr'); // MVP阶段暂时禁用OCR功能
const reportRoutes = require('./routes/reports');
const subscriptionRoutes = require('./routes/subscriptions'); // Subscription management routes
const emailConfigRoutes = require('./routes/emailConfig');
let hubspotRoutes;
try {
  hubspotRoutes = require('./routes/integrations/hubspot');
} catch (e) {
  hubspotRoutes = null;
}
// const emailTemplatesRoutes = require('./routes/emailTemplates'); // Email template routes
// const invoiceSendingRoutes = require('./routes/invoiceSending'); // MVP阶段暂时禁用，使用AI路由的邮件发送功能
const invoiceTemplatesRoutes = require('./routes/invoiceTemplates'); // Invoice template routes
const createTemplateRoutes = require('./routes/templateRoutes'); // Unified template render routes
// const invoiceSendingRoutes = require('./routes/invoiceSending'); // 启用发票发送路由
const pdfRoutes = require('./routes/pdf'); // PDF routes
const pdfEmailRoutes = require('./routes/pdfEmail'); // PDF email routes
const timezoneRoutes = require('./routes/timezone'); // Timezone routes
// const salesforceRoutes = require('./routes/salesforce'); // File does not exist, temporarily commented
// const frenchEReportingRoutes = require('./routes/frenchEReporting'); // File does not exist, temporarily commented

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());

// Stripe webhook raw body parser must be registered BEFORE any JSON parser
// to ensure signature verification receives the unmodified payload
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
// Paddle webhook raw body parser must also be registered BEFORE JSON parser
// so we can verify HMAC against the raw payload on Vultr
app.use('/api/paddle/webhook', express.raw({ type: 'application/json' }));

// CORS configuration: allow local dev ports and configurable prod origins
const baseWhitelist = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3006',
  'http://127.0.0.1:3006',
  'http://127.0.0.1:3002',
  'https://invomate.app'
];

// Allow injecting additional origins via env
const envFrontendUrl = process.env.FRONTEND_URL;
const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const dynamicWhitelist = [
  ...baseWhitelist,
  ...(envFrontendUrl ? [envFrontendUrl] : []),
  ...envAllowedOrigins
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser requests (no origin) and whitelisted origins
    if (!origin || dynamicWhitelist.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Blocked by CORS: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
};

app.use(cors(corsOptions));
// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

// Global parsers (registered AFTER webhook raw parser)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 性能监控中间件 - MVP阶段暂时禁用
// app.use(performanceMiddleware);

// Timezone detection middleware
const timezoneMiddleware = require('./middleware/timezoneMiddleware');
app.use(timezoneMiddleware);

// Add bypass header for localtunnel
app.use((req, res, next) => {
  res.header('bypass-tunnel-reminder', 'true');
  next();
});

// 全局请求日志中间件 - 用于调试
if (String(process.env.ENABLE_GLOBAL_REQUEST_LOG || '').toLowerCase() === 'true') {
  app.use((req, res, next) => {
    console.log(`\n=== Global Request Log ===`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`Original URL: ${req.originalUrl}`);
    console.log(`IP: ${req.ip}`);
    console.log(`User-Agent: ${req.get('User-Agent')}`);
    console.log(`Authorization: ${req.get('Authorization') ? 'present' : 'missing'}`);
    console.log(`Content-Type: ${req.get('Content-Type')}`);
    if (req.method === 'POST' || req.method === 'PUT') {
      const bodyStr = JSON.stringify(req.body);
      console.log(`Body size: ${bodyStr.length} chars`);
      console.log(`Body first 200 chars: ${bodyStr.substring(0, 200)}`);
    }
    console.log(`==================\n`);
    next();
  });
}

// Increase request header size limit to prevent 431 errors
// Note: JSON/urlencoded parsers are already registered above; avoid duplicate parsing

// Set server timeout and header size limits
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/generated_pdfs', express.static(path.join(__dirname, '../generated_pdfs')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoice-numbers', invoiceNumberRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/paddle', paddleRoutes); // Paddle payment integration routes
app.use('/api/stripe', require('./routes/stripe')); // Stripe webhook routes
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
// app.use('/api/test', testRoutes); // File does not exist, temporarily commented
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
// app.use('/api/ocr', ocrRoutes); // MVP阶段暂时禁用OCR功能
app.use('/api/reports', reportRoutes);
app.use('/api/subscriptions', subscriptionRoutes); // Subscription management routes
app.use('/api/email-config', emailConfigRoutes);
if (hubspotRoutes) {
  app.use('/api/integrations/hubspot', hubspotRoutes);
}
// app.use('/api/email-templates', emailTemplatesRoutes); // Email template routes
// app.use('/api/invoice-sending', invoiceSendingRoutes); // 启用发票发送路由
app.use('/api/invoice-templates', invoiceTemplatesRoutes); // Invoice template routes
app.use('/api/templates', createTemplateRoutes()); // Unified template render routes
app.use('/api/pdf', pdfRoutes); // PDF routes
app.use('/api/pdf-email', pdfEmailRoutes); // PDF email routes
app.use('/api/timezone', timezoneRoutes); // Timezone routes
// app.use('/api/salesforce', salesforceRoutes); // File does not exist, temporarily commented
// app.use('/api/french-ereporting', frenchEReportingRoutes); // File does not exist, temporarily commented

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Invoice SaaS API is running' });
});

// Test JWT_SECRET endpoint
app.get('/api/test-jwt-secret', (req, res) => {
  res.json({ 
    jwtSecret: process.env.JWT_SECRET ? 'exists' : 'missing',
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const { User, Invoice } = require('./models');
const { Op } = require('sequelize');
const DataService = require('./services/DataService');
app.get('/api/admin/db-check', async (req, res) => {
  try {
    const secret = String(req.query.secret || '');
    const configured = String(process.env.ADMIN_DEBUG_SECRET || '');
    if (!configured || secret !== configured) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    const email = String(req.query.email || '').trim().toLowerCase();
    const month = String(req.query.month || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'email required' });
    }
    const validMonth = /^\d{4}-\d{2}$/.test(month) ? month : (() => {
      const d = new Date();
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    })();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'user not found', email });
    }
    const parts = validMonth.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m - 1, new Date(y, m, 0).getUTCDate(), 23, 59, 59));
    const byIssueMonth = await Invoice.findAll({
      where: {
        userId: user.id,
        issueDate: { [Op.gte]: start, [Op.lte]: end }
      },
      attributes: ['id', 'invoiceNumber', 'issueDate', 'status', 'total', 'totalAmount'],
      order: [['issueDate', 'ASC']]
    });
    const paidInMonth = await Invoice.findAll({
      where: {
        userId: user.id,
        status: 'paid',
        paidDate: { [Op.gte]: start, [Op.lte]: end }
      },
      attributes: ['id', 'invoiceNumber', 'paidDate', 'total', 'totalAmount'],
      order: [['paidDate', 'ASC']]
    });
    const paidNoDateIssueMonth = await Invoice.findAll({
      where: {
        userId: user.id,
        status: 'paid',
        paidDate: null,
        issueDate: { [Op.gte]: start, [Op.lte]: end }
      },
      attributes: ['id', 'invoiceNumber', 'issueDate', 'total', 'totalAmount'],
      order: [['issueDate', 'ASC']]
    });
    const totalInvoicesAmount = byIssueMonth.reduce((s, i) => s + (parseFloat(i.totalAmount || i.total) || 0), 0);
    const totalRevenue = [...paidInMonth, ...paidNoDateIssueMonth].reduce((s, i) => s + (parseFloat(i.totalAmount || i.total) || 0), 0);
    const samplesAll = byIssueMonth.slice(0, 10).map(i => ({ id: i.id, no: i.invoiceNumber, issueDate: i.issueDate, total: i.totalAmount || i.total, status: i.status }));
    const samplesPaid = [...paidInMonth, ...paidNoDateIssueMonth].slice(0, 10).map(i => ({ id: i.id, no: i.invoiceNumber, paidDate: i.paidDate || i.issueDate, total: i.totalAmount || i.total }));
    res.json({
      success: true,
      data: {
        email,
        userId: user.id,
        month: validMonth,
        counts: {
          byIssueMonth: byIssueMonth.length,
          paidInMonth: paidInMonth.length + paidNoDateIssueMonth.length
        },
        amounts: {
          totalInvoicesAmount,
          totalRevenue
        },
        samples: {
          all: samplesAll,
          paid: samplesPaid
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'internal_error', details: String(error && error.message || error) });
  }
});

app.get('/api/admin/unified-chart-data', async (req, res) => {
  try {
    const secret = String(req.query.secret || '');
    const configured = String(process.env.ADMIN_DEBUG_SECRET || '');
    if (!configured || secret !== configured) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    const email = String(req.query.email || '').trim().toLowerCase();
    const month = String(req.query.month || '').trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'email required' });
    }
    const validMonth = /^\d{4}-\d{2}$/.test(month) ? month : (() => {
      const d = new Date();
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    })();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'user not found', email });
    }
    const [y, m] = validMonth.split('-').map(n => parseInt(n, 10));
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m - 1, new Date(y, m, 0).getUTCDate(), 23, 59, 59));

    const byIssueMonth = await Invoice.findAll({
      where: { userId: user.id, issueDate: { [Op.gte]: start, [Op.lte]: end } },
      attributes: ['id', 'invoiceNumber', 'issueDate', 'status', 'total', 'totalAmount'],
      order: [['issueDate', 'ASC']]
    });
    const paidByPaidDate = await Invoice.findAll({
      where: { userId: user.id, status: 'paid', paidDate: { [Op.gte]: start, [Op.lte]: end } },
      attributes: ['id', 'invoiceNumber', 'paidDate', 'issueDate', 'total', 'totalAmount'],
      order: [['paidDate', 'ASC']]
    });
    const paidByIssueNoPaid = await Invoice.findAll({
      where: { userId: user.id, status: 'paid', paidDate: null, issueDate: { [Op.gte]: start, [Op.lte]: end } },
      attributes: ['id', 'invoiceNumber', 'issueDate', 'total', 'totalAmount']
    });
    const seen = new Set();
    const paidUnion = [];
    [...paidByPaidDate, ...paidByIssueNoPaid].forEach(i => {
      const k = i.id || i.invoiceNumber;
      if (!seen.has(k)) { seen.add(k); paidUnion.push(i); }
    });

    const statusCounts = {};
    const statusAmounts = {};
    let totalAmount = 0;
    byIssueMonth.forEach(i => {
      const s = i.status || 'unknown';
      const amt = parseFloat(i.totalAmount || i.total) || 0;
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      statusAmounts[s] = (statusAmounts[s] || 0) + amt;
      totalAmount += amt;
    });
    const distribution = Object.keys(statusCounts).map(s => ({
      status: s,
      count: statusCounts[s],
      amount: statusAmounts[s],
      percentage: byIssueMonth.length > 0 ? ((statusCounts[s] / byIssueMonth.length) * 100).toFixed(1) : '0.0'
    }));

    const pendingAmount = Number((statusAmounts['pending'] || 0) + (statusAmounts['sent'] || 0));
    const overdueAmount = Number(statusAmounts['overdue'] || 0);
    const paidAmount = Number(statusAmounts['paid'] || 0);

    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const trendData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0];
      const dayPaid = paidUnion.filter(i => {
        const dt = (i.paidDate || i.issueDate);
        const iso = (dt instanceof Date ? dt.toISOString().split('T')[0] : String(dt).split('T')[0]);
        return iso === key;
      });
      const dayRevenue = dayPaid.reduce((s, i) => s + (parseFloat(i.totalAmount || i.total) || 0), 0);
      trendData.push({ date: key, revenue: dayRevenue, count: dayPaid.length });
    }

    const revenueTrend = {
      month: validMonth,
      totalRevenue: paidUnion.reduce((s, i) => s + (parseFloat(i.totalAmount || i.total) || 0), 0),
      totalCount: paidUnion.length,
      trendData,
      paidInvoices: paidUnion.slice(0, 10).map(i => ({ id: i.id, invoiceNumber: i.invoiceNumber, total: i.totalAmount || i.total, paidDate: i.paidDate || i.issueDate }))
    };
    const statusDistribution = {
      month: validMonth,
      totalInvoices: byIssueMonth.length,
      distribution,
      summary: { 
        totalAmount, 
        statusCounts, 
        statusAmounts,
        pendingAmount,
        overdueAmount,
        paidAmount
      },
      totals: {
        totalInvoicesAmount: totalAmount,
        pendingAmount,
        overdueAmount,
        paidAmount
      },
      metrics: {
        pendingAmount,
        overdueAmount,
        paidAmount
      }
    };
    const report = {
      userId: user.id,
      month: validMonth,
      counts: { byIssueMonth: byIssueMonth.length, paidInMonth: paidUnion.length },
      amounts: { totalInvoicesAmount: totalAmount, totalRevenue: revenueTrend.totalRevenue },
      distribution,
      trend: trendData,
      samples: {
        all: byIssueMonth.slice(0, 10).map(i => ({ id: i.id, no: i.invoiceNumber, issueDate: i.issueDate, total: i.totalAmount || i.total, status: i.status })),
        paid: revenueTrend.paidInvoices
      }
    };
    const cards = {
      month: validMonth,
      totalRevenue: revenueTrend.totalRevenue,
      totalInvoices: statusDistribution.totalInvoices,
      pendingAmount,
      overdueAmount
    };
    res.json({ success: true, data: { month: validMonth, statusDistribution, revenueTrend, cards, report, metadata: { userId: user.id, generatedAt: new Date().toISOString() } } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'internal_error', details: String(error && error.message || error) });
  }
});

// Public Paddle client token endpoint
app.get('/api/paddle/client-token-public', (req, res) => {
  try {
    const token = process.env.PADDLE_CLIENT_TOKEN || process.env.PADDLE_CLIENT_SIDE_TOKEN || process.env.REACT_APP_PADDLE_CLIENT_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Client token not configured' });
    }
    const environment = process.env.PADDLE_ENVIRONMENT || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
    res.json({ token, environment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get client token' });
  }
});

// Dev utilities
const env = String(process.env.NODE_ENV || '').toLowerCase();
const enableDevTools = env === 'development' || process.env.ENABLE_DEV_TOOLS === 'true';
if (enableDevTools) {
  let requireDevMode;
  try {
    ({ requireDevMode } = require('./middleware/auth'));
  } catch (e) {
    requireDevMode = (req, res) => res.status(404).json({ success: false, message: 'Not found' });
  }
  app.post('/api/dev/seed', requireDevMode, (req, res) => {
    try {
      const memoryDb = require('./config/memoryDatabase');
      memoryDb.initializeTestDataSync?.();
      return res.json({ success: true, message: 'Seeded test data' });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post('/api/dev/clear', requireDevMode, (req, res) => {
    try {
      const memoryDb = require('./config/memoryDatabase');
      memoryDb.clearTestData?.();
      return res.json({ success: true, message: 'Cleared test data' });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Get database instance
    const db = getDatabase();
    
    // Test database connection
    await db.authenticate();
    console.log('Database connection established successfully.');
    
    // Synchronize database models
    await db.sync();
    
    // Initialize default user
    await createDefaultUser();
    const isMemoryMode = process.env.DB_TYPE === 'memory' || !process.env.DB_TYPE;
    if (isMemoryMode) {
      const memoryDb = require('./config/memoryDatabase');
      memoryDb.clearTestData();
    }
    
    // Start reminder email scheduled task
    if (typeof scheduleReminderCron === 'function') {
      scheduleReminderCron();
    }
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;