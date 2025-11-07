const express = require('express');
const { Invoice, InvoiceItem, Client, User, TaxSetting, sequelize } = require('../models');

// 检查是否为内存数据库模式
const isMemoryMode = !sequelize;
const {
  authenticateToken,
  requireEmailVerification,
  requireSubscription,
  checkInvoiceOwnership,
  checkFeatureAccess
} = require('../middleware/auth');
const frenchComplianceValidator = require('../middleware/frenchComplianceValidator');
const { auditLogger, logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInvoiceEmail } = require('../services/emailService');
const { Op } = require('sequelize');
const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(auditLogger('invoices'));

// Helper function to generate invoice number
const generateInvoiceNumber = async (userId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Get count of invoices for this user in current month
  let count;
  
  if (process.env.DB_TYPE === 'memory') {
    // For memory database, use direct filtering
    const db = require('../config/memoryDatabase');
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const userInvoices = db.findInvoicesByUserId(userId);
    count = userInvoices.filter(invoice => new Date(invoice.createdAt) >= startOfMonth).length;
  } else {
    // For Sequelize database
    count = await Invoice.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: new Date(date.getFullYear(), date.getMonth(), 1)
        }
      }
    });
  }
  
  // Format: INV-YYYYMM-XXXX (where XXXX is sequential number)
  return `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
};

/**
 * @route GET /api/invoices
 * @desc Get all invoices for the authenticated user with filtering and pagination
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      clientId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const userId = req.user.id;

    if (isMemoryMode) {
      // 内存模式下的实现
      const memoryDb = require('../config/memoryDatabase');
      let allInvoices = memoryDb.invoices.filter(invoice => invoice.userId === userId);
      
      // Apply filters
      if (status) {
        allInvoices = allInvoices.filter(invoice => invoice.status === status);
      }

      if (clientId) {
        allInvoices = allInvoices.filter(invoice => invoice.clientId === parseInt(clientId));
      }

      if (dateFrom || dateTo) {
        allInvoices = allInvoices.filter(invoice => {
          const issueDate = new Date(invoice.issueDate || invoice.createdAt);
          if (dateFrom && issueDate < new Date(dateFrom)) return false;
          if (dateTo && issueDate > new Date(dateTo)) return false;
          return true;
        });
      }

      if (search) {
        const searchLower = search.toLowerCase();
        allInvoices = allInvoices.filter(invoice => {
          return (
            (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchLower)) ||
            (invoice.customerName && invoice.customerName.toLowerCase().includes(searchLower)) ||
            (invoice.customerEmail && invoice.customerEmail.toLowerCase().includes(searchLower))
          );
        });
      }

      // Sort invoices
      allInvoices.sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        
        if (sortOrder.toUpperCase() === 'DESC') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedInvoices = allInvoices.slice(offset, offset + parseInt(limit));
      const count = allInvoices.length;

      return res.json({
        success: true,
        data: {
          invoices: paginatedInvoices,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    // 数据库模式下的实现
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { userId };

    // Apply filters
    if (status) {
      whereClause.status = status;
    }

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (dateFrom || dateTo) {
      whereClause.issueDate = {};
      if (dateFrom) {
        whereClause.issueDate[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.issueDate[Op.lte] = new Date(dateTo);
      }
    }

    if (search) {
      whereClause[Op.or] = [
        { invoiceNumber: { [Op.iLike]: `%${search}%` } },
        { '$Client.name$': { [Op.iLike]: `%${search}%` } },
        { '$Client.email$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: whereClause,
      include: [{
        model: Client,
        attributes: ['id', 'name', 'email', 'company']
      }, {
        model: InvoiceItem
      }],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures'
    });
  }
});

/**
 * @route GET /api/invoices/:id
 * @desc Get a specific invoice by ID
 * @access Private
 */
router.get('/:id(\\d+)', checkInvoiceOwnership, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    console.log('Getting invoice with ID:', invoiceId);
    
    // 使用已经验证过的发票对象，但需要重新查找以包含关联数据
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{
        model: Client,
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }, {
        model: InvoiceItem
      }]
    });

    console.log('Found invoice:', invoice ? 'Yes' : 'No');
    if (invoice) {
      console.log('Invoice has Client:', invoice.Client ? 'Yes' : 'No');
      console.log('Invoice clientId:', invoice.clientId);
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture'
    });
  }
});

// Get default invoice for the authenticated user
router.get('/default', authenticateToken, async (req, res) => {
  try {
    let userId = req.user.id;
    
    // 在开发模式或内存数据库模式下，如果当前用户没有发票，获取系统中的第一个发票作为默认发票
    if (process.env.NODE_ENV === 'development' || process.env.DB_TYPE === 'memory') {
      // 获取当前用户的所有发票
      const userInvoices = await Invoice.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'ASC']]
      });
      
      if (userInvoices.length === 0) {
        // 获取系统中的第一个发票
        const allInvoices = await Invoice.findAll({
          order: [['createdAt', 'ASC']],
          limit: 1
        });
        
        if (allInvoices.length > 0) {
          const firstInvoice = allInvoices[0];
          // 获取完整的发票数据，包括关联的客户端和项目
          const fullInvoice = await Invoice.findOne({
            where: { id: firstInvoice.id },
            include: [
              {
                model: Client,
                attributes: ['id', 'name', 'email', 'company']
              },
              {
                model: InvoiceItem
              }
            ]
          });
          
          if (fullInvoice) {
            return res.json({ defaultInvoice: fullInvoice });
          }
        }
      } else {
        // 用户有发票，返回第一个发票的完整数据
        const defaultInvoice = await Invoice.findOne({
          where: { id: userInvoices[0].id },
          include: [
            {
              model: Client,
              attributes: ['id', 'name', 'email', 'company']
            },
            {
              model: InvoiceItem
            }
          ]
        });
        
        if (defaultInvoice) {
          return res.json({ defaultInvoice });
        }
      }
    }
    
    // 标准模式：获取用户创建的第一个发票
    const defaultInvoice = await Invoice.findOne({
      where: { userId: userId },
      include: [
        {
          model: Client,
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: InvoiceItem
        },

      ],
      order: [['createdAt', 'ASC']], // Get the oldest invoice (default)
      limit: 1
    });
    
    if (!defaultInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ defaultInvoice });
  } catch (error) {
    console.error('Get default invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new invoice
router.post('/', authenticateToken, frenchComplianceValidator, async (req, res) => {
  try {
    // Handle both old format (buyer, items, invoiceDate) and new format (clientId, items, issueDate)
    const { 
      buyer, 
      items, 
      invoiceDate, 
      deliveryDate, 

      // New format fields
      clientId,
      issueDate,
      dueDate,
      notes,
      status = 'draft',
      subtotal,
      taxAmount,
      total,
      totalAmount
    } = req.body;
    
    // Determine which format is being used
    const isNewFormat = clientId && issueDate;
    
    if (isNewFormat) {
      // New format validation
      if (!clientId || !items || items.length === 0 || !issueDate) {
        return res.status(400).json({ message: 'Missing required fields: clientId, items, issueDate' });
      }
    } else {
      // Old format validation
      if (!buyer || !items || items.length === 0 || !invoiceDate) {
        return res.status(400).json({ message: 'Missing required fields: buyer, items, invoiceDate' });
      }
    }
    
    // Get invoice mode settings
    let settings;
    if (process.env.DB_TYPE === 'memory') {
      // For memory database
      const db = require('../config/memoryDatabase');
      settings = db.findSettingsByUserId(req.user.id);
    } else {
      // For Sequelize database - we need to create a Settings model if it doesn't exist
      // For now, we'll use TaxSetting as a fallback
      settings = await TaxSetting.findOne({
        where: { userId: req.user.id }
      });
    }
    
    if (!settings) {
      return res.status(400).json({ message: 'Invoice mode settings not configured' });
    }
    
    const invoiceMode = settings.invoiceMode || 'intl';
    const seller = settings.modeConfig ? settings.modeConfig[invoiceMode] : null;
    
    // Generate invoice number
    let invoiceNumber = await generateInvoiceNumber(req.user.id);
    
    // Customize invoice number based on invoice mode
    if (invoiceMode === 'fr') {
      invoiceNumber = `FR-${invoiceNumber}`;
    }
    
    // Calculate totals based on tax settings (only for old format)
    let calculatedSubtotal = 0;
    let totalTax = 0;
    
    if (!isNewFormat) {
      const newInvoiceItems = items.map(item => {
        const itemTotal = (item.quantity || 1) * (item.unitPrice || item.unitPriceHT || 0);
        let itemTax = 0;
        let taxRate = item.vatRate || item.taxRate || 0;
        
        // Apply default tax rate if not specified
        if (settings.taxRate && !item.vatRate && !item.taxRate) {
          taxRate = settings.taxRate;
        }
        
        // Apply country-specific tax rules
        if (invoiceMode === 'fr' && settings.taxSystem === 'vat') {
          // France-specific VAT rules
          taxRate = settings.taxRate;
        }
        
        itemTax = itemTotal * taxRate / 100;
        calculatedSubtotal += itemTotal;
        totalTax += itemTax;
        
        return {
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.unitPriceHT || 0,
          taxRate,
          taxAmount: itemTax,
          total: itemTotal + itemTax
        };
      });
    }
    
    const calculatedTotal = calculatedSubtotal + totalTax;
    
    let client;
    
    if (isNewFormat) {
      // New format: get existing client by ID
      client = await Client.findOne({
        where: { 
          id: clientId,
          userId: req.user.id
        }
      });
      
      if (!client) {
        return res.status(400).json({ message: 'Client not found' });
      }
    } else {
      // Old format: create a client for this buyer if it doesn't exist
      client = await Client.findOne({
        where: { 
          userId: req.user.id,
          email: buyer.email || '',
          name: buyer.name
        }
      });
      
      if (!client) {
        client = await Client.create({
          userId: req.user.id,
          name: buyer.name,
          email: buyer.email || '',
          company: buyer.company || '',
          address: buyer.address || '',
          taxId: buyer.taxId || ''
        });
      }
    }
    
    // Create invoice
    const invoiceData = {
      userId: req.user.id,
      clientId: client.id,
      invoiceNumber,
      status: isNewFormat ? status : 'draft',
      invoiceMode
    };
    
    if (isNewFormat) {
      // New format: use provided dates and totals
      invoiceData.issueDate = issueDate;
      invoiceData.dueDate = dueDate;
      invoiceData.subtotal = subtotal || 0;
      invoiceData.taxAmount = taxAmount || 0;
      invoiceData.total = total || totalAmount || 0;
      invoiceData.notes = notes || '';
    } else {
       // Old format: use calculated values
       invoiceData.issueDate = invoiceDate;
       invoiceData.dueDate = deliveryDate || invoiceDate;
       invoiceData.subtotal = calculatedSubtotal;
       invoiceData.taxAmount = totalTax;
       invoiceData.total = calculatedTotal;
     }
    
    // Include seller information from settings
    if (seller) {
      invoiceData.sellerCompanyName = seller.companyName || '';
      invoiceData.sellerCompanyAddress = seller.companyAddress || '';
      invoiceData.sellerTaxId = seller.taxId || '';
      invoiceData.sellerSiren = seller.siren || null;
    }
    
    const newInvoice = await Invoice.create(invoiceData);
    
    // Add invoice items
    for (const item of items) {
      let itemData;
      
      if (isNewFormat) {
        // New format: use item data directly
        const itemSubtotal = (item.quantity || 1) * (item.unitPrice || 0);
        const itemTaxAmount = itemSubtotal * ((item.taxRate || 0) / 100);
        
        itemData = {
          invoiceId: newInvoice.id,
          description: item.description || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 0,
          taxAmount: itemTaxAmount,
          total: itemSubtotal + itemTaxAmount
        };
      } else {
        // Old format: use existing logic
        itemData = {
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.unitPriceHT || 0,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          total: item.total
        };
      }
      
      const newItem = await InvoiceItem.create(itemData);
      

    }
    

    
    // Get complete invoice with relations
    const completeInvoice = await Invoice.findOne({
      where: { id: newInvoice.id },
      include: [
        {
          model: Client
        },
        {
          model: InvoiceItem
        }
      ]
    });
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: completeInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an invoice
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      clientId,
      issueDate,
      dueDate,
      notes, 
      status, 
      items,
      invoiceMode,

    } = req.body;
    
    // Convert string ID to integer for proper comparison
    const invoiceId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId: userId }
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Verify client belongs to user if clientId is provided
    if (clientId) {
      const client = await Client.findOne({
        where: { id: clientId, userId: req.user.id }
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
    }
    
    // Get user's tax settings
    const taxSetting = await TaxSetting.findOne({
      where: { userId: req.user.id }
    });
    
    // If items are provided, recalculate totals and update items
    if (items && items.length > 0) {
      // Get existing invoice items to delete their custom field values
      const existingItems = await InvoiceItem.findAll({
        where: { invoiceId: invoiceId }
      });
      

      
      // Delete existing items
      await InvoiceItem.destroy({
        where: { invoiceId: invoiceId }
      });
      
      // Calculate new totals based on tax settings
      let subtotal = 0;
      let totalTax = 0;
      
      const mode = invoiceMode || invoice.invoiceMode || 'intl';
      
      const updatedInvoiceItems = items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        let itemTax = 0;
        let taxRate = item.taxRate || 0;
        
        // Apply tax based on invoice mode
        if (taxSetting) {
          // Apply default tax rate if not specified
          if (!item.taxRate) {
            taxRate = taxSetting.taxRate;
          }
          
          // Apply country-specific tax rules
          if (mode === 'fr' && taxSetting.taxSystem === 'vat') {
            // France-specific VAT rules
            taxRate = taxSetting.taxRate;
          }
        }
        
        itemTax = itemTotal * taxRate / 100;
        subtotal += itemTotal;
        totalTax += itemTax;
        
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate,
          taxAmount: itemTax,
          total: itemTotal + itemTax
        };
      });
      
      const total = subtotal + totalTax;
      
      // Update invoice totals
      await Invoice.update(
        {
          subtotal,
          taxAmount: totalTax,
          total
        },
        { where: { id: invoiceId } }
      );
      
      // Add new invoice items
      for (const item of items) {
        const newItem = await InvoiceItem.create({
          invoiceId: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          total: item.total
        });
        

      }
    }
    
    // Update invoice fields
    await Invoice.update(
      {
        clientId: clientId || invoice.clientId,
        issueDate: issueDate || invoice.issueDate,
        dueDate: dueDate || invoice.dueDate,
        notes: notes !== undefined ? notes : invoice.notes,
        status: status || invoice.status,
        invoiceMode: invoiceMode !== undefined ? invoiceMode : invoice.invoiceMode
      },
      { where: { id: invoiceId } }
    );
    

    
    // Get complete invoice with relations
    const updatedInvoice = await Invoice.findOne({
      where: { id: invoiceId },
      include: [
        {
          model: Client
        },
        {
          model: InvoiceItem
        }
      ]
    });
    
    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an invoice
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Delete request for invoice ID: ${req.params.id} (type: ${typeof req.params.id}), User ID: ${req.user.id} (type: ${typeof req.user.id})`);
    
    // Convert string ID to integer for proper comparison
    const invoiceId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    
    console.log(`Converted - Invoice ID: ${invoiceId} (type: ${typeof invoiceId}), User ID: ${userId} (type: ${typeof userId})`);
    
    // Find the invoice
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId: userId }
    });
    
    console.log('Found invoice:', invoice ? `ID: ${invoice.id}, UserID: ${invoice.userId}` : 'null');
    
    if (!invoice) {
      // Check if invoice exists for any user (debugging)
      const anyInvoice = await Invoice.findByPk(req.params.id);
      console.log('Invoice exists for any user:', anyInvoice ? `ID: ${anyInvoice.id}, UserID: ${anyInvoice.userId}` : 'null');
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Delete invoice items first (cascade delete will handle this automatically)
    const deleteResult = await Invoice.destroy({ where: { id: invoiceId } });
    console.log('Delete result:', deleteResult);
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update invoice status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Convert string ID to integer for proper comparison
    const invoiceId = parseInt(req.params.id, 10);
    const userId = parseInt(req.user.id, 10);
    
    // Find the invoice
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId: userId }
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Update invoice status
    await Invoice.update(
      { status },
      { where: { id: invoiceId } }
    );
    
    // Get complete invoice with relations
    const updatedInvoice = await Invoice.findOne({
      where: { id: invoiceId },
      include: [
        {
          model: Client
        },
        {
          model: InvoiceItem
        }
      ]
    });
    
    res.json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/invoices/:id/send
 * @desc Send invoice via email
 * @access Private
 */
