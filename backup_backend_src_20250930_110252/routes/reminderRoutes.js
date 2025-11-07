const express = require('express');
const router = express.Router();
const { checkForReminders } = require('../services/reminderService');
const ReminderLog = require('../models/ReminderLog');
const Invoice = require('../models/invoice');
const { authenticateToken } = require('../middleware/auth');

// Manual trigger for reminder check
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const result = await checkForReminders();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Reminder check completed. Processed ${result.count} invoices.`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to check for reminders',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Manual reminder check error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while checking for reminders',
      error: error.message
    });
  }
});

// Get reminder logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, reminderType } = req.query;
    
    // Build query options
    const options = {
      offset: (page - 1) * limit,
      limit: parseInt(limit),
      order: [['sentDate', 'DESC']],
      include: [
        {
          model: Invoice,
          where: { userId },
          attributes: ['invoiceNumber', 'issueDate', 'dueDate', 'total', 'status']
        }
      ]
    };
    
    // Add filter for reminderType if provided
    if (reminderType) {
      // Map the reminderType to database values
      let dbReminderType = 'payment_reminder';
      if (reminderType === 'stern' || reminderType === 'final') {
        dbReminderType = 'overdue_notice';
      }
      options.where = { reminderType: dbReminderType };
    }
    
    // Get reminder logs with pagination
    const { count, rows } = await ReminderLog.findAndCountAll(options);
    
    // Map database reminderType back to UI values
    const logs = rows.map(log => {
      const logData = log.get({ plain: true });
      // Map database reminderType to UI values
      if (logData.reminderType === 'payment_reminder') {
        logData.reminderType = 'friendly';
      } else if (logData.reminderType === 'overdue_notice') {
        // For simplicity, we'll map all overdue_notices to 'stern'
        // In a real app, you might have more sophisticated logic
        logData.reminderType = 'stern';
      }
      return logData;
    });
    
    res.json({
      success: true,
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get reminder logs error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching reminder logs',
      error: error.message
    });
  }
});

module.exports = router;