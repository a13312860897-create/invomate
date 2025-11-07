const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/invoice');
const User = require('../models/User');
const Client = require('../models/client');
const { generateinvoicepdf } = require('./pdfService');
const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');

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

// Send email using SMTP
const sendEmailWithSMTP = async (options) => {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || []
    };
    
    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
      provider: 'SMTP'
    };
  } catch (error) {
    console.error('SMTP email error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'SMTP'
    };
  }
};

// Send email using Resend API
const sendEmailWithResend = async (options) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const emailOptions = {
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html
    };
    
    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      emailOptions.attachments = options.attachments;
    }
    
    const { data, error } = await resend.emails.send(emailOptions);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      success: true,
      messageId: data.id,
      provider: 'Resend'
    };
  } catch (error) {
    console.error('Resend email error:', error);
    return {
      success: false,
      error: error.message,
      provider: 'Resend'
    };
  }
};

// Send email with automatic provider selection
const sendEmail = async (options) => {
  // Try Resend first if API key is available
  if (process.env.RESEND_API_KEY) {
    const result = await sendEmailWithResend(options);
    if (result.success) {
      return result;
    }
    console.warn('Resend failed, falling back to SMTP');
  }
  
  // Fall back to SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return await sendEmailWithSMTP(options);
  }
  
  // If neither provider is configured
  return {
    success: false,
    error: 'No email provider configured. Please configure SMTP or Resend API.',
    provider: 'None'
  };
};