router.post('/:id/send', checkInvoiceOwnership, checkFeatureAccess('email_sending'), async (req, res) => {
  try {
    const { customMessage, sendCopy = false } = req.body;
    
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{
        model: Client,
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    if (!invoice.Client.email) {
      return res.status(400).json({
        success: false,
        message: 'Le client n\'a pas d\'adresse email'
      });
    }

    // Send invoice email
    const emailResult = await sendInvoiceEmail(invoice.id, {
      customMessage,
      sendCopy
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }

    // Update invoice status
    await invoice.update({
      status: 'sent',
      sentAt: new Date()
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.INVOICE_SENT,
      {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: invoice.Client.email,
        sendCopy,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Facture envoyée avec succès'
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la facture'
    });
  }
});

/**
 * @route GET /api/invoices/:id/pdf
 * @desc Generate and download invoice PDF
 * @access Private
 */
router.get('/:id/pdf', checkInvoiceOwnership, async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{
        model: Client,
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }, {
        model: InvoiceItem
      }]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.INVOICE_PDF_GENERATED,
      {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF'
    });
  }
});

/**
 * @route GET /api/invoices/stats/dashboard
 * @desc Get dashboard statistics
 * @access Private
 */
router.get('/stats/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentYear = new Date(currentDate.getFullYear(), 0, 1);

    if (isMemoryMode) {
      // 内存模式下的简化实现
      const allInvoices = await Invoice.findAll({ where: { userId } });
      
      // 计算总体统计
      const totalInvoices = allInvoices.length;
      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      const pendingInvoices = allInvoices.filter(inv => ['sent', 'overdue'].includes(inv.status));
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      const overdueCount = allInvoices.filter(inv => inv.status === 'overdue').length;
      
      // 计算本月统计
      const monthlyInvoices = allInvoices.filter(inv => 
        new Date(inv.createdAt) >= currentMonth
      );
      const monthlyPaidInvoices = monthlyInvoices.filter(inv => inv.status === 'paid');
      const monthlyRevenue = monthlyPaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      // 获取最近发票
      const recentInvoices = await Invoice.findAll({
        where: { userId },
        include: [{
          model: Client,
          attributes: ['name', 'company']
        }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      // 简化的支付趋势（过去6个月）
      const paymentTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        const monthStr = monthStart.toISOString().slice(0, 7);
        
        const monthPaidInvoices = paidInvoices.filter(inv => {
          const updatedAt = new Date(inv.updatedAt);
          return updatedAt >= monthStart && updatedAt <= monthEnd;
        });
        
        paymentTrends.push({
          month: monthStr,
          revenue: monthPaidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0),
          count: monthPaidInvoices.length
        });
      }
      
      return res.json({
        success: true,
        data: {
          overview: {
            totalInvoices,
            totalRevenue,
            pendingAmount,
            overdueCount,
            monthlyInvoices: monthlyInvoices.length,
            monthlyRevenue
          },
          recentInvoices,
          paymentTrends
        }
      });
    }

    // Get overall statistics
    const overallStats = await Invoice.findAll({
      where: { userId },
      attributes: [
        [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'totalInvoices'],
        [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal('CASE WHEN status = \'paid\' THEN total ELSE 0 END')), 'totalRevenue'],
        [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal('CASE WHEN status IN (\'sent\', \'overdue\') THEN total ELSE 0 END')), 'pendingAmount'],
        [Invoice.sequelize.fn('COUNT', Invoice.sequelize.literal('CASE WHEN status = \'overdue\' THEN 1 END')), 'overdueCount']
      ],
      raw: true
    });

    // Get monthly statistics
    const monthlyStats = await Invoice.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: currentMonth }
      },
      attributes: [
        [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'monthlyInvoices'],
        [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal('CASE WHEN status = \'paid\' THEN total ELSE 0 END')), 'monthlyRevenue']
      ],
      raw: true
    });

    // Get recent invoices
    const recentInvoices = await Invoice.findAll({
      where: { userId },
      include: [{
        model: Client,
        attributes: ['name', 'company']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get payment trends (last 6 months)
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
    const paymentTrends = await Invoice.findAll({
      where: {
        userId,
        status: 'paid',
        updatedAt: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('updatedAt')), 'month'],
        [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total')), 'revenue'],
        [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'count']
      ],
      group: [Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('updatedAt'))],
      order: [[Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('updatedAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalInvoices: parseInt(overallStats[0]?.totalInvoices || 0),
          totalRevenue: parseFloat(overallStats[0]?.totalRevenue || 0),
          pendingAmount: parseFloat(overallStats[0]?.pendingAmount || 0),
          overdueCount: parseInt(overallStats[0]?.overdueCount || 0),
          monthlyInvoices: parseInt(monthlyStats[0]?.monthlyInvoices || 0),
          monthlyRevenue: parseFloat(monthlyStats[0]?.monthlyRevenue || 0)
        },
        recentInvoices,
        paymentTrends
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;