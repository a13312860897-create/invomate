const express = require('express');
const { Invoice, InvoiceItem, Client, User, TaxSetting, sequelize } = require('../models');
const InvoiceValidator = require('../utils/invoiceValidator');

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
const { validateInvoiceNumber, validateInvoiceNumberSequence, validateInvoiceData } = require('../middleware/invoiceValidation');
const { auditLogger, logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const { generateInvoicePDFNew } = require('../services/pdfServiceNew');
const { sendInvoiceEmail } = require('../services/emailService');
const { Op } = require('sequelize');
const router = express.Router();

// 公开路由 - 不需要认证
/**
 * @route GET /api/invoices/payment/:token
 * @desc Get invoice details by payment token (public route)
 * @access Public
 */
router.get('/payment/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const paymentLink = memoryDb.paymentLinks?.find(link => 
        link.token === token && 
        link.status === 'active' && 
        new Date() < new Date(link.expiresAt)
      );
      
      if (!paymentLink) {
        return res.status(404).json({
          success: false,
          message: 'Lien de paiement invalide ou expiré'
        });
      }
      
      const invoice = memoryDb.findInvoiceById(paymentLink.invoiceId);
      const client = memoryDb.findClientById(invoice.clientId);
      const items = memoryDb.findInvoiceItemsByInvoiceId(invoice.id);
      
      return res.json({
        success: true,
        data: {
          invoice: {
            ...invoice,
            Client: client,
            InvoiceItems: items
          },
          paymentMethod: paymentLink.paymentMethod,
          clientSecret: paymentLink.stripeClientSecret,
          token: paymentLink.token
        }
      });
    }
    
    // PostgreSQL mode (if needed later)
    return res.status(501).json({
      success: false,
      message: 'Not implemented for PostgreSQL mode'
    });
    
  } catch (error) {
    console.error('Get invoice by payment token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la facture'
    });
  }
});

/**
 * @route POST /api/invoices/payment/:token/payment-intent
 * @desc Create a Stripe payment intent using payment token (public route)
 * @access Public
 */
router.post('/payment/:token/payment-intent', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const paymentLink = memoryDb.paymentLinks?.find(link => 
        link.token === token && 
        link.status === 'active' && 
        new Date() < new Date(link.expiresAt)
      );
      
      if (!paymentLink) {
        return res.status(404).json({
          success: false,
          message: 'Lien de paiement invalide ou expiré'
        });
      }
      
      const invoice = memoryDb.findInvoiceById(paymentLink.invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cette facture est déjà payée'
        });
      }
      
      try {
        const stripeService = require('../services/stripeService');
        const client = memoryDb.findClientById(invoice.clientId);
        
        const paymentIntentResult = await stripeService.createPaymentIntent({
          amount: parseFloat(invoice.total), // Pass amount in euros, service will convert
          currency: invoice.currency || 'eur',
          metadata: {
            invoiceId: invoice.id.toString(),
            clientName: client?.name || 'Unknown',
            paymentToken: token
          }
        });
        
        if (!paymentIntentResult.success) {
          return res.status(500).json({
            success: false,
            message: paymentIntentResult.error || 'Erreur lors de la création du paiement'
          });
        }
        
        return res.json({
          success: true,
          data: {
            clientSecret: paymentIntentResult.data.clientSecret,
            paymentIntentId: paymentIntentResult.data.paymentIntentId
          }
        });
      } catch (stripeError) {
        console.error('Stripe Payment Intent creation error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'intention de paiement'
        });
      }
    }
    
    // PostgreSQL mode (if needed later)
    return res.status(501).json({
      success: false,
      message: 'Not implemented for PostgreSQL mode'
    });
    
  } catch (error) {
    console.error('Create payment intent by token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'intention de paiement'
    });
  }
});

// Apply middleware to protected routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(auditLogger('invoices'));

// Add global request logging
router.use((req, res, next) => {
  console.log(`=== Invoice Route Request ===`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Full URL: ${req.originalUrl}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`Body: ${JSON.stringify(req.body, null, 2)}`);
  }
  console.log(`User ID: ${req.user?.id}`);
  console.log(`==================`);
  next();
});

