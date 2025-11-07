const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { getDatabase } = require('./config/dbFactory');
const { scheduleReminderCron } = require('./services/reminderService');
const { createDefaultUser } = require('./scripts/initDefaultUser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3003', 
    'http://localhost:3004', 
    'http://localhost:3005',
    'https://*.netlify.app',
    'https://invomate.app',
    'https://*.loca.lt'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));

// Add bypass header for localtunnel
app.use((req, res, next) => {
  res.header('bypass-tunnel-reminder', 'true');
  next();
});

// Increase request header size limit to prevent 431 errors
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

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/invoices', require('./routes/pdf'));
app.use('/api/invoices', require('./routes/invoiceSending'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/paddle', require('./routes/paddle'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/invoice-qa', require('./routes/invoiceQA'));
app.use('/api/e-invoice', require('./routes/eInvoice'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/settings/invoice-mode', require('./routes/settings.invoice-mode'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/privacy', require('./routes/privacy'));
app.use('/api/invoice-templates', require('./routes/invoiceTemplates'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/debug', require('./routes/debug'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Invoice SaaS API is running' });
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
    // 获取数据库实例
    const db = getDatabase();
    
    // 测试数据库连接
    await db.authenticate();
    console.log('Database connection established successfully.');
    
    // 同步数据库模型
    await db.sync();
    
    // 初始化默认用户
    await createDefaultUser();
    
    // 在内存模式下自动创建测试发票数据
    const isMemoryMode = process.env.DB_TYPE === 'memory' || !process.env.DB_TYPE;
    if (isMemoryMode) {
      const { createTestInvoices } = require('../scripts/create-test-invoices');
      await createTestInvoices();
    }
    
    // 启动催款提醒定时任务
    scheduleReminderCron();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();

module.exports = app;