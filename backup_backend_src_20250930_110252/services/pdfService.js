const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Invoice } = require('../models');
const { InvoiceItem } = require('../models');
const { User } = require('../models');
const { Client } = require('../models');

// helper function to format currency
const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(amount);
};

// helper function to format date
const formatDate = (datestring) => {
  const date = new Date(datestring);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// helper function to format date for filename (yyyymmdd)
const formatDateForFilename = (datestring) => {
  const date = new Date(datestring);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// helper function to capitalize first letter
const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// helper function to render template with data
const renderTemplate = (template, data) => {
  let result = template;
  
  // replace simple variables
  result = result.replace(/{{(\w+(\.\w+)*)}}/g, (match, keypath) => {
    const keys = keypath.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match; // not found, return original
      }
    }
    return value !== null && value !== undefined ? value : '';
  });
  
  // replace conditional blocks
  result = result.replace(/{{#if (\w+(\.\w+)*)}}([\s\s]*?){{\/if}}/g, (match, keypath, content) => {
    const keys = keypath.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return ''; // not found, return empty
      }
    }
    return value ? content : '';
  });
  
  // replace equals conditional blocks
  result = result.replace(/{{#equals (\w+) (\w+)}}([\s\s]*?){{\/equals}}/g, (match, varName, varValue, content) => {
    const value = data[varName];
    return value === varValue ? content : '';
  });
  
  // replace each loops
  result = result.replace(/{{#each (\w+)}}([\s\s]*?){{\/each}}/g, (match, arraykey, template) => {
    const array = data[arraykey];
    if (!array || !array.length) return '';
    
    return array.map(item => {
      return template.replace(/{{this\.(\w+)}}/g, (match, key) => {
        return item[key] !== null && item[key] !== undefined ? item[key] : '';
      }).replace(/{{\.}}/g, item);
    }).join('');
  });
  
  // replace helper functions
  result = result.replace(/{{formatcurrency (\w+(\.\w+)*) (\w+)}}/g, (match, keypath, currency) => {
    const keys = keypath.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '0'; // not found, return 0
      }
    }
    return formatCurrency(parseFloat(value) || 0, currency);
  });
  
  result = result.replace(/{{capitalizefirst (\w+(\.\w+)*)}}/g, (match, keypath) => {
    const keys = keypath.split('.');
    let value = data;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return ''; // not found, return empty
      }
    }
    return capitalizeFirst(String(value || ''));
  });
  
  return result;
};

// generate pdf for an invoice
const generateInvoicePDF = async (invoiceId, userId) => {
  try {
    // get invoice
    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId }
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // get user information
    const user = await User.findOne({
      where: { id: userId },
      attributes: { exclude: ['password'] }
    });
    
    // get invoice items
    const items = await InvoiceItem.findAll({
      where: { invoiceId }
    });
    
    // get client information
    const client = await Client.findOne({
      where: { id: invoice.clientId }
    });
    
    // calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate || 0) / 100), 0);
    const total = subtotal + taxAmount;
    
    // prepare data for template
    const templateData = {
      // Invoice basic info
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formatDate(invoice.invoiceDate || invoice.issueDate),
      dueDate: formatDate(invoice.dueDate),
      status: invoice.status || 'draft',
      
      // Company info (seller)
      companyName: user.companyName || 'Your Company',
      companyAddress: user.address || '',
      companyCity: user.city || '',
      companyPostalCode: user.postalCode || '',
      companyPhone: user.phone || '',
      companyEmail: user.email || '',
      
      // Client info (buyer)
      clientName: client ? client.name : (invoice.buyerName || 'Client'),
      clientAddress: client ? client.address : (invoice.buyerAddress || ''),
      clientCity: client ? client.city : '',
      clientPostalCode: client ? client.postalCode : '',
      clientPhone: client ? client.phone : '',
      clientEmail: client ? client.email : '',
      
      // Items
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: (item.unitPrice || 0).toFixed(2),
        taxRate: (item.taxRate || 0).toFixed(1),
        total: ((item.quantity || 0) * (item.unitPrice || 0) * (1 + (item.taxRate || 0) / 100)).toFixed(2)
      })),
      
      // Totals
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      
      // Additional info
      notes: invoice.notes || '',
      currentdate: new Date().toLocaleDateString('zh-CN')
    };
    
    // read html template
    const templatePath = path.join(__dirname, '../../templates/invoice.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // render template with data
    const htmlContent = renderTemplate(template, templateData);
    
    // create pdf directory if it doesn't exist
    const pdfDir = path.join(__dirname, '../../', process.env.PDF_DIR || 'generated_pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    // define pdf file path with new format: invoice-{number}-{yyyymmdd}.pdf
    const issueDate = new Date(invoice.invoiceDate || invoice.issueDate);
    const dateStr = formatDateForFilename(invoice.invoiceDate || invoice.issueDate);
    const invoiceNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFileName = `invoice-${invoiceNumber}-${dateStr}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFileName);
    
    // launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      // create a new page
      const page = await browser.newPage();
      
      // set html content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // generate pdf
      await page.pdf({
        path: pdfPath,
        format: 'a4',
        printbackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      // close browser
      await browser.close();
      
      return {
        success: true,
        filePath: pdfPath,
        fileName: pdfFileName
      };
    } catch (error) {
      // ensure browser is closed even if there's an error
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('generate pdf error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateInvoicePDF
};