// Import invoice number service
const InvoiceNumberService = require('../services/invoiceNumberService');

// Helper function to generate invoice number
const generateInvoiceNumber = async (userId, format = 'standard') => {
  const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize };
  const invoiceNumberService = new InvoiceNumberService(db);
  
  return await invoiceNumberService.getNextInvoiceNumber(userId, format);
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
      
      // 为每个发票添加客户信息、InvoiceItems和taxAmount字段以兼容前端，并检查逾期状态
      allInvoices = allInvoices.map(invoice => {
        const client = memoryDb.clients.find(c => c.id === invoice.clientId);
        const invoiceItems = memoryDb.invoiceItems.filter(item => item.invoiceId === invoice.id);
        
        // 检查并更新逾期状态
        let currentStatus = invoice.status;
        if (invoice.status === 'sent' && invoice.dueDate) {
          const dueDate = new Date(invoice.dueDate);
          const now = new Date();
          if (now > dueDate) {
            currentStatus = 'overdue';
            // 更新内存数据库中的状态
            const originalInvoice = memoryDb.invoices.find(inv => inv.id === invoice.id);
            if (originalInvoice) {
              originalInvoice.status = 'overdue';
            }
          }
        }
        
        return {
          ...invoice,
          status: currentStatus,
          taxAmount: invoice.tax || invoice.taxAmount || 0,
          Client: client ? {
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.company
          } : null,
          InvoiceItems: invoiceItems || []
        };
      });
      
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
        attributes: ['id', 'name', 'email', 'company', 'address', 'city', 'postalCode', 'country', 'phone', 'vatNumber']
      }, {
        model: InvoiceItem
      }, {
        model: User,
        attributes: [
          'id', 'firstName', 'lastName', 'email', 'companyName', 'phone', 'fax', 'website', 
          'address', 'city', 'postalCode', 'country', 'currency', 'logo',
          'vatNumber', 'siren', 'siretNumber', 'legalForm', 'registeredCapital', 'rcsNumber', 'nafCode',
          'bankIBAN', 'bankBIC', 'bankName', 'accountHolder',
          'insuranceCompany', 'insurancePolicyNumber', 'insuranceCoverage',
          'invoiceMode'
        ]
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
    
    if (isMemoryMode) {
      // 优先使用中间件提供的发票对象，避免仅限内存库导致404
      const memoryDb = require('../config/memoryDatabase');
      let invoice = req.invoice;
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }

      // 如果发票存在于内存库，按内存模式组装关联数据
      const memInvoice = memoryDb.findInvoiceById(invoiceId);
      if (memInvoice) {
        const client = memoryDb.findClientById(memInvoice.clientId);
        const invoiceItems = memoryDb.findInvoiceItemsByInvoiceId(invoiceId);
        if (client) {
          client.companyName = client.company;
          client.contactName = client.name;
          client.sirenNumber = client.siren;
          client.siretNumber = client.siret;
        }
        const fullInvoice = {
          ...memInvoice,
          Client: client ? {
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.company,
            phone: client.phone,
            address: client.address,
            addressLine2: client.addressLine2,
            city: client.city,
            postalCode: client.postalCode,
            country: client.country,
            companyName: client.companyName,
            contactName: client.contactName,
            sirenNumber: client.sirenNumber,
            siretNumber: client.siretNumber
          } : null,
          InvoiceItems: invoiceItems || [],
          taxAmount: memInvoice.tax || memInvoice.taxAmount || 0
        };
        return res.json({
          success: true,
          data: { invoice: fullInvoice }
        });
      }

      // 否则（不在内存库），从Sequelize加载带关联的数据（中间件已做所有权校验）
      const { Invoice, Client, InvoiceItem } = require('../models');
      const sequelizeInvoice = await Invoice.findByPk(invoiceId, {
        include: [
          { model: Client },
          { model: InvoiceItem }
        ]
      });
      if (!sequelizeInvoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }
      return res.json({
        success: true,
        data: { invoice: sequelizeInvoice }
      });
    }

    // 非内存模式：原逻辑保持
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{
        model: Client,
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }, {
        model: InvoiceItem
      }, {
        model: User,
        attributes: [
          'id', 'firstName', 'lastName', 'email', 'companyName', 'phone', 'fax', 'website', 
          'address', 'city', 'postalCode', 'country', 'currency', 'logo',
          'vatNumber', 'siren', 'siretNumber', 'legalForm', 'registeredCapital', 'rcsNumber', 'nafCode',
          'bankIBAN', 'bankBIC', 'bankName', 'accountHolder',
          'insuranceCompany', 'insurancePolicyNumber', 'insuranceCoverage',
          'invoiceMode'
        ]
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
router.post('/', 
  authenticateToken, 
  validateInvoiceData,
  validateInvoiceNumber,
  validateInvoiceNumberSequence,
  frenchComplianceValidator, 
  async (req, res) => {
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
    
    // Data validation
    console.log('=== Invoice Creation API Debug ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Extracted fields:');
    console.log('- clientId:', clientId, '(type:', typeof clientId, ')');
    console.log('- issueDate:', issueDate, '(type:', typeof issueDate, ')');
    console.log('- items:', JSON.stringify(items, null, 2));
    console.log('- items length:', items?.length);
    console.log('- subtotal:', subtotal, '(type:', typeof subtotal, ')');
    console.log('- taxAmount:', taxAmount, '(type:', typeof taxAmount, ')');
    console.log('- total:', total, '(type:', typeof total, ')');
    console.log('- totalAmount:', totalAmount, '(type:', typeof totalAmount, ')');
    
    // Check basic required fields
    if (!clientId) {
      console.error('Error: clientId is missing');
      return res.status(400).json({ 
        message: 'clientId is required', 
        field: 'clientId',
        received: clientId
      });
    }
    
    if (!issueDate) {
      console.error('Error: issueDate is missing');
      return res.status(400).json({ 
        message: 'issueDate is required', 
        field: 'issueDate',
        received: issueDate
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Error: items are invalid or empty');
      return res.status(400).json({ 
        message: 'items must be a non-empty array', 
        field: 'items',
        received: items
      });
    }
    
    console.log('Basic field validation passed, proceeding with detailed validation...');
    
    const validation = InvoiceValidator.validateCreateData(req.body, items);
    console.log('InvoiceValidator result:', validation);
    
    if (!validation.isValid) {
      console.error('InvoiceValidator validation failed:');
      validation.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      return res.status(400).json({ 
        message: 'Data validation failed', 
        errors: validation.errors,
        debug: {
          clientId,
          issueDate,
          itemsCount: items?.length,
          subtotal,
          taxAmount,
          total,
          totalAmount
        }
      });
    }
    
    console.log('All validations passed, proceeding to create invoice...');
    
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
    let seller = null;
    let invoiceMode = 'intl'; // Default value
    
    // First check if settings are provided in the request body
    if (req.body.settings) {
      // Use settings from request body (for unified settings data)
      const requestSettings = req.body.settings;
      invoiceMode = requestSettings.invoiceMode || 'intl';
      seller = requestSettings.modeConfig ? requestSettings.modeConfig[invoiceMode] : null;
      settings = { invoiceMode, modeConfig: requestSettings.modeConfig };
    } else {
      // Fall back to database settings
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
      
      invoiceMode = settings.invoiceMode || 'intl';
      seller = settings.modeConfig ? settings.modeConfig[invoiceMode] : null;
    }
    
    // Generate invoice number based on invoice mode with retry mechanism for concurrency
    const invoiceNumberFormat = invoiceMode === 'fr' ? 'french' : 'standard';
    let invoiceNumber;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Retry loop to handle concurrent invoice creation
    while (retryCount < maxRetries) {
      try {
        invoiceNumber = await generateInvoiceNumber(req.user.id, invoiceNumberFormat);
        
        // Check if the generated number already exists (double-check for concurrency)
        const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize };
        const invoiceNumberService = new InvoiceNumberService(db);
        const exists = await invoiceNumberService.isInvoiceNumberExists(invoiceNumber, req.user.id);
        
        if (!exists) {
          console.log(`Invoice number generated: ${invoiceNumber} (attempt: ${retryCount + 1})`);
          break; // Successfully generated unique number
        } else {
          console.log(`Invoice number ${invoiceNumber} already exists, retrying... (attempt: ${retryCount + 1})`);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            console.error(`Invoice number generation failed, reached max retries ${maxRetries}`);
            return res.status(500).json({
              success: false,
              message: 'Failed to generate invoice number, please try again later',
              error: 'INVOICE_NUMBER_GENERATION_FAILED',
              details: {
                attempts: maxRetries,
                lastAttemptedNumber: invoiceNumber
              }
            });
          }
          
          // Add small delay before retry to reduce collision probability
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        }
      } catch (error) {
        console.error(`Invoice number generation error (attempt: ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          return res.status(500).json({
            success: false,
            message: '发票编号生成失败',
            error: 'INVOICE_NUMBER_GENERATION_ERROR',
            details: {
              attempts: maxRetries,
              lastError: error.message
            }
          });
        }
        
        // Add delay before retry
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      }
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
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      if (isNewFormat) {
        // 新格式：直接按ID获取客户，并校验归属
        client = memoryDb.findClientById(clientId);
        if (!client || client.userId !== req.user.id) {
          return res.status(400).json({ message: 'Client not found' });
        }
      } else {
        // 旧格式：根据name+email查找，不存在则创建
        const userClients = memoryDb.findClientsByUserId(req.user.id) || [];
        client = userClients.find(c => (c.email || '') === (buyer.email || '') && c.name === buyer.name);
        if (!client) {
          client = memoryDb.createClient({
            userId: req.user.id,
            name: buyer.name,
            email: buyer.email || '',
            company: buyer.company || '',
            address: buyer.address || '',
            taxId: buyer.taxId || ''
          });
        }
      }
    } else {
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
      invoiceData.paidDate = req.body.paidDate || null;
      
      // 处理金额字段，确保正确计算
      const parsedSubtotal = parseFloat(subtotal) || 0;
      const parsedTaxAmount = parseFloat(taxAmount) || 0;
      const parsedTotal = parseFloat(total || totalAmount);
      
      invoiceData.subtotal = parsedSubtotal;
      invoiceData.taxAmount = parsedTaxAmount;
      
      // 如果前端提供了有效的total值，使用它；否则根据subtotal和taxAmount计算
      if (!isNaN(parsedTotal) && parsedTotal > 0) {
        invoiceData.total = parsedTotal;
      } else {
        invoiceData.total = parsedSubtotal + parsedTaxAmount;
      }
      
      console.log('金额字段处理结果:');
      console.log('- 原始subtotal:', subtotal, '-> 解析后:', invoiceData.subtotal);
      console.log('- 原始taxAmount:', taxAmount, '-> 解析后:', invoiceData.taxAmount);
      console.log('- 原始total:', total, '原始totalAmount:', totalAmount, '-> 最终total:', invoiceData.total);
      
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
      invoiceData.sellerCompanyName = seller.companyName;
      invoiceData.sellerCompanyAddress = seller.companyAddress;
      invoiceData.sellerTaxId = seller.taxId;
      invoiceData.sellerSiren = seller.siren;
      invoiceData.sellerSiret = seller.siret;
      invoiceData.sellerPhone = seller.phone;
      invoiceData.sellerEmail = seller.email;
      invoiceData.sellerNafCode = seller.nafCode;
      invoiceData.sellerRcsNumber = seller.rcsNumber;
      invoiceData.sellerLegalForm = seller.legalForm;
      invoiceData.sellerRegisteredCapital = seller.capital;
      invoiceData.tvaExempt = seller.tvaExempt;
      invoiceData.autoLiquidation = seller.autoLiquidation;
    }
    
    // 从请求体中获取模板相关的税务设置
    if (req.body.tvaExempt !== undefined) {
      invoiceData.tvaExempt = req.body.tvaExempt;
    }
    if (req.body.autoLiquidation !== undefined) {
      invoiceData.autoLiquidation = req.body.autoLiquidation;
    }
    // If no seller, these fields will be undefined (not set), which matches test expectations
    
    // 同时将items存储为JSON字段（向后兼容）
    invoiceData.items = JSON.stringify(items.map(item => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      taxRate: item.taxRate || 0,
      taxAmount: item.taxAmount || 0,
      total: item.total || 0
    })));

    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const newInvoice = memoryDb.createInvoice(invoiceData);
      
      // Add invoice items
      for (const item of items) {
        let itemData;
        
        if (isNewFormat) {
          const itemSubtotal = (item.quantity || 1) * (item.unitPrice || 0);
          const itemTaxAmount = (invoiceData.tvaExempt || invoiceData.autoLiquidation) ? 0 : itemSubtotal * ((item.taxRate || 0) / 100);
          
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
        memoryDb.createInvoiceItem(itemData);
      }
      
      // Build complete invoice with relations
      const memClient = memoryDb.findClientById(newInvoice.clientId);
      const memItems = memoryDb.findInvoiceItemsByInvoiceId(newInvoice.id) || [];
      if (memClient) {
        // 字段映射以兼容前端
        memClient.companyName = memClient.company;
        memClient.contactName = memClient.name;
        memClient.sirenNumber = memClient.siren;
        memClient.siretNumber = memClient.siret;
      }
      const completeInvoice = { 
        ...newInvoice, 
        Client: memClient || null, 
        InvoiceItems: memItems 
      };
      
      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: { invoice: completeInvoice }
      });
    }
    
    const newInvoice = await Invoice.create(invoiceData);
    
    // Add invoice items
    for (const item of items) {
      let itemData;
      
      if (isNewFormat) {
        // New format: use item data directly
        const itemSubtotal = (item.quantity || 1) * (item.unitPrice || 0);
        const itemTaxAmount = (invoiceData.tvaExempt || invoiceData.autoLiquidation) ? 0 : itemSubtotal * ((item.taxRate || 0) / 100);
        
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
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice: completeInvoice
      }
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update an invoice
router.put('/:id', 
  authenticateToken, 
  validateInvoiceData,
  validateInvoiceNumber,
  validateInvoiceNumberSequence,
  async (req, res) => {
  try {
    const {
      clientId,
      issueDate,
      dueDate,
      paidDate,
      subtotal,
      taxAmount,
      total,
      totalAmount,
      notes, 
      status, 
      items,
      invoiceMode,

    } = req.body;
    
    // 数据验证（如果提供了items）
    if (items) {
      const validation = InvoiceValidator.validateUpdateData(req.body, items);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: '数据验证失败', 
          errors: validation.errors 
        });
      }
    }
    
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
      
      // 同时更新items JSON字段
      const itemsJson = JSON.stringify(items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        total: item.total
      })));
      
      // Update invoice totals and items
      await Invoice.update(
        {
          subtotal,
          taxAmount: totalTax,
          total,
          items: itemsJson
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
        paidDate: paidDate !== undefined ? paidDate : invoice.paidDate,
        subtotal: subtotal !== undefined ? subtotal : invoice.subtotal,
        taxAmount: taxAmount !== undefined ? taxAmount : invoice.taxAmount,
        total: total !== undefined ? total : invoice.total,
        // 移除冗余的totalAmount字段，统一使用total
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
    
    if (isMemoryMode) {
      // 内存模式下的实现
      const memoryDb = require('../config/memoryDatabase');
      const invoice = memoryDb.invoices.find(inv => inv.id === invoiceId && inv.userId === userId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // 更新发票状态
      invoice.status = status;
      invoice.updatedAt = new Date();
      
      // 如果标记为已付，设置付款日期
      if (status === 'paid' && !invoice.paidDate) {
        invoice.paidDate = new Date();
      }
      
      // 获取完整的发票信息
      const client = memoryDb.clients.find(c => c.id === invoice.clientId);
      const invoiceItems = memoryDb.invoiceItems.filter(item => item.invoiceId === invoiceId);
      
      const updatedInvoice = {
        ...invoice,
        Client: client ? {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company
        } : null,
        InvoiceItems: invoiceItems || []
      };
      
      return res.json({
        message: 'Invoice status updated successfully',
        invoice: updatedInvoice
      });
    }
    
    // 数据库模式下的实现
    const { Invoice, Client, InvoiceItem } = require('../models');
    
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

// Invoice sending functionality moved to dedicated service

/**
 * @route GET /api/invoices/:id/pdf
 * @desc Generate and download invoice PDF
 * @access Private
 */
router.get('/:id/pdf', checkInvoiceOwnership, async (req, res) => {
  try {
    let invoice = req.invoice;
    if (process.env.DB_TYPE === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      const memInvoice = memoryDb.findInvoiceById(invoice.id);
      if (memInvoice) {
        const client = memoryDb.findClientById(memInvoice.clientId);
        const invoiceItems = memoryDb.findInvoiceItemsByInvoiceId(memInvoice.id);
        if (client) {
          client.companyName = client.company;
          client.contactName = client.name;
          client.sirenNumber = client.siren;
          client.siretNumber = client.siret;
        }
        invoice = { ...memInvoice, Client: client, InvoiceItems: invoiceItems || [] };
      } else {
        const { Invoice, Client, InvoiceItem } = require('../models');
        invoice = await Invoice.findByPk(req.params.id, {
          include: [{ model: Client }, { model: InvoiceItem }]
        });
      }
    } else {
      const { Invoice, Client, InvoiceItem } = require('../models');
      invoice = await Invoice.findByPk(req.params.id, {
        include: [{ model: Client }, { model: InvoiceItem }]
      });
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // 获取用户设置：内存模式下使用完整用户对象，非模式下使用数据库用户
    let userData;
    if (process.env.DB_TYPE === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      userData = memoryDb.findUserById(req.user.id);
    } else {
      const { User } = require('../models');
      userData = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    }

    const { generateInvoicePDFNew } = require('../services/pdfServiceNew');
    const path = require('path');
    const fs = require('fs');
    const clientData = invoice.Client || null;
    const invoiceMode = invoice.invoiceMode || 'fr';

    // 调用新PDF服务并正确提取返回的buffer与文件名
    const pdfResult = await generateInvoicePDFNew(invoice, userData, clientData, invoiceMode);
    const pdfBuffer = pdfResult && pdfResult.buffer ? pdfResult.buffer : pdfResult; // 兼容返回类型
    const pdfFileName = (pdfResult && pdfResult.filename) ? pdfResult.filename : `invoice_${invoice.id}.pdf`;

    const pdfPath = path.join(__dirname, '../../public', 'pdfs', pdfFileName);
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, pdfBuffer);

    const file = path.resolve(pdfPath);
    if (!fs.existsSync(file)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    const download = req.query.download === 'true';
    if (download) {
      return res.download(file, pdfFileName, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({ message: 'Error downloading PDF' });
        }
      });
    }
    return res.sendFile(file);
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ message: 'Server error' });
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
      
      // 获取最近发票（仅当月）
      const recentInvoices = await Invoice.findAll({
        where: { 
          userId,
          createdAt: { [Op.gte]: currentMonth }
        },
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

    // Get recent invoices (current month only)
    const recentInvoices = await Invoice.findAll({
      where: { 
        userId,
        createdAt: { [Op.gte]: currentMonth }
      },
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

/**
 * @route POST /api/invoices/:id/payment-link
 * @desc Generate a payment link for an invoice
 * @access Private
 */
router.post('/:id/payment-link', checkInvoiceOwnership, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    const { paymentMethod = 'stripe' } = req.body;
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const invoice = memoryDb.findInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }
      
      // Check if invoice is already paid
      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cette facture est déjà payée'
        });
      }
      
      // Generate a unique payment token
      const paymentToken = require('crypto').randomBytes(32).toString('hex');
      
      // Create Stripe Payment Intent if using Stripe
      let stripePaymentIntent = null;
      if (paymentMethod === 'stripe') {
        try {
          const stripeService = require('../services/stripeService');
          const client = memoryDb.findClientById(invoice.clientId);
          
          stripePaymentIntent = await stripeService.createPaymentIntent({
            amount: Math.round(parseFloat(invoice.total) * 100), // Convert to cents
            currency: invoice.currency || 'eur',
            metadata: {
              invoiceId: invoiceId.toString(),
              paymentToken: paymentToken,
              clientName: client?.name || 'Unknown'
            }
          });
        } catch (stripeError) {
          console.error('Stripe Payment Intent creation error:', stripeError);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du paiement Stripe'
          });
        }
      }
      
      // Store payment link in memory (in a real app, this would be in database)
      if (!memoryDb.paymentLinks) {
        memoryDb.paymentLinks = [];
      }
      
      const paymentLink = {
        id: Date.now(),
        invoiceId: invoiceId,
        token: paymentToken,
        paymentMethod: paymentMethod,
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        stripePaymentIntentId: stripePaymentIntent?.id,
        stripeClientSecret: stripePaymentIntent?.client_secret
      };
      
      memoryDb.paymentLinks.push(paymentLink);
      
      const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${paymentToken}`;
      
      return res.json({
        success: true,
        data: {
          paymentUrl,
          token: paymentToken,
          expiresAt: paymentLink.expiresAt,
          clientSecret: stripePaymentIntent?.client_secret,
          paymentIntentId: stripePaymentIntent?.id
        }
      });
    }
    
    // For database mode
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{
        model: Client,
        attributes: ['name', 'email', 'company']
      }]
    });
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }
    
    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cette facture est déjà payée'
      });
    }
    
    // Generate a unique payment token
    const paymentToken = require('crypto').randomBytes(32).toString('hex');
    
    // Create payment link record (you might want to create a PaymentLink model)
    const paymentLinkData = {
      invoiceId: invoiceId,
      token: paymentToken,
      paymentMethod: paymentMethod,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date()
    };
    
    // For now, we'll store this in the invoice notes or create a simple table
    // In a production app, you'd want a proper PaymentLink model
    
    const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pay/${paymentToken}`;
    
    // Log the payment link creation
    await logAuditEvent(req.user.id, AUDIT_ACTIONS.PAYMENT_LINK_CREATED, 'invoices', invoiceId, {
      paymentMethod,
      token: paymentToken
    });
    
    res.json({
      success: true,
      data: {
        paymentUrl,
        token: paymentToken,
        expiresAt: paymentLinkData.expiresAt,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          currency: invoice.currency || 'EUR',
          client: invoice.Client
        }
      }
    });
  } catch (error) {
    console.error('Generate payment link error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du lien de paiement'
    });
  }
});

/**
 * @route POST /api/invoices/payment/:token/process
 * @desc Process payment for an invoice (public route)
 * @access Public
 */
router.post('/payment/:token/process', async (req, res) => {
  try {
    const { token } = req.params;
    const { paymentData } = req.body;
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const paymentLink = memoryDb.paymentLinks?.find(link => 
        link.token === token && 
        link.status === 'active' && 
        new Date() < new Date(link.expiresAt)
      );
      
      if (!paymentLink) {
        return res.status(404).json({
          success: false,
          message: 'Lien de paiement invalide ou expiré'
        });
      }
      
      const invoice = memoryDb.findInvoiceById(paymentLink.invoiceId);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cette facture est déjà payée'
        });
      }
      
      // Process payment based on payment method
      let paymentResult = null;
      
      if (paymentLink.paymentMethod === 'stripe') {
        try {
          const stripeService = require('../services/stripeService');
          
          // Confirm the payment intent
          if (paymentLink.stripePaymentIntentId && paymentData.paymentMethodId) {
            paymentResult = await stripeService.confirmPayment(
              paymentLink.stripePaymentIntentId,
              paymentData.paymentMethodId
            );
            
            if (paymentResult.status !== 'succeeded') {
              return res.status(400).json({
                success: false,
                message: 'Le paiement a échoué',
                error: paymentResult.last_payment_error?.message
              });
            }
          } else {
            return res.status(400).json({
              success: false,
              message: 'Données de paiement manquantes'
            });
          }
        } catch (stripeError) {
          console.error('Stripe payment processing error:', stripeError);
          return res.status(500).json({
            success: false,
            message: 'Erreur lors du traitement du paiement Stripe'
          });
        }
      } else {
        // For other payment methods (PayPal, etc.), implement similar logic
        // For now, simulate payment processing
        paymentResult = {
          id: `pay_${Date.now()}`,
          status: 'succeeded',
          amount: Math.round(parseFloat(invoice.total) * 100)
        };
      }
      
      // Update invoice status
      invoice.status = 'paid';
      invoice.paidDate = new Date().toISOString();
      
      // Mark payment link as used
      paymentLink.status = 'used';
      paymentLink.usedAt = new Date();
      
      return res.json({
        success: true,
        message: 'Paiement traité avec succès',
        data: {
          invoice: invoice,
          paymentId: paymentResult.id,
          paymentStatus: paymentResult.status,
          amount: paymentResult.amount
        }
      });
    }
    
    // For database mode
    res.status(501).json({
      success: false,
      message: 'Payment processing not implemented for database mode yet'
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement du paiement'
    });
  }
});

/**
 * @route POST /api/invoices/:id/payment-intent
 * @desc Create a Stripe payment intent for an invoice
 * @access Private
 */
router.post('/:id/payment-intent', checkInvoiceOwnership, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id, 10);
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const invoice = memoryDb.findInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cette facture est déjà payée'
        });
      }
      
      try {
        const stripeService = require('../services/stripeService');
        const client = memoryDb.findClientById(invoice.clientId);
        
        const paymentIntentResult = await stripeService.createPaymentIntent({
          amount: parseFloat(invoice.total), // Pass amount in euros, service will convert
          currency: invoice.currency || 'eur',
          metadata: {
            invoiceId: invoiceId.toString(),
            clientName: client?.name || 'Unknown'
          }
        });
        
        if (!paymentIntentResult.success) {
          return res.status(500).json({
            success: false,
            message: paymentIntentResult.error || 'Erreur lors de la création du paiement'
          });
        }
        
        return res.json({
          success: true,
          data: {
            clientSecret: paymentIntentResult.data.clientSecret,
            paymentIntentId: paymentIntentResult.data.paymentIntentId
          }
        });
      } catch (stripeError) {
        console.error('Stripe Payment Intent creation error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du paiement Stripe'
        });
      }
    }
    
    // Database mode implementation would go here
    res.status(501).json({
      success: false,
      message: 'Payment intent creation not implemented for database mode yet'
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'intention de paiement'
    });
  }
});

/**
 * @route POST /api/invoices/payment/confirm
 * @desc Confirm a payment and update invoice status
 * @access Public
 */
router.post('/payment/confirm', async (req, res) => {
  try {
    const { paymentIntentId, invoiceId } = req.body;
    
    if (isMemoryMode) {
      const memoryDb = require('../config/memoryDatabase');
      const invoice = memoryDb.findInvoiceById(parseInt(invoiceId, 10));
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Facture non trouvée'
        });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cette facture est déjà payée'
        });
      }
      
      try {
        const stripeService = require('../services/stripeService');
        const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Update invoice status
          invoice.status = 'paid';
          invoice.paidDate = new Date().toISOString();
          
          return res.json({
            success: true,
            message: 'Paiement confirmé avec succès',
            data: {
              invoice: invoice,
              paymentId: paymentIntent.id
            }
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'Le paiement n\'a pas été confirmé'
          });
        }
      } catch (stripeError) {
        console.error('Stripe payment confirmation error:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la confirmation du paiement Stripe'
        });
      }
    }
    
    // Database mode implementation would go here
    res.status(501).json({
      success: false,
      message: 'Payment confirmation not implemented for database mode yet'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement'
    });
  }
});

module.exports = router;