const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { getDatabase } = require('./config/dbFactory');
const { scheduleReminderCron } = require('./services/reminderService');
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

// Increase request header size limit to prevent 431 errors
// Keep JSON/urlencoded parsers AFTER webhook raw registration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb', parameterLimit: 50000 }));

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
    
    // Auto-create test invoice data in memory mode - disabled to fix data inconsistency issues
    const isMemoryMode = process.env.DB_TYPE === 'memory' || !process.env.DB_TYPE;
    if (isMemoryMode && process.env.CREATE_TEST_DATA === 'true') {
      const { createTestInvoices } = require('../scripts/create-test-invoices');
      await createTestInvoices();
    }
    
    // Start reminder email scheduled task
    scheduleReminderCron();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();

module.exports = app;