const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { getFrenchLabel } = require('../utils/frenchLabels');
const { Invoice } = require('../models');
const { InvoiceItem } = require('../models');
const { User } = require('../models');
const { Client } = require('../models');

// Helper function to format currency
const formatCurrency = (amount, currency) => {
  // Use a custom format to avoid space character issues in PDF
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(amount);
  
  // Replace non-breaking space with regular space to avoid PDF rendering issues
  return formatted.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ');
};

// Helper function to format date
const formatDate = (datestring) => {
  const date = new Date(datestring);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format date for filename (yyyymmdd)
const formatDateForFilename = (datestring) => {
  const date = new Date(datestring);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Helper function to draw a rounded rectangle
const drawRoundedRect = (doc, x, y, width, height, radius) => {
  doc.roundedRect(x, y, width, height, radius);
};

// Helper function to add section with background
const addSectionBackground = (doc, x, y, width, height, color = '#f9fafb') => {
  doc.save()
     .fillColor(color)
     .rect(x, y, width, height)
     .fill()
     .restore();
};

// Generate invoice PDF using PDFKit
const generateInvoicePDF = async (invoiceData, userData, clientData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document with better margins and layout
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'A4',
        info: {
          Title: `Invoice ${invoiceData.invoiceNumber}`,
          Author: userData.Company?.name || 'Company',
          Subject: 'Invoice',
          Keywords: 'invoice, billing'
        }
      });
      
      // 注册法语字体以支持法语字符
      // 使用系统内置字体或者fallback到支持Unicode的字体
      try {
        // 尝试使用系统字体路径
        const fontPaths = [
          'C:\\Windows\\Fonts\\simhei.ttf',  // 黑体
          'C:\\Windows\\Fonts\\simsun.ttc',  // 宋体
          'C:\\Windows\\Fonts\\msyh.ttc',    // 微软雅黑
          'C:\\Windows\\Fonts\\arial.ttf'    // Arial作为fallback
        ];
        
        let frenchFont = null;
        for (const fontPath of fontPaths) {
          try {
            if (fs.existsSync(fontPath)) {
              doc.registerFont('FrenchFont', fontPath);
              frenchFont = 'FrenchFont';
              break;
            }
          } catch (fontError) {
            // 继续尝试下一个字体
            continue;
          }
        }
        
        // 如果没有找到法语字体，使用默认字体但确保文本编码正确
        if (!frenchFont) {
          console.warn(getFrenchLabel('fontNotFound'));
        }
      } catch (fontError) {
        console.warn(getFrenchLabel('fontRegistrationFailed'), fontError.message);
      }
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // Define colors matching frontend design
      const colors = {
        primary: '#111827',      // text-gray-900
        secondary: '#6b7280',    // text-gray-500
        accent: '#3b82f6',       // text-blue-600
        background: '#f9fafb',   // bg-gray-50
        border: '#e5e7eb',       // border-gray-200
        success: '#10b981'       // text-green-600
      };

      // Page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Header section with modern design - Extended height for better layout
      doc.fillColor(colors.background)
         .rect(0, 0, pageWidth, 160)
         .fill();

      // Company information (left side) - 直接使用用户数据，因为发票数据中没有销售方信息字段
      const companyName = userData.companyName || userData.Company?.name || 'TechSolutions SARL';
      const companyAddress = userData.address || userData.Company?.address || '';
      const companyPhone = userData.phone || userData.Company?.phone || '';
      const companyEmail = userData.email || userData.Company?.email || '';
      const companyVAT = userData.vatNumber || userData.Company?.vatNumber || '';
      const companySIREN = userData.siren || userData.Company?.siren || '';
      const companySIRET = userData.siretNumber || userData.Company?.siret || '';
      const companyLegalForm = userData.legalForm || userData.Company?.legalForm || '';
      const companyCapital = userData.registeredCapital || userData.Company?.registeredCapital || '';
      const companyRCS = userData.rcsNumber || userData.Company?.rcsNumber || '';
      const companyNAF = userData.nafCode || userData.Company?.nafCode || '';
      const companyTvaExempt = userData.Company?.tvaExempt || false;
      const companyPostalCode = userData.postalCode || userData.Company?.postalCode || '';
      const companyCity = userData.city || userData.Company?.city || '';
      const companyCountry = userData.country || userData.Company?.country || '';
      
      // Company name with enhanced styling (顶部只显示公司名称)
      doc.fillColor(colors.primary)
         .fontSize(26)
         .font('Helvetica-Bold')
         .text(companyName, margin, 25, {
           width: 380,
           align: 'left',
           lineBreak: false
         });

      // Add a subtle line under company name for visual separation
      doc.strokeColor(colors.accent)
         .lineWidth(2)
         .moveTo(margin, 55)
         .lineTo(margin + 200, 55)
         .stroke();

      // 移除顶部重复的联系信息（地址、电话、邮箱），这些信息已在卖方信息区域显示
      
      // Invoice title with enhanced styling
      doc.fillColor(colors.accent)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text(getFrenchLabel('invoiceTitle'), pageWidth - margin - 150, 80, { align: 'right', width: 150 });

      // Invoice type indicator (French compliance requirement - invoice type identification added)
      if (invoiceData.type) {
        const typeLabels = {
          'standard': getFrenchLabel('standardInvoice'),
          'credit': getFrenchLabel('creditNote'),
          'debit': getFrenchLabel('debitNote'),
          'proforma': getFrenchLabel('proformaInvoice'),
          'deposit': getFrenchLabel('depositInvoice'),
          'final': getFrenchLabel('finalInvoice')
        };
        
        const typeLabel = typeLabels[invoiceData.type] || getFrenchLabel('standardInvoice');
        
        doc.fillColor(colors.secondary)
           .fontSize(10)
           .font('Helvetica')
           .text(`${getFrenchLabel('invoiceType')}: ${typeLabel}`, pageWidth - margin - 150, 110, { align: 'right', width: 150 });
      }

      // Template information (if available)
      if (invoiceData.template) {
        doc.fillColor(colors.secondary)
           .fontSize(9)
           .font('Helvetica')
           .text(`${getFrenchLabel('template')}: ${invoiceData.template}`, pageWidth - margin - 150, 125, { align: 'right', width: 150 });
      }

      // 确保使用实际发票数据而非测试数据
      const actualIssueDate = invoiceData.issueDate || invoiceData.date || new Date();
      const actualDueDate = invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Seller information section (left side) - 将卖方信息移到左侧
      let clientSectionY = 180; // 增加Y坐标以避免与公司信息重叠
      const sellerSectionHeight = 120;
      const clientSectionHeight = 120;

      // "VENDEUR" section with enhanced styling
      doc.strokeColor(colors.border)
         .lineWidth(1)
         .rect(margin, clientSectionY, contentWidth/2 - 10, sellerSectionHeight)
         .stroke();

      doc.fillColor('#f0f8ff')
         .rect(margin + 1, clientSectionY + 1, contentWidth/2 - 12, sellerSectionHeight - 2)
         .fill();

      doc.fillColor(colors.secondary)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(getFrenchLabel('seller'), margin + 15, clientSectionY + 15);

      doc.font('Helvetica')
         .fontSize(11)
         .fillColor(colors.primary);

      // 显示卖方信息
      let sellerY = clientSectionY + 35;
      doc.text(companyName, margin + 15, sellerY);
      sellerY += 15;

      // 地址信息
      if (companyAddress) {
        doc.text(companyAddress, margin + 15, sellerY);
        sellerY += 15;
      }
      if (companyCity && companyPostalCode) {
        doc.text(`${companyCity}, ${companyPostalCode}`, margin + 15, sellerY);
        sellerY += 15;
      }
      if (companyCountry) {
        doc.text(companyCountry, margin + 15, sellerY);
        sellerY += 15;
      }

      // 联系信息
      if (companyPhone) {
        doc.text(`${getFrenchLabel('phone')}: ${companyPhone}`, margin + 15, sellerY);
        sellerY += 15;
      }
      if (companyEmail) {
        doc.text(`${getFrenchLabel('email')}: ${companyEmail}`, margin + 15, sellerY);
        sellerY += 15;
      }

      // 法律信息
      if (companyVAT) {
        doc.text(`${getFrenchLabel('vatNumber')}: ${companyVAT}`, margin + 15, sellerY);
        sellerY += 15;
      }
      if (companySIREN) {
        doc.text(`${getFrenchLabel('siren')}: ${companySIREN}`, margin + 15, sellerY);
        sellerY += 15;
      }
      if (companySIRET) {
        doc.text(`${getFrenchLabel('siret')}: ${companySIRET}`, margin + 15, sellerY);
        sellerY += 15;
      }

      // French template specific: TVA status display
      if (companyTvaExempt) {
        doc.fillColor(colors.accent)
           .fontSize(9)
           .font('Helvetica-Bold')
           .text(getFrenchLabel('tvaExemptStatus'), margin + 15, sellerY);
        sellerY += 12;
      }

      // Client information section (right side) - 将客户信息移到右侧
      const detailsX = margin + contentWidth/2 + 10;

      doc.strokeColor(colors.border)
         .lineWidth(1)
         .rect(detailsX, clientSectionY, contentWidth/2 - 10, clientSectionHeight)
         .stroke();

      doc.fillColor('#f0f8ff')
         .rect(detailsX + 1, clientSectionY + 1, contentWidth/2 - 12, clientSectionHeight - 2)
         .fill();

      doc.fillColor(colors.secondary)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(getFrenchLabel('billedTo'), detailsX + 15, clientSectionY + 15);

      doc.font('Helvetica')
         .fontSize(11)
         .fillColor(colors.primary);

      // 处理客户信息，确保正确的文本编码
      let clientY = clientSectionY + 35;

      // 安全地处理客户名称，确保文本编码正确
      if (clientData?.company) {
        const safeCompany = Buffer.isBuffer(clientData.company) ? clientData.company.toString('utf8') : String(clientData.company);
        doc.text(safeCompany, detailsX + 15, clientY);
        clientY += 15;
      }
      if (clientData?.address) {
        const safeAddress = Buffer.isBuffer(clientData.address) ? clientData.address.toString('utf8') : String(clientData.address);
        doc.text(safeAddress, detailsX + 15, clientY);
        clientY += 15;
      }
      if (clientData?.city && clientData?.postalCode) {
        const safeCity = Buffer.isBuffer(clientData.city) ? clientData.city.toString('utf8') : String(clientData.city);
        const safePostalCode = Buffer.isBuffer(clientData.postalCode) ? clientData.postalCode.toString('utf8') : String(clientData.postalCode);
        doc.text(`${safeCity}, ${safePostalCode}`, detailsX + 15, clientY);
        clientY += 15;
      }
      if (clientData?.country) {
        const safeCountry = Buffer.isBuffer(clientData.country) ? clientData.country.toString('utf8') : String(clientData.country);
        doc.text(safeCountry, detailsX + 15, clientY);
        clientY += 15;
      }

      // Add client VAT number if available
      if (clientData?.vatNumber) {
        const safeVAT = Buffer.isBuffer(clientData.vatNumber) ? clientData.vatNumber.toString('utf8') : String(clientData.vatNumber);
        doc.text(`${getFrenchLabel('vatNumber')}: ${safeVAT}`, detailsX + 15, clientY);
        clientY += 15;
      }

      // Add client SIREN if available
      if (clientData?.siren) {
        const safeSIREN = Buffer.isBuffer(clientData.siren) ? clientData.siren.toString('utf8') : String(clientData.siren);
        doc.text(`${getFrenchLabel('siren')}: ${safeSIREN}`, detailsX + 15, clientY);
        clientY += 15;
      }

      // Add client SIRET if available
      if (clientData?.siret) {
        const safeSIRET = Buffer.isBuffer(clientData.siret) ? clientData.siret.toString('utf8') : String(clientData.siret);
        doc.text(`${getFrenchLabel('siret')}: ${safeSIRET}`, detailsX + 15, clientY);
      }

      // Delivery address section (if different from billing address)
      let deliveryAddressY = clientSectionY + clientSectionHeight + 20;

      // Check if delivery address is different from billing address
      const hasDeliveryAddress = (
        (invoiceData.deliveryAddress && invoiceData.deliveryAddress !== clientData?.address) ||
        (invoiceData.deliveryCity && invoiceData.deliveryCity !== clientData?.city) ||
        (invoiceData.deliveryPostalCode && invoiceData.deliveryPostalCode !== clientData?.postalCode) ||
        (invoiceData.deliveryCountry && invoiceData.deliveryCountry !== clientData?.country) ||
        (clientData?.deliveryAddress && clientData.deliveryAddress !== clientData?.address) ||
        (clientData?.deliveryCity && clientData.deliveryCity !== clientData?.city) ||
        (clientData?.deliveryPostalCode && clientData.deliveryPostalCode !== clientData?.postalCode) ||
        (clientData?.deliveryCountry && clientData.deliveryCountry !== clientData?.country)
      );

      if (hasDeliveryAddress) {
        // Calculate delivery section height
        let estimatedDeliveryHeight = 40; // Base height for title
        if (invoiceData.deliveryAddress || clientData?.deliveryAddress) estimatedDeliveryHeight += 15;
        if ((invoiceData.deliveryCity || clientData?.deliveryCity) && (invoiceData.deliveryPostalCode || clientData?.deliveryPostalCode)) estimatedDeliveryHeight += 15;
        if (invoiceData.deliveryCountry || clientData?.deliveryCountry) estimatedDeliveryHeight += 15;
        if (invoiceData.deliveryDate) estimatedDeliveryHeight += 15;
        
        const deliverySectionHeight = Math.max(80, estimatedDeliveryHeight + 20);
        
        // "Adresse de livraison" section
        doc.strokeColor(colors.border)
           .lineWidth(1)
           .rect(detailsX, deliveryAddressY, contentWidth/2 - 10, deliverySectionHeight)
           .stroke();
        
        doc.fillColor('#f0f8ff')
           .rect(detailsX + 1, deliveryAddressY + 1, contentWidth/2 - 12, deliverySectionHeight - 2)
           .fill();

        doc.fillColor(colors.secondary)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(getFrenchLabel('deliveryAddress'), detailsX + 15, deliveryAddressY + 15);

        doc.font('Helvetica')
           .fontSize(11)
           .fillColor(colors.primary);

        let deliveryY = deliveryAddressY + 35;
        
        // Use invoice-level delivery address first, then client default delivery address
        const deliveryAddress = invoiceData.deliveryAddress || clientData?.deliveryAddress;
        const deliveryCity = invoiceData.deliveryCity || clientData?.deliveryCity;
        const deliveryPostalCode = invoiceData.deliveryPostalCode || clientData?.deliveryPostalCode;
        const deliveryCountry = invoiceData.deliveryCountry || clientData?.deliveryCountry;
        
        if (deliveryAddress) {
          const safeDeliveryAddress = Buffer.isBuffer(deliveryAddress) ? deliveryAddress.toString('utf8') : String(deliveryAddress);
          doc.text(safeDeliveryAddress, detailsX + 15, deliveryY);
          deliveryY += 15;
        }
        
        if (deliveryCity && deliveryPostalCode) {
          const safeDeliveryCity = Buffer.isBuffer(deliveryCity) ? deliveryCity.toString('utf8') : String(deliveryCity);
          const safeDeliveryPostalCode = Buffer.isBuffer(deliveryPostalCode) ? deliveryPostalCode.toString('utf8') : String(deliveryPostalCode);
          doc.text(`${safeDeliveryCity}, ${safeDeliveryPostalCode}`, detailsX + 15, deliveryY);
          deliveryY += 15;
        }
        
        if (deliveryCountry) {
          const safeDeliveryCountry = Buffer.isBuffer(deliveryCountry) ? deliveryCountry.toString('utf8') : String(deliveryCountry);
          doc.text(safeDeliveryCountry, detailsX + 15, deliveryY);
          deliveryY += 15;
        }
        
        // Add delivery date if available
        if (invoiceData.deliveryDate) {
          doc.fillColor(colors.secondary)
             .fontSize(10)
             .font('Helvetica-Bold')
             .text(getFrenchLabel('deliveryDate'), detailsX + 15, deliveryY);
          
          doc.fillColor(colors.primary)
             .fontSize(11)
             .font('Helvetica')
             .text(formatDate(invoiceData.deliveryDate), detailsX + 15, deliveryY + 12);
        }
        
        // Update the invoice details Y position to account for delivery address section
        deliveryAddressY += deliverySectionHeight + 20;
      }

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;
      if (invoiceData.InvoiceItems && invoiceData.InvoiceItems.length > 0) {
        invoiceData.InvoiceItems.forEach(item => {
          const itemSubtotal = item.quantity * item.unitPrice;
          // Check for TVA exemption or auto-liquidation
          const itemTax = (invoiceData.tvaExempt || invoiceData.autoLiquidation) ? 0 : itemSubtotal * (item.taxRate / 100);
          subtotal += itemSubtotal;
          totalTax += itemTax;
        });
      }
      const total = subtotal + totalTax;

      // Invoice details section (below both sections)
      const newInvoiceDetailsY = hasDeliveryAddress ? deliveryAddressY : clientSectionY + Math.max(sellerSectionHeight, clientSectionHeight) + 20;

      // Invoice details with enhanced design
      doc.fillColor(colors.secondary)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(getFrenchLabel('invoiceDetails'), margin, newInvoiceDetailsY);

      doc.fillColor(colors.primary)
         .fontSize(11)
         .font('Helvetica');

      let detailsY = newInvoiceDetailsY + 20;
      doc.text(`${getFrenchLabel('invoiceNumber')}: ${invoiceData.invoiceNumber}`, margin, detailsY);
      doc.text(`${getFrenchLabel('date')}: ${formatDate(actualIssueDate)}`, margin + 200, detailsY);

      detailsY += 15;
      doc.text(`${getFrenchLabel('dueDate')}: ${formatDate(actualDueDate)}`, margin, detailsY);

      // Add order reference if available
      if (invoiceData.orderReference) {
        detailsY += 15;
        doc.text(`${getFrenchLabel('orderNumber')}: ${invoiceData.orderReference}`, margin, detailsY);
      }

      // Add contract reference if available
      if (invoiceData.contractReference) {
        detailsY += 15;
        doc.text(`${getFrenchLabel('contractNumber')}: ${invoiceData.contractReference}`, margin, detailsY);
      }

      // Add service date if available
      if (invoiceData.serviceDate || invoiceData.deliveryDate) {
        detailsY += 15;
        const serviceDate = invoiceData.serviceDate || invoiceData.deliveryDate;
        doc.text(`${getFrenchLabel('serviceDate')}: ${formatDate(serviceDate)}`, margin, detailsY);
      }

      // Items table with enhanced styling
      // Calculate table Y position based on invoice details section - adjust for potential order/contract references
      let tableY = newInvoiceDetailsY + 90; // Increased from 60 to accommodate order/contract references
      
      // Additional spacing if order or contract references are present
      if (invoiceData.orderReference || invoiceData.contractReference) {
        tableY += 30; // Add extra space for the additional reference fields
      }
      
      // Table header with enhanced background and gradient effect
      const tableHeaderHeight = 35;
      
      // Add gradient-like effect with multiple rectangles
      doc.fillColor('#e9ecef')
         .rect(margin, tableY, contentWidth, tableHeaderHeight)
         .fill();
      
      doc.fillColor('#f8f9fa')
         .rect(margin, tableY, contentWidth, 3)
         .fill();
      
      doc.strokeColor(colors.border)
         .lineWidth(2)
         .rect(margin, tableY, contentWidth, tableHeaderHeight)
         .stroke();
      
      doc.fillColor(colors.secondary)
         .fontSize(10)
         .font('Helvetica-Bold');

      const colWidths = {
        description: 220,
        quantity: 60,
        unitPrice: 80,
        taxRate: 60,
        total: 80
      };

      let colX = margin + 15;
      doc.text(getFrenchLabel('description'), colX, tableY + 12);
      colX += colWidths.description;
      doc.text(getFrenchLabel('quantity'), colX, tableY + 12);
      colX += colWidths.unitPrice;
      doc.text(getFrenchLabel('unitPrice'), colX, tableY + 12);
      colX += colWidths.unitPrice;
      doc.text(getFrenchLabel('vatRate'), colX, tableY + 12);
      colX += colWidths.taxRate;
      doc.text(getFrenchLabel('total'), colX, tableY + 12);

      // Table header border
      doc.strokeColor(colors.border)
         .lineWidth(1)
         .rect(margin, tableY, contentWidth, tableHeaderHeight)
         .stroke();

      tableY += tableHeaderHeight;

      // Items rows with enhanced styling
      if (invoiceData.InvoiceItems && invoiceData.InvoiceItems.length > 0) {
        invoiceData.InvoiceItems.forEach((item, index) => {
          const itemSubtotal = item.quantity * item.unitPrice;
          // Check for TVA exemption or auto-liquidation
          const itemTax = (invoiceData.tvaExempt || invoiceData.autoLiquidation) ? 0 : itemSubtotal * (item.taxRate / 100);
          const itemTotalWithTax = itemSubtotal + itemTax;

          const rowHeight = 30;
          
          // Enhanced alternate row background with subtle colors
          if (index % 2 === 1) {
            doc.fillColor('#f8f9fa')
               .rect(margin, tableY, contentWidth, rowHeight)
               .fill();
          } else {
            doc.fillColor('#ffffff')
               .rect(margin, tableY, contentWidth, rowHeight)
               .fill();
          }

          doc.fillColor(colors.primary)
             .fontSize(11)
             .font('Helvetica');

          colX = margin + 15;
          doc.text(item.description || 'Service', colX, tableY + 10, { width: colWidths.description - 20 });
          colX += colWidths.description;
          doc.text(item.quantity.toString(), colX, tableY + 10);
          colX += colWidths.quantity;
          doc.text(formatCurrency(item.unitPrice), colX, tableY + 10);
          colX += colWidths.unitPrice;
          // Display tax rate with appropriate label for TVA exempt/auto-liquidation
          let taxRateDisplay = `${item.taxRate}%`;
          if (invoiceData.tvaExempt) {
            taxRateDisplay = 'Exonéré';
          } else if (invoiceData.autoLiquidation) {
            taxRateDisplay = 'Auto-liq.';
          }
          doc.text(taxRateDisplay, colX, tableY + 10);
          colX += colWidths.taxRate;
          doc.text(formatCurrency(itemTotalWithTax), colX, tableY + 10);

          // Enhanced row border with subtle styling
          doc.strokeColor('#e9ecef')
             .lineWidth(0.5)
             .rect(margin, tableY, contentWidth, rowHeight)
             .stroke();

          tableY += rowHeight;
        });
      }

      // Enhanced Totals section with modern styling
      tableY += 30; // Increased spacing after table for better visual separation
      const totalsWidth = 220;
      const totalsX = pageWidth - margin - totalsWidth;

      // Create a modern totals box with border and background
      const totalsBoxHeight = 90;
      doc.strokeColor(colors.border)
         .lineWidth(1)
         .rect(totalsX - 15, tableY - 10, totalsWidth + 30, totalsBoxHeight)
         .stroke();
      
      doc.fillColor('#f8f9fa')
         .rect(totalsX - 14, tableY - 9, totalsWidth + 28, totalsBoxHeight - 2)
         .fill();

      // Subtotal
      doc.fillColor(colors.primary)
         .fontSize(11)
         .font('Helvetica')
         .text(getFrenchLabel('subtotal'), totalsX, tableY)
         .text(formatCurrency(subtotal), totalsX + 120, tableY, { align: 'right', width: 80 });

      tableY += 18;
      
      // TVA line with enhanced styling
      let totalsTvaLabel = getFrenchLabel('vatAmount');
      if (invoiceData.tvaExempt) {
        totalsTvaLabel = getFrenchLabel('vatExempt');
      } else if (invoiceData.autoLiquidation) {
        totalsTvaLabel = getFrenchLabel('vatAutoLiquidation');
      }
      
      doc.text(totalsTvaLabel, totalsX, tableY)
         .text(formatCurrency(totalTax), totalsX + 120, tableY, { align: 'right', width: 80 });

      // Total with enhanced background and styling
      tableY += 25;
      
      // Highlight total with accent color background
      doc.fillColor(colors.accent)
         .rect(totalsX - 10, tableY - 5, totalsWidth + 20, 25)
         .fill();
      
      doc.fillColor('#ffffff')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(getFrenchLabel('totalAmount'), totalsX, tableY)
         .text(formatCurrency(total), totalsX + 120, tableY, { align: 'right', width: 80 });

      // Enhanced Notes section
      if (invoiceData.notes) {
        tableY += 60;
        
        // Notes header with modern styling
        doc.fillColor(colors.secondary)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(getFrenchLabel('notes'), margin, tableY);

        tableY += 20;
        
        // Enhanced notes box with border and background
        const notesHeight = 50;
        doc.strokeColor(colors.border)
           .lineWidth(1)
           .rect(margin, tableY, contentWidth, notesHeight)
           .stroke();
        
        doc.fillColor('#fffbf0')
           .rect(margin + 1, tableY + 1, contentWidth - 2, notesHeight - 2)
           .fill();
        
        doc.fillColor(colors.primary)
           .fontSize(11)
           .font('Helvetica')
           .text(invoiceData.notes, margin + 15, tableY + 15, { width: contentWidth - 30 });
        
        tableY += notesHeight + 10;
      }

      // Enhanced Legal compliance section (French requirements)
      tableY += 20;
      const legalSectionHeight = 120; // Increased height for more content

      // Blue background for legal section
      doc.fillColor('#eff6ff')
         .rect(margin, tableY, contentWidth, legalSectionHeight)
         .fill();

      doc.strokeColor('#3b82f6')
         .lineWidth(1)
         .rect(margin, tableY, contentWidth, legalSectionHeight)
         .stroke();

      doc.fillColor(colors.primary)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(getFrenchLabel('legalDeclarations'), margin + 15, tableY + 15);

      // Payment terms (required by French law)
      let legalTextY = tableY + 35;
      doc.fontSize(9)
         .font('Helvetica')
         .text(getFrenchLabel('paymentTermsLabel'), margin + 15, legalTextY)
         .font('Helvetica-Bold');

      legalTextY += 15;

      // Display specific payment terms if available
      let paymentTermsText = '';
      if (invoiceData.paymentTerms) {
        const termsMap = {
          'immediate': getFrenchLabel('paymentImmediate'),
          '15_days': getFrenchLabel('payment15Days'),
          '30_days': getFrenchLabel('payment30Days'),
          '45_days': getFrenchLabel('payment45Days'),
          '60_days': getFrenchLabel('payment60Days'),
          'end_of_month': getFrenchLabel('paymentEndOfMonth'),
          'end_of_month_plus_30': getFrenchLabel('paymentEndOfMonthPlus30')
        };
        paymentTermsText = termsMap[invoiceData.paymentTerms] || getFrenchLabel('paymentOnDue');
      } else {
        paymentTermsText = getFrenchLabel('paymentOnDue');
      }

      doc.text(`${paymentTermsText}. ${getFrenchLabel('latePaymentPenalty')}`, 
               margin + 15, legalTextY, { width: contentWidth - 30 });

      // Bank account information (if available)
      if (userData.bankAccount || userData.iban || userData.bic) {
        legalTextY += 25;
        doc.font('Helvetica-Bold')
           .text(getFrenchLabel('bankInformation'), margin + 15, legalTextY);

        legalTextY += 15;
        doc.font('Helvetica');

        if (userData.iban) {
          doc.text(`${getFrenchLabel('iban')}: ${userData.iban}`, margin + 15, legalTextY);
          legalTextY += 12;
        }

        if (userData.bic) {
          doc.text(`${getFrenchLabel('bic')}: ${userData.bic}`, margin + 15, legalTextY);
          legalTextY += 12;
        }

        if (userData.bankAccount && !userData.iban) {
          doc.text(`${getFrenchLabel('bankAccount')}: ${userData.bankAccount}`, margin + 15, legalTextY);
          legalTextY += 12;
        }

        if (userData.bankName) {
          doc.text(`${getFrenchLabel('bankName')}: ${userData.bankName}`, margin + 15, legalTextY);
        }
      }

      // Additional legal notes based on invoice type
      legalTextY += 35;
      doc.font('Helvetica-Bold');

      if (invoiceData.tvaExempt) {
        doc.text(getFrenchLabel('tvaNotApplicableLabel'), margin + 15, legalTextY);
        legalTextY += 12;
        doc.font('Helvetica')
           .text(getFrenchLabel('tvaNotApplicableText'), 
                 margin + 15, legalTextY, { width: contentWidth - 30 });
      } else if (invoiceData.autoLiquidation) {
        doc.text(getFrenchLabel('autoLiquidationLabel'), margin + 15, legalTextY);
        legalTextY += 12;
        doc.font('Helvetica')
           .text(getFrenchLabel('autoLiquidationText'), 
                 margin + 15, legalTextY, { width: contentWidth - 30 });
      } else {
        doc.text(getFrenchLabel('legalComplianceLabel'), margin + 15, legalTextY);
        legalTextY += 12;
        doc.font('Helvetica')
           .text(getFrenchLabel('legalComplianceText'), 
                 margin + 15, legalTextY, { width: contentWidth - 30 });
      }

      // Company legal details at bottom - Enhanced for French legal requirements
      const bottomY = pageHeight - 80;
      doc.fillColor(colors.secondary)
         .fontSize(9)
         .font('Helvetica');

      // French legal information section
      let legalInfoY = bottomY;
      const legalLineHeight = 12;

      // Build comprehensive legal information array
      const legalInfo = [];

      // Legal form and capital
      if (companyLegalForm) {
        legalInfo.push(`${companyLegalForm}`);
      }
      if (companyCapital) {
        legalInfo.push(`${getFrenchLabel('capital')}: ${formatCurrency(companyCapital)}`);
      }

      // SIRET (14 digits)
      if (companySIRET) {
        legalInfo.push(`${getFrenchLabel('siret')}: ${companySIRET}`);
      }

      // SIREN (9 digits) - if different from SIRET
      if (companySIREN && companySIRET && companySIREN !== companySIRET.substring(0, 9)) {
        legalInfo.push(`${getFrenchLabel('siren')}: ${companySIREN}`);
      }

      // RCS number
      if (companyRCS) {
        legalInfo.push(`${getFrenchLabel('rcs')}: ${companyRCS}`);
      }

      // NAF code
      if (companyNAF) {
        legalInfo.push(`${getFrenchLabel('naf')}: ${companyNAF}`);
      }

      // EU VAT number
      if (companyVAT) {
        legalInfo.push(`${getFrenchLabel('vatIntraCommunity')}: ${companyVAT}`);
      }

      // Display legal information in multiple lines if needed
      if (legalInfo.length > 0) {
        // Split into multiple lines if too long for single line
        const maxLineLength = 80; // Approximate characters per line
        let currentLine = '';
        const lines = [];
        
        legalInfo.forEach((info, index) => {
          if (currentLine.length + info.length + 2 < maxLineLength) {
            currentLine += (currentLine ? ' • ' : '') + info;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = info;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        // Display each line
        lines.forEach((line, index) => {
          doc.text(line, margin, legalInfoY + (index * legalLineHeight));
        });
      }

      // Additional legal notes if applicable
      const additionalNotes = [];

      // TVA exemption note
      if (companyTvaExempt) {
        additionalNotes.push(getFrenchLabel('tvaNotApplicableShort'));
      }

      // Auto-liquidation note
      if (invoiceData.autoLiquidation) {
        additionalNotes.push(getFrenchLabel('autoLiquidationShort'));
      }

      if (additionalNotes.length > 0) {
        doc.fontSize(8)
           .fillColor(colors.accent)
           .text(additionalNotes.join(' • '), margin, legalInfoY + 20);
      }

      // Finalize the PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF
};