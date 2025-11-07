const { User, Client, Invoice, InvoiceItem, AuditLog } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const archiver = require('archiver');
const { encrypt, maskSensitiveData } = require('../utils/encryption');
const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');

/**
 * 数据导出服务类
 */
class DataExportService {
  constructor() {
    this.exportFormats = ['json', 'csv', 'pdf', 'xml'];
    this.maxExportSize = 100 * 1024 * 1024; // 100MB
    this.exportDirectory = path.join(__dirname, '../../exports');
    this.ensureExportDirectory();
  }

  /**
   * 确保导出目录存在
   */
  async ensureExportDirectory() {
    try {
      await fs.access(this.exportDirectory);
    } catch (error) {
      await fs.mkdir(this.exportDirectory, { recursive: true });
    }
  }

  /**
   * 导出用户数据
   * @param {number} userId - 用户ID
   * @param {string} format - 导出格式
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportUserData(userId, format = 'json', options = {}) {
    try {
      // 验证格式
      if (!this.exportFormats.includes(format)) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      // 记录导出请求
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.DATA_EXPORT_REQUESTED,
        {
          format,
          options,
          requestTime: new Date().toISOString()
        }
      );

      // 收集用户数据
      const userData = await this.collectUserData(userId, options);

      // 根据格式导出
      let exportResult;
      switch (format) {
        case 'json':
          exportResult = await this.exportToJSON(userId, userData, options);
          break;
        case 'csv':
          exportResult = await this.exportToCSV(userId, userData, options);
          break;
        case 'pdf':
          exportResult = await this.exportToPDF(userId, userData, options);
          break;
        case 'xml':
          exportResult = await this.exportToXML(userId, userData, options);
          break;
        default:
          throw new Error(`Export format ${format} not implemented`);
      }

      // 记录导出完成
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.DATA_EXPORT_COMPLETED,
        {
          format,
          fileSize: exportResult.fileSize,
          recordCount: exportResult.recordCount,
          exportTime: new Date().toISOString()
        }
      );

      return exportResult;
    } catch (error) {
      // 记录导出错误
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.DATA_EXPORT_FAILED,
        {
          format,
          error: error.message,
          errorTime: new Date().toISOString()
        }
      );
      throw error;
    }
  }

  /**
   * 收集用户数据
   * @param {number} userId - 用户ID
   * @param {Object} options - 收集选项
   * @returns {Object} 用户数据
   */
  async collectUserData(userId, options = {}) {
    const {
      includePersonalData = true,
      includeInvoices = true,
      includeClients = true,
      includeAuditLogs = false,
      dateRange = null,
      anonymize = false
    } = options;

    const userData = {
      exportMetadata: {
        userId,
        exportDate: new Date().toISOString(),
        exportOptions: options,
        dataVersion: '1.0'
      }
    };

    // 用户基本信息
    if (includePersonalData) {
      const user = await User.findByPk(userId);
      if (user) {
        userData.personalData = {
          id: user.id,
          email: anonymize ? maskSensitiveData(user.email, 'email') : user.email,
          firstName: anonymize ? 'Anonymized' : user.firstName,
          lastName: anonymize ? 'User' : user.lastName,
          company: anonymize ? 'Anonymized Company' : user.company,
          phone: anonymize ? null : user.phone,
          address: anonymize ? null : user.address,
          city: anonymize ? null : user.city,
          postalCode: anonymize ? null : user.postalCode,
          country: user.country,
          vatNumber: anonymize ? null : user.vatNumber,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          preferences: {
            language: user.language,
            currency: user.currency,
            timezone: user.timezone,
            dateFormat: user.dateFormat,
            dataRetentionPeriod: user.dataRetentionPeriod
          },
          privacy: {
            dataProcessingConsent: user.dataProcessingConsent,
            marketingConsent: user.marketingConsent,
            analyticsConsent: user.analyticsConsent,
            twoFactorEnabled: user.twoFactorEnabled
          }
        };
      }
    }

    // 客户数据
    if (includeClients) {
      const clientQuery = {
        where: { userId },
        order: [['createdAt', 'DESC']]
      };

      if (dateRange) {
        clientQuery.where.createdAt = {
          [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
        };
      }

      const clients = await Client.findAll(clientQuery);
      userData.clients = clients.map(client => ({
        id: client.id,
        name: anonymize ? 'Anonymized Client' : client.name,
        email: anonymize ? null : client.email,
        phone: anonymize ? null : client.phone,
        address: anonymize ? null : client.address,
        city: anonymize ? null : client.city,
        postalCode: anonymize ? null : client.postalCode,
        country: client.country,
        vatNumber: anonymize ? null : client.vatNumber,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      }));
    }

    // 发票数据
    if (includeInvoices) {
      const invoiceQuery = {
        where: { userId },
        include: [{
          model: InvoiceItem,
          as: 'items'
        }],
        order: [['createdAt', 'DESC']]
      };

      if (dateRange) {
        invoiceQuery.where.createdAt = {
          [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
        };
      }

      const invoices = await Invoice.findAll(invoiceQuery);
      userData.invoices = invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        currency: invoice.currency,
        notes: anonymize ? null : invoice.notes,
        items: invoice.items ? invoice.items.map(item => ({
          id: item.id,
          description: anonymize ? 'Anonymized Item' : item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.total
        })) : [],
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt
      }));
    }

