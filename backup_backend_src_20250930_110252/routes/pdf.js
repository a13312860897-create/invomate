const express = require('express');
const path = require('path');
const fs = require('fs');
const { Invoice } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateInvoicePDF } = require('../services/pdfService');
const router = express.Router();

// Get PDF for an invoice (view or download)
router.get('/invoices/:id.pdf', authenticateToken, async (req, res) => {
  try {
    // 首先通过ID查找发票
    const invoice = await Invoice.findByPk(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // 检查发票是否属于当前用户
    if (invoice.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // 获取客户和发票项目信息
    const { Client } = require('../models');
    const client = await Client.findByPk(invoice.clientId);
    const invoiceItems = await require('../models').InvoiceItem.findAll({
      where: { invoiceId: invoice.id }
    });
    
    // 将关联数据添加到发票对象
    invoice.Client = client;
    invoice.InvoiceItems = invoiceItems;
    
    // Check if PDF already exists
    const pdfDir = path.join(__dirname, '../../', process.env.PDF_DIR || 'generated_pdfs');
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const pdfFileName = `Invoice-${invoice.invoiceNumber}-${dateStr}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    
    if (!fs.existsSync(pdfPath)) {
      // Generate PDF if it doesn't exist
      const pdfResult = await generateInvoicePDF(invoice.id, req.user.id);
      
      if (!pdfResult.success) {
        return res.status(500).json({ message: 'Failed to generate PDF', error: pdfResult.error });
      }
      
      // Update invoice with PDF URL
      const pdfUrl = `/api/invoices/${invoice.id}.pdf`;
      await Invoice.update(
        { pdfUrl },
        { where: { id: invoice.id } }
      );
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

module.exports = router;