// Send test email
const sendTestEmail = async (to, method) => {
  try {
    const emailOptions = {
      to: to,
      subject: 'Test Email from Invoice SaaS',
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Test Email</h2>
              </div>
              <div class="content">
                <p>This is a test email from Invoice SaaS.</p>
                <p>If you receive this email, it means the email configuration is working correctly.</p>
              </div>
              <div class="footer">
                <p>Thank you for using Invoice SaaS!</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
    
    let result;
    if (method === 'smtp') {
      result = await sendEmailWithSMTP(emailOptions);
    } else if (method === 'resend') {
      result = await sendEmailWithResend(emailOptions);
    } else {
      // Use automatic selection if method is not specified
      result = await sendEmail(emailOptions);
    }
    
    return result;
  } catch (error) {
    console.error('Send test email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send invoice email
const sendInvoiceEmail = async (invoiceId, userId, options = {}) => {
  try {
    // Get invoice details
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId }
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Get user details
    const user = await User.findOne({
      where: { id: userId },
      attributes: { exclude: ['password'] }
    });
    
    // Get client details
    const client = await Client.findOne({
      where: { id: invoice.clientId }
    });
    
    if (!client || !client.email) {
      throw new Error('Client email not found');
    }
    
    // Generate PDF if not already generated or if forceRegenerate is true
    let pdfPath;
    if (options.forceRegenerate || !invoice.pdfUrl) {
      const pdfResult = await generateinvoicepdf(invoiceId, userId);
      if (!pdfResult.success) {
        throw new Error(`Failed to generate PDF: ${pdfResult.error}`);
      }
      
      // Update invoice with PDF URL
      await Invoice.update(
        { pdfUrl: `/generated_pdfs/${pdfResult.filename}` },
        { where: { id: invoiceId } }
      );
      
      pdfPath = pdfResult.filepath;
    } else {
      // Use existing PDF
      pdfPath = path.join(__dirname, '../../', process.env.PDF_DIR || 'generated_pdfs', path.basename(invoice.pdfUrl));
    }
    
    // Prepare template data
    const templateData = {
      customer_name: client.name,
      invoice_number: invoice.invoiceNumber,
      total: formatCurrency(invoice.total, invoice.currency),
      pay_url: options.payUrl || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/invoice/${invoiceId}/pay`,
      issue_date: formatDate(invoice.issueDate),
      due_date: formatDate(invoice.dueDate),
      user: {
        ...user.get({ plain: true }),
        companyName: user.companyName || `${user.firstName} ${user.lastName}`
      },
      client: client.get({ plain: true }),
      invoice: {
        ...invoice.get({ plain: true }),
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate)
      },
      notes: invoice.notes || '',
      status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
    };
    
    // Read email template
    const templatePath = path.join(__dirname, '../../templates/invoice-email.html');
    let template;
    
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf8');
    } else {
      // Use default template if custom template doesn't exist
      template = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .total { font-weight: bold; font-size: 18px; }
              .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Invoice #{{invoice_number}}</h2>
              </div>
              <div class="invoice-details">
                <p>Dear {{customer_name}},</p>
                <p>Please find your invoice #{{invoice_number}} attached to this email.</p>
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
    }
    
    // Render template with data
    const htmlContent = renderTemplate(template, templateData);
    
    // Prepare email options
    const emailOptions = {
      to: client.email,
      subject: options.subject || `Invoice #${invoice.invoiceNumber} from ${user.companyName || user.firstName + ' ' + user.lastName}`,
      html: htmlContent,
      attachments: [
        {
          filename: path.basename(pdfPath),
          path: pdfPath
        }
      ]
    };
    
    // Send email using specified method or automatic selection
    let result;
    if (options.method === 'smtp') {
      result = await sendEmailWithSMTP(emailOptions);
    } else if (options.method === 'resend') {
      result = await sendEmailWithResend(emailOptions);
    } else {
      // Use automatic selection if method is not specified
      result = await sendEmail(emailOptions);
    }
    
    if (result.success) {
      // Update invoice with sent status
      await Invoice.update(
        { 
          emailSent: true,
          emailSentAt: new Date(),
          emailMessageId: result.messageId,
          emailProvider: result.provider
        },
        { where: { id: invoiceId } }
      );
    }
    
    return result;
  } catch (error) {
    console.error('Send invoice email error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send welcome email
const sendWelcomeEmail = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const emailOptions = {
      to: user.email,
      subject: 'Bienvenue sur InvoiceApp !',
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bienvenue sur InvoiceApp !</h1>
              </div>
              <div class="content">
                <h2>Bonjour ${user.firstName || 'Cher utilisateur'},</h2>
                <p>Nous sommes ravis de vous accueillir sur InvoiceApp, votre nouvelle solution de facturation professionnelle.</p>
                <p>Avec InvoiceApp, vous pouvez :</p>
                <ul>
                  <li>Créer des factures professionnelles en quelques clics</li>
                  <li>Gérer vos clients et suivre vos paiements</li>
                  <li>Générer des rapports détaillés</li>
                  <li>Respecter la réglementation française (DGFiP)</li>
                </ul>
                <p>Commencez dès maintenant à créer votre première facture !</p>
                <p style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Accéder à mon tableau de bord</a>
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} InvoiceApp. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const result = await sendEmail(emailOptions);

    if (result.success) {
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.WELCOME_EMAIL_SENT,
        {
          recipientEmail: user.email,
          messageId: result.messageId,
          provider: result.provider
        }
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send payment reminder email
const sendPaymentReminder = async (invoiceId, userId, reminderType = 'gentle') => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const client = await Client.findByPk(invoice.clientId);
    const user = await User.findByPk(userId);

    if (!client || !client.email) {
      throw new Error('Client email not found');
    }

    const daysOverdue = Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    
    const subjects = {
      gentle: `Rappel amical - Facture ${invoice.invoiceNumber}`,
      urgent: `Rappel urgent - Facture ${invoice.invoiceNumber} en retard`,
      final: `Dernier rappel - Facture ${invoice.invoiceNumber}`
    };

    const emailOptions = {
      to: client.email,
      subject: subjects[reminderType] || subjects.gentle,
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .invoice-details { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
              .amount { font-size: 24px; font-weight: bold; color: #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Rappel de paiement</h1>
              </div>
              <div class="content">
                <h2>Bonjour ${client.name},</h2>
                <p>Nous espérons que vous allez bien. Nous vous contactons concernant le paiement de la facture suivante :</p>
                
                <div class="invoice-details">
                  <h3>Détails de la facture</h3>
                  <p><strong>Numéro :</strong> ${invoice.invoiceNumber}</p>
                  <p><strong>Date d'échéance :</strong> ${formatDate(invoice.dueDate)}</p>
                  <p><strong>Montant :</strong> <span class="amount">${formatCurrency(invoice.total, invoice.currency)}</span></p>
                  ${daysOverdue > 0 ? `<p><strong>Retard :</strong> ${daysOverdue} jour(s)</p>` : ''}
                </div>

                <p>Nous vous serions reconnaissants de bien vouloir procéder au règlement de cette facture dans les plus brefs délais.</p>
                
                <p>Si vous avez des questions ou si vous rencontrez des difficultés, n'hésitez pas à nous contacter.</p>
                
                <p>Cordialement,<br>${user.companyName || user.firstName + ' ' + user.lastName}</p>
              </div>
              <div class="footer">
                <p>Ce message a été envoyé automatiquement par InvoiceApp.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const result = await sendEmail(emailOptions);

    if (result.success) {
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.PAYMENT_REMINDER_SENT,
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          reminderType: reminderType,
          daysOverdue: daysOverdue,
          recipientEmail: client.email,
          messageId: result.messageId,
          provider: result.provider
        }
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send verification email
const sendVerificationEmail = async (userId, verificationToken) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const emailOptions = {
      to: user.email,
      subject: 'Vérifiez votre adresse e-mail',
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Vérification de votre adresse e-mail</h1>
              </div>
              <div class="content">
                <h2>Bonjour ${user.firstName || 'Cher utilisateur'},</h2>
                <p>Merci de vous être inscrit sur InvoiceApp ! Pour finaliser votre inscription, veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
                
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Vérifier mon adresse e-mail</a>
                </p>
                
                <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
                <p style="word-break: break-all;">${verificationUrl}</p>
                
                <p>Ce lien expirera dans 24 heures pour des raisons de sécurité.</p>
                
                <p>Si vous n'avez pas créé de compte sur InvoiceApp, vous pouvez ignorer cet e-mail.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} InvoiceApp. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const result = await sendEmail(emailOptions);

    if (result.success) {
      await logAuditEvent(
        userId,
        AUDIT_ACTIONS.VERIFICATION_EMAIL_SENT,
        {
          recipientEmail: user.email,
          messageId: result.messageId,
          provider: result.provider
        }
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailOptions = {
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 4px; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Réinitialisation de votre mot de passe</h1>
              </div>
              <div class="content">
                <h2>Bonjour ${user.firstName || 'Cher utilisateur'},</h2>
                <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte InvoiceApp.</p>
                
                <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
                
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                </p>
                
                <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
                <p style="word-break: break-all;">${resetUrl}</p>
                
                <div class="warning">
                  <strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} InvoiceApp. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const result = await sendEmail(emailOptions);

    if (result.success) {
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.PASSWORD_RESET_EMAIL_SENT,
        {
          recipientEmail: email,
          messageId: result.messageId,
          provider: result.provider
        }
      );
    }

    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmail,
  sendInvoiceEmail,
  sendTestEmail,
  sendWelcomeEmail,
  sendPaymentReminder,
  sendVerificationEmail,
  sendPasswordResetEmail
};