    // 审计日志
    if (includeAuditLogs) {
      const auditQuery = {
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 1000 // 限制审计日志数量
      };

      if (dateRange) {
        auditQuery.where.createdAt = {
          [Op.between]: [new Date(dateRange.start), new Date(dateRange.end)]
        };
      }

      const auditLogs = await AuditLog.findAll(auditQuery);
      userData.auditLogs = auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        ipAddress: anonymize ? maskSensitiveData(log.ipAddress, 'ip') : log.ipAddress,
        userAgent: anonymize ? 'Anonymized' : log.userAgent,
        success: log.success,
        details: anonymize ? null : log.details,
        createdAt: log.createdAt
      }));
    }

    return userData;
  }

  /**
   * 导出为JSON格式
   * @param {number} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportToJSON(userId, userData, options = {}) {
    const filename = `user_data_${userId}_${Date.now()}.json`;
    const filepath = path.join(this.exportDirectory, filename);

    const jsonData = JSON.stringify(userData, null, options.pretty ? 2 : 0);
    await fs.writeFile(filepath, jsonData, 'utf8');

    const stats = await fs.stat(filepath);

    return {
      format: 'json',
      filename,
      filepath,
      fileSize: stats.size,
      recordCount: this.countRecords(userData),
      downloadUrl: `/api/privacy/download/${filename}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小时后过期
    };
  }

  /**
   * 导出为CSV格式
   * @param {number} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportToCSV(userId, userData, options = {}) {
    const timestamp = Date.now();
    const files = [];

    // 导出个人数据
    if (userData.personalData) {
      const personalFilename = `personal_data_${userId}_${timestamp}.csv`;
      const personalFilepath = path.join(this.exportDirectory, personalFilename);
      
      const personalWriter = createObjectCsvWriter({
        path: personalFilepath,
        header: [
          { id: 'field', title: 'Field' },
          { id: 'value', title: 'Value' }
        ]
      });

      const personalRecords = Object.entries(userData.personalData)
        .filter(([key, value]) => typeof value !== 'object')
        .map(([key, value]) => ({ field: key, value: String(value) }));

      await personalWriter.writeRecords(personalRecords);
      files.push(personalFilename);
    }

    // 导出客户数据
    if (userData.clients && userData.clients.length > 0) {
      const clientsFilename = `clients_${userId}_${timestamp}.csv`;
      const clientsFilepath = path.join(this.exportDirectory, clientsFilename);
      
      const clientsWriter = createObjectCsvWriter({
        path: clientsFilepath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'name', title: 'Name' },
          { id: 'email', title: 'Email' },
          { id: 'phone', title: 'Phone' },
          { id: 'address', title: 'Address' },
          { id: 'city', title: 'City' },
          { id: 'postalCode', title: 'Postal Code' },
          { id: 'country', title: 'Country' },
          { id: 'vatNumber', title: 'VAT Number' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });

      await clientsWriter.writeRecords(userData.clients);
      files.push(clientsFilename);
    }

    // 导出发票数据
    if (userData.invoices && userData.invoices.length > 0) {
      const invoicesFilename = `invoices_${userId}_${timestamp}.csv`;
      const invoicesFilepath = path.join(this.exportDirectory, invoicesFilename);
      
      const invoicesWriter = createObjectCsvWriter({
        path: invoicesFilepath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'invoiceNumber', title: 'Invoice Number' },
          { id: 'clientId', title: 'Client ID' },
          { id: 'issueDate', title: 'Issue Date' },
          { id: 'dueDate', title: 'Due Date' },
          { id: 'status', title: 'Status' },
          { id: 'subtotal', title: 'Subtotal' },
          { id: 'taxAmount', title: 'Tax Amount' },
          { id: 'total', title: 'Total' },
          { id: 'currency', title: 'Currency' },
          { id: 'createdAt', title: 'Created At' }
        ]
      });

      const invoiceRecords = userData.invoices.map(invoice => ({
        ...invoice,
        items: undefined // 移除嵌套的items数组
      }));

      await invoicesWriter.writeRecords(invoiceRecords);
      files.push(invoicesFilename);
    }

    // 创建ZIP文件
    const zipFilename = `user_data_csv_${userId}_${timestamp}.zip`;
    const zipFilepath = path.join(this.exportDirectory, zipFilename);
    
    await this.createZipArchive(files.map(f => path.join(this.exportDirectory, f)), zipFilepath);

    // 清理临时CSV文件
    for (const file of files) {
      await fs.unlink(path.join(this.exportDirectory, file));
    }

    const stats = await fs.stat(zipFilepath);

    return {
      format: 'csv',
      filename: zipFilename,
      filepath: zipFilepath,
      fileSize: stats.size,
      recordCount: this.countRecords(userData),
      downloadUrl: `/api/privacy/download/${zipFilename}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * 导出为PDF格式
   * @param {number} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportToPDF(userId, userData, options = {}) {
    const filename = `user_data_${userId}_${Date.now()}.pdf`;
    const filepath = path.join(this.exportDirectory, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // 标题
    doc.fontSize(20).text('User Data Export Report', { align: 'center' });
    doc.moveDown();

    // 导出信息
    doc.fontSize(12)
       .text(`Export Date: ${new Date().toLocaleDateString()}`)
       .text(`User ID: ${userId}`)
       .text(`Export Format: PDF`)
       .moveDown();

    // 个人数据
    if (userData.personalData) {
      doc.fontSize(16).text('Personal Information', { underline: true });
      doc.moveDown(0.5);
      
      Object.entries(userData.personalData).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          doc.fontSize(10).text(`${key}: ${value}`);
        }
      });
      doc.moveDown();
    }

    // 客户数据摘要
    if (userData.clients) {
      doc.fontSize(16).text('Clients Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Total Clients: ${userData.clients.length}`);
      
      userData.clients.slice(0, 10).forEach((client, index) => {
        doc.text(`${index + 1}. ${client.name} (${client.email})`);
      });
      
      if (userData.clients.length > 10) {
        doc.text(`... and ${userData.clients.length - 10} more clients`);
      }
      doc.moveDown();
    }

    // 发票数据摘要
    if (userData.invoices) {
      doc.fontSize(16).text('Invoices Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Total Invoices: ${userData.invoices.length}`);
      
      const totalAmount = userData.invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      doc.text(`Total Amount: ${totalAmount.toFixed(2)}`);
      
      userData.invoices.slice(0, 10).forEach((invoice, index) => {
        doc.text(`${index + 1}. ${invoice.invoiceNumber} - ${invoice.total} (${invoice.status})`);
      });
      
      if (userData.invoices.length > 10) {
        doc.text(`... and ${userData.invoices.length - 10} more invoices`);
      }
      doc.moveDown();
    }

    // 页脚
    doc.fontSize(8)
       .text('This report contains personal data and should be handled according to GDPR regulations.', 
             50, doc.page.height - 50, { align: 'center' });

    doc.end();

    // 等待PDF生成完成
    await new Promise((resolve) => {
      stream.on('finish', resolve);
    });

    const stats = await fs.stat(filepath);

    return {
      format: 'pdf',
      filename,
      filepath,
      fileSize: stats.size,
      recordCount: this.countRecords(userData),
      downloadUrl: `/api/privacy/download/${filename}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * 导出为XML格式
   * @param {number} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @param {Object} options - 导出选项
   * @returns {Object} 导出结果
   */
  async exportToXML(userId, userData, options = {}) {
    const filename = `user_data_${userId}_${Date.now()}.xml`;
    const filepath = path.join(this.exportDirectory, filename);

    const xmlData = this.convertToXML(userData);
    await fs.writeFile(filepath, xmlData, 'utf8');

    const stats = await fs.stat(filepath);

    return {
      format: 'xml',
      filename,
      filepath,
      fileSize: stats.size,
      recordCount: this.countRecords(userData),
      downloadUrl: `/api/privacy/download/${filename}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * 转换为XML格式
   * @param {Object} data - 数据对象
   * @param {string} rootElement - 根元素名称
   * @returns {string} XML字符串
   */
  convertToXML(data, rootElement = 'userData') {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${rootElement}>\n`;
    xml += this.objectToXML(data, 1);
    xml += `</${rootElement}>\n`;
    return xml;
  }

  /**
   * 对象转XML
   * @param {*} obj - 对象
   * @param {number} indent - 缩进级别
   * @returns {string} XML字符串
   */
  objectToXML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let xml = '';

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        xml += `${spaces}<item index="${index}">\n`;
        xml += this.objectToXML(item, indent + 1);
        xml += `${spaces}</item>\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        if (typeof value === 'object' && value !== null) {
          xml += `${spaces}<${safeKey}>\n`;
          xml += this.objectToXML(value, indent + 1);
          xml += `${spaces}</${safeKey}>\n`;
        } else {
          const safeValue = String(value).replace(/[<>&"']/g, (match) => {
            const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
            return entities[match];
          });
          xml += `${spaces}<${safeKey}>${safeValue}</${safeKey}>\n`;
        }
      });
    } else {
      xml += `${spaces}${String(obj)}\n`;
    }

    return xml;
  }

  /**
   * 创建ZIP归档
   * @param {Array} filePaths - 文件路径数组
   * @param {string} outputPath - 输出路径
   * @returns {Promise} Promise对象
   */
  async createZipArchive(filePaths, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      filePaths.forEach(filePath => {
        const filename = path.basename(filePath);
        archive.file(filePath, { name: filename });
      });

      archive.finalize();
    });
  }

  /**
   * 计算记录数量
   * @param {Object} userData - 用户数据
   * @returns {number} 记录总数
   */
  countRecords(userData) {
    let count = 0;
    
    if (userData.personalData) count += 1;
    if (userData.clients) count += userData.clients.length;
    if (userData.invoices) count += userData.invoices.length;
    if (userData.auditLogs) count += userData.auditLogs.length;
    
    return count;
  }

  /**
   * 清理过期的导出文件
   */
  async cleanupExpiredExports() {
    try {
      const files = await fs.readdir(this.exportDirectory);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      for (const file of files) {
        const filePath = path.join(this.exportDirectory, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up expired export file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired exports:', error);
    }
  }

  /**
   * 获取导出状态
   * @param {string} filename - 文件名
   * @returns {Object|null} 导出状态
   */
  async getExportStatus(filename) {
    try {
      const filePath = path.join(this.exportDirectory, filename);
      const stats = await fs.stat(filePath);
      
      return {
        filename,
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        available: true
      };
    } catch (error) {
      return {
        filename,
        available: false,
        error: 'File not found or expired'
      };
    }
  }
}

// 创建服务实例
const dataExportService = new DataExportService();

// 启动清理任务
setInterval(() => {
  dataExportService.cleanupExpiredExports();
}, 60 * 60 * 1000); // 每小时执行一次

module.exports = {
  DataExportService,
  dataExportService
};