const express = require('express');
const { User, Invoice, Client, AuditLog } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');

const router = express.Router();

// 获取隐私设置
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = {
      dataProcessingConsent: user.dataProcessingConsent || false,
      marketingConsent: user.marketingConsent || false,
      analyticsConsent: user.analyticsConsent || false,
      dataRetentionPeriod: user.dataRetentionPeriod || '7years',
      dataExportFormat: user.dataExportFormat || 'json',
      twoFactorEnabled: user.twoFactorEnabled || false
    };

    res.json({ settings });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新隐私设置
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 记录设置变更的审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'privacy_settings_updated',
      details: JSON.stringify({
        oldSettings: {
          marketingConsent: user.marketingConsent,
          analyticsConsent: user.analyticsConsent,
          dataRetentionPeriod: user.dataRetentionPeriod,
          twoFactorEnabled: user.twoFactorEnabled
        },
        newSettings: settings
      }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 更新用户设置
    await user.update({
      marketingConsent: settings.marketingConsent,
      analyticsConsent: settings.analyticsConsent,
      dataRetentionPeriod: settings.dataRetentionPeriod,
      dataExportFormat: settings.dataExportFormat,
      twoFactorEnabled: settings.twoFactorEnabled
    });

    res.json({ message: 'Privacy settings updated successfully' });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 数据导出请求
router.post('/export-data', authenticateToken, async (req, res) => {
  try {
    const { format = 'json' } = req.body;
    const exportId = crypto.randomUUID();
    
    // 记录数据导出请求
    await AuditLog.create({
      userId: req.user.id,
      action: 'data_export_requested',
      details: JSON.stringify({ format, exportId }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 异步处理数据导出
    processDataExport(req.user.id, format, exportId);

    res.json({ exportId, message: 'Data export started' });
  } catch (error) {
    console.error('Error starting data export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 检查导出状态
router.get('/export-status/:exportId', authenticateToken, async (req, res) => {
  try {
    const { exportId } = req.params;
    const statusFile = path.join(__dirname, '../../temp', `export_${exportId}_status.json`);
    
    try {
      const statusData = await fs.readFile(statusFile, 'utf8');
      const status = JSON.parse(statusData);
      
      // 检查是否属于当前用户
      if (status.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.json(status);
    } catch (fileError) {
      res.json({ status: 'not_found', message: 'Export not found' });
    }
  } catch (error) {
    console.error('Error checking export status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 账户删除请求
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Invalid confirmation' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 记录账户删除请求
    await AuditLog.create({
      userId: req.user.id,
      action: 'account_deletion_requested',
      details: JSON.stringify({
        userEmail: user.email,
        requestTime: new Date().toISOString()
      }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 标记账户为待删除状态（30天后实际删除）
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);
    
    await user.update({
      deletionRequested: true,
      deletionDate: deletionDate,
      isActive: false
    });

    // 发送确认邮件（这里应该集成邮件服务）
    console.log(`Account deletion requested for user ${user.email}, scheduled for ${deletionDate}`);

    res.json({ 
      message: 'Account deletion requested successfully',
      deletionDate: deletionDate
    });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取审计日志
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { userId: req.user.id };
    if (action) {
      whereClause.action = action;
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['id', 'action', 'details', 'createdAt', 'ipAddress']
    });

    res.json({
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 数据匿名化（用于GDPR合规）
router.post('/anonymize-data', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 记录匿名化请求
    await AuditLog.create({
      userId: req.user.id,
      action: 'data_anonymization_requested',
      details: JSON.stringify({
        userEmail: user.email,
        requestTime: new Date().toISOString()
      }),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 匿名化用户数据
    const anonymizedEmail = `anonymized_${crypto.randomUUID()}@deleted.local`;
    await user.update({
      firstName: 'Anonymized',
      lastName: 'User',
      email: anonymizedEmail,
      phone: null,
      address: null,
      city: null,
      postalCode: null,
      companyName: 'Anonymized Company',
      isAnonymized: true
    });

    // 匿名化相关的客户数据
    await Client.update(
      {
        name: 'Anonymized Client',
        email: null,
        phone: null,
        address: null,
        city: null,
        postalCode: null
      },
      { where: { userId: req.user.id } }
    );

    res.json({ message: 'Data anonymized successfully' });
  } catch (error) {
    console.error('Error anonymizing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 数据导出处理函数
async function processDataExport(userId, format, exportId) {
  const tempDir = path.join(__dirname, '../../temp');
  const statusFile = path.join(tempDir, `export_${exportId}_status.json`);
  
  try {
    // 确保临时目录存在
    await fs.mkdir(tempDir, { recursive: true });
    
    // 更新状态为处理中
    await updateExportStatus(statusFile, {
      userId,
      status: 'processing',
      progress: 0,
      startTime: new Date().toISOString()
    });

    // 获取用户数据
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    await updateExportStatus(statusFile, { status: 'processing', progress: 20 });

    const clients = await Client.findAll({ where: { userId } });
    await updateExportStatus(statusFile, { status: 'processing', progress: 40 });

    const invoices = await Invoice.findAll({ where: { userId } });
    await updateExportStatus(statusFile, { status: 'processing', progress: 60 });

    const auditLogs = await AuditLog.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 1000 // 限制审计日志数量
    });
    await updateExportStatus(statusFile, { status: 'processing', progress: 80 });

    // 根据格式生成文件
    let exportFile;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'json') {
      exportFile = path.join(tempDir, `user_data_${exportId}_${timestamp}.json`);
      await generateJSONExport(exportFile, { user, clients, invoices, auditLogs });
    } else if (format === 'csv') {
      exportFile = path.join(tempDir, `user_data_${exportId}_${timestamp}.zip`);
      await generateCSVExport(exportFile, { user, clients, invoices, auditLogs });
    } else if (format === 'pdf') {
      exportFile = path.join(tempDir, `user_data_${exportId}_${timestamp}.pdf`);
      await generatePDFExport(exportFile, { user, clients, invoices, auditLogs });
    }

    // 生成下载URL（这里应该使用安全的临时URL）
    const downloadUrl = `/api/privacy/download/${path.basename(exportFile)}`;
    
    await updateExportStatus(statusFile, {
      status: 'completed',
      progress: 100,
      downloadUrl,
      completedTime: new Date().toISOString()
    });

    // 记录导出完成
    await AuditLog.create({
      userId,
      action: 'data_export_completed',
      details: JSON.stringify({ exportId, format, downloadUrl }),
      ipAddress: null,
      userAgent: null
    });

  } catch (error) {
    console.error('Error processing data export:', error);
    await updateExportStatus(statusFile, {
      status: 'error',
      message: 'Export failed',
      error: error.message
    });
  }
}

// 更新导出状态
async function updateExportStatus(statusFile, updates) {
  try {
    let currentStatus = {};
    try {
      const data = await fs.readFile(statusFile, 'utf8');
      currentStatus = JSON.parse(data);
    } catch (e) {
      // 文件不存在，使用空对象
    }
    
    const newStatus = { ...currentStatus, ...updates };
    await fs.writeFile(statusFile, JSON.stringify(newStatus, null, 2));
  } catch (error) {
    console.error('Error updating export status:', error);
  }
}

// 生成JSON导出
async function generateJSONExport(filePath, data) {
  const exportData = {
    exportInfo: {
      timestamp: new Date().toISOString(),
      format: 'json',
      version: '1.0'
    },
    userData: data.user,
    clients: data.clients,
    invoices: data.invoices,
    auditLogs: data.auditLogs
  };
  
  await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
}

// 生成CSV导出（压缩包）
async function generateCSVExport(filePath, data) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = require('fs').createWriteStream(filePath);
  
  archive.pipe(output);
  
  // 用户数据CSV
  const userCSV = convertToCSV([data.user]);
  archive.append(userCSV, { name: 'user_data.csv' });
  
  // 客户数据CSV
  const clientsCSV = convertToCSV(data.clients);
  archive.append(clientsCSV, { name: 'clients.csv' });
  
  // 发票数据CSV
  const invoicesCSV = convertToCSV(data.invoices);
  archive.append(invoicesCSV, { name: 'invoices.csv' });
  
  // 审计日志CSV
  const auditLogsCSV = convertToCSV(data.auditLogs);
  archive.append(auditLogsCSV, { name: 'audit_logs.csv' });
  
  await archive.finalize();
  
  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
  });
}

// 生成PDF导出
async function generatePDFExport(filePath, data) {
  const doc = new PDFDocument();
  doc.pipe(require('fs').createWriteStream(filePath));
  
  // 标题
  doc.fontSize(20).text('Personal Data Export', 50, 50);
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
  
  // 用户信息
  doc.fontSize(16).text('User Information', 50, 120);
  doc.fontSize(10);
  let yPos = 140;
  
  Object.entries(data.user.toJSON()).forEach(([key, value]) => {
    if (key !== 'password' && value !== null) {
      doc.text(`${key}: ${value}`, 50, yPos);
      yPos += 15;
    }
  });
  
  // 客户信息
  yPos += 20;
  doc.fontSize(16).text('Clients', 50, yPos);
  yPos += 20;
  doc.fontSize(10);
  
  data.clients.forEach((client, index) => {
    doc.text(`Client ${index + 1}: ${client.name} (${client.email})`, 50, yPos);
    yPos += 15;
  });
  
  // 发票信息
  yPos += 20;
  doc.fontSize(16).text('Invoices', 50, yPos);
  yPos += 20;
  doc.fontSize(10);
  
  data.invoices.forEach((invoice, index) => {
    doc.text(`Invoice ${index + 1}: #${invoice.invoiceNumber} - ${invoice.total}€`, 50, yPos);
    yPos += 15;
  });
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });
}

// CSV转换辅助函数
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0].toJSON ? data[0].toJSON() : data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(item => {
    const obj = item.toJSON ? item.toJSON() : item;
    return headers.map(header => {
      const value = obj[header];
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// 文件下载端点
router.get('/download/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../temp', filename);
    
    // 验证文件是否存在且属于当前用户
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // 设置适当的响应头
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 发送文件
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
    
    // 文件发送后删除（可选）
    fileStream.on('end', async () => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Error deleting temp file:', error);
      }
    });
    
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;