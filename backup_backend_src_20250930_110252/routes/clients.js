const express = require('express');
const { Op } = require('sequelize');
const { Client, Invoice, sequelize } = require('../models');
const { authenticateToken, requireEmailVerification, checkFeatureAccess, freemiumRateLimit } = require('../middleware/auth');
const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const router = express.Router();

// 检查是否为内存数据库模式
const isMemoryMode = !sequelize;

// 兼容 Sequelize 实例与内存对象的序列化
const toPlain = (obj) => (obj && typeof obj.toJSON === 'function') ? obj.toJSON() : obj;

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);

// Get all clients for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;

    if (isMemoryMode) {
      // 内存模式下的简化实现
      let allClients = await Client.findAll({ where: { userId: req.user.id } });
      
      // 搜索过滤
      if (search) {
        const searchLower = search.toLowerCase();
        allClients = allClients.filter(client => 
          (client.name && client.name.toLowerCase().includes(searchLower)) ||
          (client.company && client.company.toLowerCase().includes(searchLower)) ||
          (client.phone && client.phone.toLowerCase().includes(searchLower))
        );
      }
      
      // 排序
      allClients.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        if (sortOrder.toUpperCase() === 'DESC') {
          return bVal.localeCompare(aVal);
        }
        return aVal.localeCompare(bVal);
      });
      
      const count = allClients.length;
      const clients = allClients.slice(offset, offset + parseInt(limit));
      
      // 获取每个客户的发票数据
      const clientsWithInvoices = await Promise.all(
        clients.map(async (client) => {
          const invoices = await Invoice.findAll({ where: { clientId: client.id } });
          return { ...toPlain(client), Invoices: invoices };
        })
      );
      
      const clientsWithStats = clientsWithInvoices;
      const count_final = count;
      const rows_final = clientsWithStats;
      
      return res.json({
        success: true,
        data: {
          clients: rows_final.map(client => {
            const invoices = client.Invoices || [];
            const totalInvoices = invoices.length;
            const totalRevenue = invoices
              .filter(inv => inv.status === 'paid')
              .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
            const pendingAmount = invoices
              .filter(inv => ['sent', 'overdue'].includes(inv.status))
              .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
            
            return {
              ...toPlain(client),
              stats: {
                totalInvoices,
                totalRevenue,
                pendingAmount
              }
            };
          }),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count_final / limit),
            totalItems: count_final,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    // Build where clause
    const whereClause = { userId: req.user.id };
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get clients with pagination
    const { count, rows: clients } = await Client.findAndCountAll({
      where: whereClause,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: Invoice,
        attributes: ['id', 'status', 'total'],
        required: false
      }]
    });

    // Calculate client statistics
    const clientsWithStats = clients.map(client => {
      const invoices = client.Invoices || [];
      const totalInvoices = invoices.length;
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
      const pendingAmount = invoices
        .filter(inv => ['sent', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

      return {
        ...toPlain(client),
        stats: {
          totalInvoices,
          totalRevenue,
          pendingAmount
        }
      };
    });

    res.json({
      success: true,
      data: {
        clients: clientsWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients'
    });
  }
});

// Get a specific client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: Invoice,
        attributes: ['id', 'invoiceNumber', 'status', 'total', 'dueDate', 'createdAt'],
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Calculate client statistics
    const invoices = client.Invoices || [];
    const stats = {
      totalInvoices: invoices.length,
      totalRevenue: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      pendingAmount: invoices
        .filter(inv => ['sent', 'overdue'].includes(inv.status))
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      lastInvoiceDate: invoices.length > 0 ? invoices[0].createdAt : null
    };

    res.json({
      success: true,
      data: {
        ...toPlain(client),
        stats
      }
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client'
    });
  }
});

// Create a new client
router.post('/', freemiumRateLimit(), async (req, res) => {
  try {
    // Debug logging
    console.log('=== CLIENT CREATION DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?.id);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('=============================');

    const {
      name,
      company,
      phone,
      address,
      city,
      postalCode,
      country,
      vatNumber,
      siren,
      siret,
      notes
    } = req.body;

    // Validate required fields
    if (!name) {
      console.log('Validation failed: name is required');
      return res.status(400).json({
        success: false,
        message: 'Le nom du client est requis'
      });
    }

    // Validate French business identifiers if provided
    if (siren && siren.trim() !== '') {
      const sirenClean = siren.replace(/\s/g, ''); // Remove spaces
      if (!/^\d{9}$/.test(sirenClean)) {
        console.log('Validation failed: SIREN format invalid:', siren);
        return res.status(400).json({
          success: false,
          message: 'Le numéro SIREN doit contenir exactement 9 chiffres'
        });
      }
    }

    if (siret && siret.trim() !== '') {
      const siretClean = siret.replace(/\s/g, ''); // Remove spaces
      if (!/^\d{14}$/.test(siretClean)) {
        console.log('Validation failed: SIRET format invalid:', siret);
        return res.status(400).json({
          success: false,
          message: 'Le numéro SIRET doit contenir exactement 14 chiffres'
        });
      }
    }

    // Create new client
    const client = await Client.create({
      name,
      company,
      phone,
      address,
      city,
      postalCode,
      country: country || 'France',
      vatNumber,
      siren,
      siret,
      notes,
      userId: req.user.id
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.CLIENT_CREATED,
      {
        clientId: client.id,
        clientName: client.name,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: toPlain(client)
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du client'
    });
  }
});

// Update a client
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      company,
      phone,
      address,
      city,
      postalCode,
      country,
      vatNumber,
      siren,
      siret,
      notes
    } = req.body;

    // Find client
    const client = await Client.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Validate French business identifiers if provided
    if (siren && !/^\d{9}$/.test(siren)) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro SIREN doit contenir exactement 9 chiffres'
      });
    }

    if (siret && !/^\d{14}$/.test(siret)) {
      return res.status(400).json({
        success: false,
        message: 'Le numéro SIRET doit contenir exactement 14 chiffres'
      });
    }

    // Store old values for audit log
    const oldValues = {
      name: client.name,
      company: client.company,
      vatNumber: client.vatNumber
    };

    // Update client
    await client.update({
      name: name || client.name,
      company,
      phone,
      address,
      city,
      postalCode,
      country,
      vatNumber,
      siren,
      siret,
      notes
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.CLIENT_UPDATED,
      {
        clientId: client.id,
        oldValues,
        newValues: {
          name: client.name,
          company: client.company,
          vatNumber: client.vatNumber
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: toPlain(client)
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du client'
    });
  }
});

// Delete a client
router.delete('/:id', async (req, res) => {
  try {
    // Find client
    const client = await Client.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: Invoice,
        attributes: ['id']
      }]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Check if client has invoices
    if (client.Invoices && client.Invoices.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un client qui a des factures associées'
      });
    }

    // Store client info for audit log
    const clientInfo = {
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company
    };

    // Delete client
    await client.destroy();

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.CLIENT_DELETED,
      {
        clientInfo,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du client'
    });
  }
});

/**
 * @route GET /api/clients/search/suggestions
 * @desc Get client suggestions for autocomplete
 * @access Private
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const clients = await Client.findAll({
      where: {
        userId: req.user.id,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { company: { [Op.iLike]: `%${q}%` } },
          { vatNumber: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'name', 'company', 'vatNumber'],
      limit: 10,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: clients.map(client => toPlain(client))
    });
  } catch (error) {
    console.error('Client suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de clients'
    });
  }
});

module.exports = router;