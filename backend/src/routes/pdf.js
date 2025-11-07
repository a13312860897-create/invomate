const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
// 使用新的PDF服务，包含法国法律条款和格式改进
const { generateInvoicePDFNew } = require('../services/pdfServiceNew');
const { Invoice } = require('../models');
const { InvoiceItem } = require('../models');
const { Client } = require('../models');
const { User } = require('../models');

// Get PDF for an invoice (view or download)
router.get('/invoices/:id/pdf', authenticateToken, async (req, res) => {
  console.log('PDF路由被调用，发票ID:', req.params.id);
  console.log('用户ID:', req.user.id);
  try {
    let invoice, client, invoiceItems;
    
    // 检查是否为内存数据库模式
    if (process.env.DB_TYPE === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      console.log('内存数据库模式，查找发票ID:', req.params.id);
      console.log('当前发票总数:', memoryDb.invoices.length);
      
      invoice = memoryDb.findInvoiceById(parseInt(req.params.id));
      console.log('查找结果:', invoice ? '找到发票' : '未找到发票');
      
      if (!invoice) {
        console.log('发票未找到，返回404');
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // 检查发票是否属于当前用户
      if (invoice.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // 获取客户和发票项目信息
      client = memoryDb.findClientById(invoice.clientId);
      invoiceItems = memoryDb.findInvoiceItemsByInvoiceId(invoice.id);
      
      // 修复客户字段映射：数据库使用company/name，PDF服务使用companyName/contactName
      if (client) {
        client.companyName = client.company;
        client.contactName = client.name;
        client.sirenNumber = client.siren;
        client.siretNumber = client.siret;
      }
      
      // 将关联数据添加到发票对象
      invoice.Client = client;
      invoice.InvoiceItems = invoiceItems || [];
    } else {
      // 对于Sequelize数据库
      invoice = await Invoice.findByPk(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // 检查发票是否属于当前用户
      if (invoice.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // 获取客户和发票项目信息
      const { Client } = require('../models');
      client = await Client.findByPk(invoice.clientId);
      invoiceItems = await require('../models').InvoiceItem.findAll({
        where: { invoiceId: invoice.id }
      });
      
      // 修复客户字段映射：数据库使用company/name，PDF服务使用companyName/contactName
      if (client) {
        client.companyName = client.company;
        client.contactName = client.name;
        client.sirenNumber = client.siren;
        client.siretNumber = client.siret;
      }
      
      // 将关联数据添加到发票对象
      invoice.Client = client;
      invoice.InvoiceItems = invoiceItems;
    }
    
    // Check if PDF already exists
    const pdfDir = path.join(__dirname, '../../', process.env.PDF_DIR || 'generated_pdfs');
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const pdfFileName = `Invoice-${invoice.invoiceNumber}-${dateStr}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    
    if (!fs.existsSync(pdfPath)) {
      // Generate PDF if it doesn't exist
      try {
        // 获取用户信息
        let userData;
        if (process.env.DB_TYPE === 'memory') {
          const memoryDb = require('../config/memoryDatabase');
          userData = memoryDb.findUserById(req.user.id);
        } else {
          userData = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
          });
        }
        
        // 使用新的PDF服务生成PDF，包含法国法律条款
        const pdfBuffer = await generateInvoicePDFNew(invoice, userData, client, 'fr');
        
        // 确保PDF目录存在
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }
        
        // 将PDF缓冲区写入文件
        fs.writeFileSync(pdfPath, pdfBuffer);
        
        // 更新发票的PDF URL（仅对Sequelize数据库）
        if (process.env.DB_TYPE !== 'memory') {
          const pdfUrl = `/api/invoices/${invoice.id}.pdf`;
          await Invoice.update(
            { pdfUrl },
            { where: { id: invoice.id } }
          );
        }
      } catch (error) {
        console.error('PDF生成错误:', error);
        return res.status(500).json({ message: 'Failed to generate PDF', error: error.message });
      }
    }
    
    // Serve the PDF
    const file = path.resolve(pdfPath);
    
    if (!fs.existsSync(file)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }
    
    // Check if the request is for download or view
    const download = req.query.download === 'true';
    
    if (download) {
      // Send file for download
      res.download(file, pdfFileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading PDF' });
        }
      });
    } else {
      // Send file for viewing
      res.sendFile(file);
    }
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate PDF for preview (without saving invoice)
router.post('/generate-preview', authenticateToken, async (req, res) => {
  try {
    console.log('收到PDF预览生成请求');
    console.log('请求数据:', JSON.stringify(req.body, null, 2));
    
    const { formData, client, user } = req.body;
    
    if (!formData || !client || !user) {
      console.error('缺少必需数据:', { 
        hasFormData: !!formData, 
        hasClient: !!client, 
        hasUser: !!user 
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required data: formData, client, or user'
      });
    }

    console.log('开始调用PDF生成服务...');
    console.log('formData:', formData);
    console.log('client:', client);
    console.log('user:', user);

    // 调用PDF生成服务
    const result = await generateInvoicePDFNew(formData, user, client);
    
    console.log('PDF生成服务返回结果:', {
      success: result?.success,
      hasBuffer: !!result?.buffer,
      bufferLength: result?.buffer?.length,
      filename: result?.filename,
      error: result?.error
    });
    
    if (!result.success) {
      console.error('PDF生成失败:', result.error);
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: result.error
      });
    }

    const pdfBuffer = result.buffer;
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('PDF生成失败：返回的buffer为空或无效');
      console.error('result对象:', result);
      return res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: 'PDF生成失败：返回的buffer为空或无效'
      });
    }

    console.log('PDF生成成功，buffer大小:', pdfBuffer.length);

    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // 发送PDF数据
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF预览生成错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;