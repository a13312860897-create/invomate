const cron = require('node-cron');
const { Op } = require('sequelize');
const Invoice = require('../models/invoice');
const Client = require('../models/client');
const User = require('../models/User');
const ReminderLog = require('../models/ReminderLog');
const { sendEmail } = require('./emailService');
const fs = require('fs');
const path = require('path');

// Helper function to format currency
const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to render template with data
const renderTemplate = (template, data) => {
  let result = template;
  
  // Replace simple variables
  result = result.replace(/{{(\w+(\.\w+)*)}}/g, (match, keyPath) => {
    const keys = keyPath.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match; // Not found, return original
      }
    }
    return value !== null && value !== undefined ? value : '';
  });
  
  // Replace conditional blocks
  result = result.replace(/{{#if (\w+(\.\w+)*)}}([\s\s]*?){{\/if}}/g, (match, keyPath, content) => {
    const keys = keyPath.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return ''; // Not found, return empty
      }
    }
    return value ? content : '';
  });
  
  return result;
};

// Get reminder template based on type
const getReminderTemplate = (type) => {
  const templatePath = path.join(__dirname, '../../templates', `${type}-reminder.html`);
  
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  
  // Default templates based on type
  switch (type) {
    case 'friendly':
      return `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .reminder-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .total { font-weight: bold; font-size: 18px; }
              .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Payment Reminder for Invoice #{{invoice_number}}</h2>
              </div>
              <div class="reminder-details">
                <p>Dear {{customer_name}},</p>
                <p>This is a friendly reminder that your invoice #{{invoice_number}} is due on {{due_date}}.</p>
                <p><strong>Amount Due:</strong> <span class="total">{{total}}</span></p>
                <p><strong>Due Date:</strong> {{due_date}}</p>
              </div>
              <p>You can pay your invoice online by clicking the button below:</p>
              <a href="{{pay_url}}" class="button">Pay Invoice</a>
              <div class="footer">
                <p>Thank you for your business!</p>
                <p>{{user.companyName}}</p>
              </div>
            </div>
          </body>
        </html>
      `;
    
    case 'stern':
      return `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .reminder-details { background-color: #fff8e1; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107; }
              .total { font-weight: bold; font-size: 18px; color: #d32f2f; }
              .button { display: inline-block; background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Urgent: Overdue Invoice #{{invoice_number}}</h2>
              </div>
              <div class="reminder-details">
                <p>Dear {{customer_name}},</p>
                <p>Your invoice #{{invoice_number}} was due on {{due_date}} and is now overdue.</p>
                <p><strong>Amount Due:</strong> <span class="total">{{total}}</span></p>
                <p><strong>Due Date:</strong> {{due_date}}</p>
                <p><strong>Days Overdue:</strong> {{days_overdue}}</p>
              </div>
              <p>Please settle your payment as soon as possible to avoid additional fees.</p>
              <a href="{{pay_url}}" class="button">Pay Invoice Now</a>
              <div class="footer">
                <p>If you have already paid, please disregard this notice.</p>
                <p>{{user.companyName}}</p>
              </div>
            </div>
          </body>
        </html>
      `;
    
    case 'final':
      return `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .reminder-details { background-color: #ffebee; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f44336; }
              .total { font-weight: bold; font-size: 18px; color: #d32f2f; }
              .button { display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>FINAL NOTICE: Invoice #{{invoice_number}}</h2>
              </div>
              <div class="reminder-details">
                <p>Dear {{customer_name}},</p>
                <p>This is the final notice regarding your overdue invoice #{{invoice_number}}.</p>
                <p><strong>Amount Due:</strong> <span class="total">{{total}}</span></p>
                <p><strong>Due Date:</strong> {{due_date}}</p>
                <p><strong>Days Overdue:</strong> {{days_overdue}}</p>
              </div>
              <p>Your account is seriously overdue. Immediate payment is required to avoid further action.</p>
              <a href="{{pay_url}}" class="button">Pay Immediately</a>
              <div class="footer">
                <p>If payment is not received within 48 hours, we may pursue additional collection methods.</p>
                <p>{{user.companyName}}</p>
              </div>
            </div>
          </body>
        </html>
      `;
    
    default:
      return getReminderTemplate('friendly');
  }
};

// Send reminder email
const sendReminderEmail = async (invoice, reminderType) => {
  try {
    // Get user details
    const user = await User.findOne({
      where: { id: invoice.userId },
      attributes: { exclude: ['password'] }
    });
    
    // Get client details
    const client = await Client.findOne({
      where: { id: invoice.clientId }
    });
    
    if (!client || !client.email) {
      console.error(`Client email not found for invoice ${invoice.id}`);
      return { success: false, error: 'Client email not found' };
    }
    
    // Calculate days overdue if applicable
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
    
    // Prepare template data
    const templateData = {
      customer_name: client.name,
      invoice_number: invoice.invoiceNumber,
      total: formatCurrency(invoice.total, invoice.currency),
      pay_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/invoice/${invoice.id}/pay`,
      due_date: formatDate(invoice.dueDate),
      days_overdue: daysOverdue,
      user: {
        ...user.get({ plain: true }),
        companyName: user.companyName || `${user.firstName} ${user.lastName}`
      },
      client: client.get({ plain: true }),
      invoice: {
        ...invoice.get({ plain: true }),
        dueDate: formatDate(invoice.dueDate)
      }
    };
    
    // Get email template based on reminder type
    const template = getReminderTemplate(reminderType);
    
    // Render template with data
    const htmlContent = renderTemplate(template, templateData);
    
    // Determine subject based on reminder type
    let subject;
    switch (reminderType) {
      case 'friendly':
        subject = `Payment Reminder for Invoice #${invoice.invoiceNumber}`;
        break;
      case 'stern':
        subject = `Urgent: Overdue Invoice #${invoice.invoiceNumber}`;
        break;
      case 'final':
        subject = `FINAL NOTICE: Invoice #${invoice.invoiceNumber}`;
        break;
      default:
        subject = `Payment Reminder for Invoice #${invoice.invoiceNumber}`;
    }
    
    // Prepare email options
    const emailOptions = {
      to: client.email,
      subject: `${subject} from ${user.companyName || user.firstName + ' ' + user.lastName}`,
      html: htmlContent
    };
    
    // Send email
    const result = await sendEmail(emailOptions);
    
    if (result.success) {
      // Log the reminder
      await logReminder(invoice.id, reminderType, result.messageId, result.provider);
    }
    
    return result;
  } catch (error) {
    console.error('Send reminder email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Log reminder to database
const logReminder = async (invoiceId, reminderType, messageId, provider) => {
  try {
    // Map reminderType to the database values
    let dbReminderType = 'payment_reminder';
    if (reminderType === 'stern' || reminderType === 'final') {
      dbReminderType = 'overdue_notice';
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const sentDate = today.toISOString().split('T')[0];
    
    // Save to ReminderLog model
    await ReminderLog.create({
      invoiceId,
      reminderType: dbReminderType,
      status: 'sent',
      sentDate
    });
    
    console.log(`Reminder logged: Invoice ${invoiceId}, Type: ${reminderType}, Message ID: ${messageId}, Provider: ${provider}`);
    
    return { success: true };
  } catch (error) {
    console.error('Log reminder error:', error);
    return { success: false, error: error.message };
  }
};

// Check for invoices that need reminders
const checkForReminders = async () => {
  try {
    console.log('Checking for invoices that need reminders...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date ranges
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    // Find invoices that need reminders
    const invoicesNeedingReminders = await Invoice.findAll({
      where: {
        status: {
          [Op.notIn]: ['paid', 'cancelled']
        },
        [Op.or]: [
          // Due tomorrow
          {
            dueDate: {
              [Op.between]: [today, tomorrow]
            }
          },
          // 3 days overdue
          {
            dueDate: {
              [Op.between]: [threeDaysAgo, today]
            },
            status: 'sent'
          },
          // 7 days overdue
          {
            dueDate: {
              [Op.between]: [sevenDaysAgo, threeDaysAgo]
            },
            status: 'sent'
          },
          // 14 days overdue
          {
            dueDate: {
              [Op.lte]: fourteenDaysAgo
            },
            status: 'sent'
          }
        ]
      }
    });
    
    console.log(`Found ${invoicesNeedingReminders.length} invoices needing reminders`);
    
    // Send reminders for each invoice
    for (const invoice of invoicesNeedingReminders) {
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
      const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      
      let reminderType;
      
      if (daysUntilDue === 1) {
        // Due tomorrow
        reminderType = 'friendly';
      } else if (daysOverdue >= 1 && daysOverdue <= 3) {
        // 1-3 days overdue
        reminderType = 'friendly';
      } else if (daysOverdue > 3 && daysOverdue <= 7) {
        // 4-7 days overdue
        reminderType = 'stern';
      } else if (daysOverdue > 7) {
        // More than 7 days overdue
        reminderType = 'final';
      }
      
      if (reminderType) {
        console.log(`Sending ${reminderType} reminder for invoice ${invoice.invoiceNumber}`);
        await sendReminderEmail(invoice, reminderType);
      }
    }
    
    return { success: true, count: invoicesNeedingReminders.length };
  } catch (error) {
    console.error('Check for reminders error:', error);
    return { success: false, error: error.message };
  }
};

// Schedule daily reminder check
const scheduleReminderCron = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily reminder check...');
    await checkForReminders();
  });
  
  console.log('Reminder cron job scheduled for daily execution at 9:00 AM');
};

module.exports = {
  checkForReminders,
  sendReminderEmail,
  scheduleReminderCron
};