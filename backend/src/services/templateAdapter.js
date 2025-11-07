/**
 * 基础模板适配器
 * 提供统一的模板渲染接口，支持邮件、PDF和打印格式
 */
const { getFrenchLabel } = require('../utils/frenchLabels');
const PrintTemplateAdapter = require('./printTemplateAdapter');
const PDFTemplateAdapter = require('./pdfTemplateAdapter');

class TemplateAdapter {
  constructor() {
    this.supportedFormats = ['email', 'pdf', 'print'];
    this.supportedTemplates = [
      'french-standard',
      'tva-exempt',
      'self-liquidation'
    ];
    
    // 初始化子适配器
    this.pdfAdapter = new PDFTemplateAdapter();
    this.printAdapter = new PrintTemplateAdapter();
    
    this.templateConfig = {
      email: {
        maxWidth: 600,
        primaryColor: '#007bff',
        secondaryColor: '#6c757d'
      },
      pdf: {
        pageSize: 'A4',
        margin: 50,
        fontSize: 12
      },
      print: {
        pageSize: 'A4',
        margin: 20,
        fontSize: 11
      }
    };
  }

  /**
   * 验证输入参数
   * @param {Object} data - 发票数据
   * @param {string} format - 输出格式
   * @param {string} templateType - 模板类型
   */
  validateInput(data, format, templateType) {
    if (!data || typeof data !== 'object') {
      throw new Error('必须提供有效的数据对象');
    }

    if (!this.supportedFormats.includes(format)) {
      throw new Error(`不支持的格式: ${format}。支持的格式: ${this.supportedFormats.join(', ')}`);
    }

    if (!this.supportedTemplates.includes(templateType)) {
      throw new Error(`不支持的模板类型: ${templateType}。支持的模板: ${this.supportedTemplates.join(', ')}`);
    }

    // 验证必需的数据字段
    const requiredFields = ['company', 'client', 'invoice', 'items', 'totals'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`缺少必需的数据字段: ${field}`);
      }
    }
  }

  /**
   * 渲染发票模板
   * @param {Object} data - 发票数据
   * @param {string} format - 输出格式 (email, pdf, print)
   * @param {string} templateType - 模板类型
   * @returns {Promise<Object>} 渲染结果
   */
  async renderInvoice(data, format = 'email', templateType = 'french-standard') {
    try {
      this.validateInput(data, format, templateType);
      
      // 根据格式选择对应的适配器
      let result;
      switch (format) {
        case 'email':
          const emailContent = this.generateEmailContent(data, templateType);
          result = {
            success: true,
            content: emailContent
          };
          break;
        case 'pdf':
          result = await this.pdfAdapter.renderPDFTemplate(data, templateType);
          break;
        case 'print':
          result = await this.printAdapter.renderPrintTemplate(data, templateType);
          break;
        default:
          throw new Error(`不支持的格式: ${format}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || '渲染失败');
      }
      
      return {
        success: true,
        content: result.content,
        format: format,
        templateType: templateType,
        metadata: {
          generatedAt: new Date().toISOString(),
          ...result.metadata
        }
      };
    } catch (error) {
      console.error('模板渲染失败:', error);
      return {
        success: false,
        error: '模板渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 生成邮件内容
   */
  generateEmailContent(data, templateType) {
    const { company, client, invoice, items, totals, legalNotes } = data;
    
    // 根据模板类型选择不同的邮件模板
    switch (templateType) {
      case 'tva-exempt':
        return this.generateTVAExemptEmail(company, client, invoice, items, totals, legalNotes);
      
      case 'self-liquidation':
        return this.generateAutoLiquidationEmail(company, client, invoice, items, totals, legalNotes);
      
      case 'french-standard':
      default:
        return this.generateStandardEmail(company, client, invoice, items, totals, legalNotes);
    }
  }

  /**
   * 生成标准法国发票邮件
   */
  generateStandardEmail(company, client, invoice, items, totals, legalNotes) {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${invoice.id}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; background-color: #ffffff; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border: 1px solid #000; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .invoice-title { font-size: 28px; font-weight: bold; color: #000; text-transform: uppercase; }
        .invoice-info { margin: 20px 0; text-align: center; }
        .section { margin: 30px 0; }
        .section h3 { color: #000; border-bottom: 1px solid #000; padding-bottom: 8px; font-size: 16px; text-transform: uppercase; }
        .company-info, .client-info { display: inline-block; width: 48%; vertical-align: top; }
        .company-info { margin-right: 2%; }
        .client-info { margin-left: 2%; }
        .billing-address, .delivery-address { margin: 15px 0; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; }
        .billing-address h4, .delivery-address h4 { margin: 0 0 8px 0; font-size: 14px; color: #333; font-weight: bold; }
        .billing-address p, .delivery-address p { margin: 3px 0; font-size: 13px; }
        .notes-section { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; }
        .notes-section h4 { margin: 0 0 10px 0; font-size: 14px; color: #495057; font-weight: bold; }
        .notes-section p { margin: 0; font-size: 13px; line-height: 1.4; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #000; }
        .items-table th { background-color: #f0f0f0; border: 1px solid #000; padding: 12px; text-align: left; font-weight: bold; }
        .items-table td { border: 1px solid #000; padding: 12px; text-align: left; }
        .totals { text-align: right; margin: 20px 0; }
        .total-line { margin: 8px 0; font-size: 14px; }
        .total-line strong { display: inline-block; width: 150px; }
        .legal-notes { font-size: 11px; color: #333; margin-top: 30px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ccc; }
        .legal-notes h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #000; color: #666; font-size: 12px; }
        .tva-breakdown { margin: 15px 0; font-size: 12px; }
        .tva-rate { display: inline-block; width: 100px; }
        .contact-info { margin: 10px 0; font-size: 12px; }
        .payment-info { margin: 20px 0; padding: 15px; background-color: #f0f8ff; border: 1px solid #b0d4f1; border-radius: 4px; }
        .service-details { margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
        .compliance-section { margin: 20px 0; padding: 15px; background-color: #fff8dc; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="invoice-title">${getFrenchLabel('invoiceTitle')}</h1>
            <div class="invoice-info">
                <p><strong>${getFrenchLabel('invoiceNumber')}:</strong> ${invoice.id}</p>
                <p><strong>${getFrenchLabel('date')}:</strong> ${invoice.date}</p>
                <p><strong>${getFrenchLabel('dueDate')}:</strong> ${invoice.dueDate}</p>
                ${invoice.serviceDate ? `<p><strong>${getFrenchLabel('serviceProvisionDate')}:</strong> ${invoice.serviceDate}</p>` : ''}
            </div>
        </div>

        <div class="section">
            <div class="company-info">
                <h3>${getFrenchLabel('seller')}</h3>
                <p><strong>${company.name}</strong></p>
                <p>${company.address}</p>
                <p>${company.postalCode} ${company.city}</p>
                <p>${company.country}</p>
                
                <!-- Enhanced company contact information -->
                <div class="contact-info">
                    ${company.phone ? `<p><strong>${getFrenchLabel('companyPhone')}:</strong> ${company.phone}</p>` : ''}
                    ${company.email ? `<p><strong>${getFrenchLabel('companyEmail')}:</strong> ${company.email}</p>` : ''}
                    ${company.website ? `<p><strong>${getFrenchLabel('companyWebsite')}:</strong> ${company.website}</p>` : ''}
                </div>
                
                <!-- Legal identifiers -->
                ${company.tvaNumber ? `<p><strong>${getFrenchLabel('vatNumber')}:</strong> ${company.tvaNumber}</p>` : ''}
                ${company.siret ? `<p><strong>${getFrenchLabel('siret')}:</strong> ${company.siret}</p>` : ''}
                ${company.siren ? `<p><strong>${getFrenchLabel('siren')}:</strong> ${company.siren}</p>` : ''}
                ${company.apeCode ? `<p><strong>${getFrenchLabel('apeCodeFull')}:</strong> ${company.apeCode}</p>` : ''}
                ${company.nafCode ? `<p><strong>${getFrenchLabel('nafCode')}:</strong> ${company.nafCode}</p>` : ''}
                ${company.rcs ? `<p><strong>${getFrenchLabel('rcs')}:</strong> ${company.rcs}</p>` : ''}
                
                <!-- Professional insurance information -->
                ${company.professionalInsurance ? `
                <div class="contact-info">
                    <p><strong>${getFrenchLabel('professionalInsurance')}:</strong></p>
                    <p>${getFrenchLabel('insuranceCompany')}: ${company.insuranceCompany || 'Non spécifié'}</p>
                    <p>${getFrenchLabel('insurancePolicy')}: ${company.insurancePolicy || 'Non spécifié'}</p>
                    <p>${getFrenchLabel('insuranceCoverage')}: ${company.insuranceCoverage || 'France et UE'}</p>
                </div>
                ` : ''}
            </div>
            
            <div class="client-info">
                <h3>${getFrenchLabel('destinataire')}</h3>
                
                <!-- Enhanced billing address -->
                <div class="billing-address">
                    <h4>🏢 ${getFrenchLabel('billingAddress')}</h4>
                    <p><strong>${client.name}</strong></p>
                    ${client.contactPerson ? `<p>${getFrenchLabel('attentionOf')}: ${client.contactPerson}</p>` : ''}
                    <p>${client.address}</p>
                    <p>${client.city}, ${client.postalCode}</p>
                    <p>${client.country}</p>
                    
                    <!-- Enhanced client contact information -->
                    ${client.phone ? `<p><strong>${getFrenchLabel('clientPhone')}:</strong> ${client.phone}</p>` : ''}
                    ${client.email ? `<p><strong>${getFrenchLabel('clientEmail')}:</strong> ${client.email}</p>` : ''}
                    ${client.tvaNumber ? `<p><strong>${getFrenchLabel('vatIntraCommunityNumber')}:</strong> ${client.tvaNumber}</p>` : ''}
                </div>
                
                <!-- Delivery Address (if different) -->
                ${client.deliveryAddress && client.deliveryAddress !== client.address ? `
                <div class="delivery-address">
                    <h4>🚚 ${getFrenchLabel('deliveryAddress')}</h4>
                    <p><strong>${client.deliveryName || client.name}</strong></p>
                    ${client.deliveryContactPerson ? `<p>${getFrenchLabel('attentionOf')}: ${client.deliveryContactPerson}</p>` : ''}
                    <p>${client.deliveryAddress}</p>
                    <p>${client.deliveryCity || client.city}, ${client.deliveryPostalCode || client.postalCode}</p>
                    <p>${client.deliveryCountry || client.country}</p>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Enhanced service details section -->
        ${invoice.serviceCategory || invoice.serviceLocation ? `
        <div class="service-details">
            <h4><strong>DÉTAILS DE LA PRESTATION</strong></h4>
            ${invoice.serviceCategory ? `<p><strong>${getFrenchLabel('serviceCategory')}:</strong> ${invoice.serviceCategory}</p>` : ''}
            ${invoice.serviceLocation ? `<p><strong>${getFrenchLabel('serviceLocation')}:</strong> ${invoice.serviceLocation}</p>` : ''}
            ${invoice.serviceDescription ? `<p><strong>${getFrenchLabel('serviceDescription')}:</strong> ${invoice.serviceDescription}</p>` : ''}
        </div>
        ` : ''}

        <div class="section">
            <h3>DÉTAIL DES PRESTATIONS</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>${getFrenchLabel('description')}</th>
                        <th>${getFrenchLabel('quantity')}</th>
                        <th>${getFrenchLabel('unitPrice')} (€)</th>
                        <th>${getFrenchLabel('vatRate')} (%)</th>
                        <th>Total HT (€)</th>
                        <th>Total TTC (€)</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unitPrice.toFixed(2)}</td>
                            <td>${item.tvaRate}%</td>
                            <td>${(item.totalPrice || 0).toFixed(2)}</td>
                            <td>${((item.totalPrice || 0) * (1 + parseFloat(item.tvaRate) / 100)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Enhanced totals section -->
        <div class="totals">
            ${totals.advancePayment ? `<div class="total-line"><strong>${getFrenchLabel('advancePayment')}:</strong> €${totals.advancePayment.toFixed(2)}</div>` : ''}
            <div class="total-line"><strong>${getFrenchLabel('subtotal')}:</strong> €${totals.subtotal.toFixed(2)}</div>
            ${totals.tvaBreakdown ? `
                <div class="tva-breakdown">
                    <strong>${getFrenchLabel('vatBreakdown')}:</strong><br>
                    ${totals.tvaBreakdown.map(rate => `
                        <span class="tva-rate">${getFrenchLabel('vatRate')} ${rate.rate}%:</span> €${rate.amount.toFixed(2)}<br>
                    `).join('')}
                </div>
            ` : ''}
            <div class="total-line"><strong>${getFrenchLabel('totalVat')}:</strong> €${totals.totalTVA.toFixed(2)}</div>
            <div class="total-line"><strong>${getFrenchLabel('total')}:</strong> €${totals.total.toFixed(2)}</div>
            ${totals.advancePayment ? `<div class="total-line"><strong>${getFrenchLabel('remainingAmount')}:</strong> €${(totals.total - totals.advancePayment).toFixed(2)}</div>` : ''}
        </div>

        <!-- Enhanced payment information -->
        <div class="payment-info">
            <h4><strong>${getFrenchLabel('paymentMethod')}</strong></h4>
            <p><strong>${getFrenchLabel('paymentTerms')}:</strong> ${getFrenchLabel('paymentDue')} ${invoice.dueDate}</p>
            
            ${company.iban || company.bic || company.bankName ? `
            <div style="margin-top: 15px;">
                <h4><strong>${getFrenchLabel('bankDetails')}</strong></h4>
                ${company.accountHolder ? `<p><strong>${getFrenchLabel('accountHolder')}:</strong> ${company.accountHolder}</p>` : ''}
                ${company.iban ? `<p><strong>${getFrenchLabel('iban')}:</strong> ${company.iban}</p>` : ''}
                ${company.bic ? `<p><strong>${getFrenchLabel('bic')}:</strong> ${company.bic}</p>` : ''}
                ${company.bankName ? `<p><strong>${getFrenchLabel('bankName')}:</strong> ${company.bankName}</p>` : ''}
            </div>
            ` : ''}
        </div>

        <!-- Notes Section -->
        ${invoice.notes ? `
            <div class="notes-section">
                <h4>${getFrenchLabel('notes')}</h4>
                <p>${invoice.notes}</p>
            </div>
        ` : ''}

        <!-- Enhanced legal compliance section -->
        <div class="compliance-section">
            <h4><strong>${getFrenchLabel('legalMentions')}</strong></h4>
            <p><strong>${getFrenchLabel('complianceStatement')}</strong></p>
            <p><strong>${getFrenchLabel('archivingStatement')}</strong></p>
            ${company.digitalSignature ? `<p><strong>${getFrenchLabel('digitalSignature')}:</strong> Activée</p>` : ''}
        </div>

        ${legalNotes && legalNotes.length > 0 ? `
            <div class="legal-notes">
                <h4>${getFrenchLabel('legalMentions')}</h4>
                ${legalNotes.map(note => `<p>• ${note}</p>`).join('')}
            </div>
        ` : `
            <div class="legal-notes">
                <h4>${getFrenchLabel('legalMentions')}</h4>
                
                <!-- TVA Status Declaration -->
                <div class="tva-status">
                    ${this.generateTVAStatusDeclaration(invoice, company)}
                </div>
                
                <p>• ${getFrenchLabel('vatDeductible')}</p>
                <p>• ${getFrenchLabel('invoiceCompliance')}</p>
                <p>• ${getFrenchLabel('vatSubject')}</p>
                <p>• ${getFrenchLabel('paymentDue')}: ${invoice.dueDate}</p>
                <p>• ${getFrenchLabel('latePaymentPenalty')}</p>
                <p>• ${getFrenchLabel('siret')}: ${company.siret || getFrenchLabel('notProvided')}</p>
                <p>• ${getFrenchLabel('apeCode')}: ${company.apeCode || getFrenchLabel('notProvided')}</p>
            </div>
        `}

        <div class="footer">
            <p><strong>${getFrenchLabel('paymentTerms')}:</strong> ${getFrenchLabel('paymentDue')} ${invoice.dueDate}</p>
            <p><strong>${getFrenchLabel('latePayment')}:</strong> ${getFrenchLabel('latePaymentInterest')}</p>
            <p><strong>${getFrenchLabel('fixedPenalty')}:</strong> 40€ ${getFrenchLabel('fixedPenalty')}</p>
            <p>${getFrenchLabel('thankYou')}</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 生成TVA免税邮件
   */
  generateTVAExemptEmail(company, client, invoice, items, totals, legalNotes) {
    const html = this.generateStandardEmail(company, client, invoice, items, totals, legalNotes);
    
    // 添加详细的TVA免税声明，与发票预览保持一致
    const exemptNote = `
      <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 14px;">${getFrenchLabel('vatExemption')}</h4>
        <p style="margin: 5px 0; font-size: 12px; line-height: 1.4;">
          <strong>${getFrenchLabel('vatExemptInvoice')}</strong>
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #6c757d; line-height: 1.4;">
          ${getFrenchLabel('vatExemptionApplies')}
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #6c757d; line-height: 1.4;">
          <strong>${getFrenchLabel('responsibility')}:</strong> ${getFrenchLabel('providerCertifies')}
        </p>
      </div>`;
    
    return html.replace('</div>\n\n        <div class="legal-notes">', 
                       `</div>\n\n        ${exemptNote}\n        <div class="legal-notes">`);
  }

  /**
   * 生成自清算邮件
   */
  generateAutoLiquidationEmail(company, client, invoice, items, totals, legalNotes) {
    const html = this.generateStandardEmail(company, client, invoice, items, totals, legalNotes);
    
    // 添加详细的自清算声明，与发票预览保持一致
    const autoLiquidationNote = `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 14px;">${getFrenchLabel('vatAutoLiquidation')}</h4>
        <p style="margin: 5px 0; font-size: 12px; line-height: 1.4;">
          <strong>${getFrenchLabel('vatChargeToClient')}</strong>
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #856404; line-height: 1.4;">
          ${getFrenchLabel('intraCommunityService')}
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #856404; line-height: 1.4;">
          <strong>${getFrenchLabel('clientObligations')}:</strong> ${getFrenchLabel('clientMustDeclare')}
        </p>
        <p style="margin: 5px 0; font-size: 11px; color: #856404; line-height: 1.4;">
          <strong>${getFrenchLabel('responsibility')}:</strong> ${getFrenchLabel('frenchProviderExempt')}
        </p>
      </div>`;
    
    // 查找法律声明部分并添加自清算信息
    if (html.includes('<div class="legal-notes">')) {
      return html.replace('<div class="legal-notes">', 
                         `${autoLiquidationNote}\n        <div class="legal-notes">`);
    } else {
      // 如果没有法律声明部分，在footer前添加
      return html.replace('<div class="footer">', 
                         `${autoLiquidationNote}\n\n        <div class="footer">`);
    }
  }

  /**
   * 智能渲染发票
   * 根据客户类型和数据特征自动选择最佳模板
   * @param {Object} data - 发票数据
   * @param {string} format - 输出格式
   * @returns {Promise<Object>} 渲染结果
   */
  async renderInvoiceSmart(data, format = 'email') {
    try {
      // 智能选择模板类型
      const templateType = await this.selectBestTemplate(data);
      
      return await this.renderInvoice(data, format, templateType);
    } catch (error) {
      console.error('智能渲染失败:', error);
      return {
        success: false,
        error: '智能渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 为邮件渲染模板（兼容旧接口）
   * @param {Object} data - 标准化数据
   * @param {string} templateType - 模板类型
   * @returns {Promise<Object>} 渲染结果
   */
  async renderForEmail(data, templateType = 'french-standard') {
    try {
      const result = await this.renderInvoice(data, 'email', templateType);
      
      if (!result.success) {
        return result;
      }

      // 生成文本版本（从HTML中提取纯文本）
      const textContent = this.htmlToText(result.data);
      
      // 生成PDF缓冲区（这里简化处理，实际应该调用PDF生成器）
      const pdfBuffer = Buffer.from(result.data, 'utf8');

      return {
        success: true,
        data: {
          html: result.data,
          text: textContent,
          pdfBuffer: pdfBuffer
        }
      };
    } catch (error) {
      return {
        success: false,
        error: '邮件模板渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 将HTML转换为纯文本
   */
  htmlToText(html) {
    // 简单的HTML转文本转换
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * 为PDF渲染模板（兼容旧接口）
   * @param {Object} data - 标准化数据
   * @param {string} templateType - 模板类型
   * @returns {Promise<Object>} 渲染结果
   */
  async renderForPDF(data, templateType = 'french-standard') {
    return await this.renderInvoice(data, 'pdf', templateType);
  }

  /**
   * 为打印渲染模板（兼容旧接口）
   * @param {Object} data - 标准化数据
   * @param {string} templateType - 模板类型
   * @returns {Promise<Object>} 渲染结果
   */
  async renderForPrint(data, templateType = 'french-standard') {
    return await this.renderInvoice(data, 'print', templateType);
  }

  /**
   * 生成TVA状态声明
   */
  generateTVAStatusDeclaration(invoice, company) {
    // 根据发票类型和公司信息生成相应的TVA声明
    const vatNumber = company.vatNumber || company.tvaNumber;
    
    // 检查是否为B2B服务（自动清算）
    if (invoice.type === 'service' && invoice.isB2B) {
      return `
        <p><strong>${getFrenchLabel('vatStatus')}:</strong> ${getFrenchLabel('vatAutoLiquidation')}</p>
        ${vatNumber ? `<p><strong>${getFrenchLabel('vatNumberIntra')}:</strong> ${vatNumber}</p>` : ''}
      `;
    }
    
    // 检查是否为欧盟内部商品交付（免税）
    if (invoice.type === 'goods' && invoice.isIntraEU) {
      return `
        <p><strong>${getFrenchLabel('vatStatus')}:</strong> ${getFrenchLabel('vatExemptIntraEU')}</p>
        ${vatNumber ? `<p><strong>${getFrenchLabel('vatNumberIntra')}:</strong> ${vatNumber}</p>` : ''}
      `;
    }
    
    // 默认情况：适用TVA
    return `
      <p><strong>${getFrenchLabel('vatStatus')}:</strong> ${getFrenchLabel('vatApplicableArticle256')}</p>
      ${vatNumber ? `<p><strong>${getFrenchLabel('vatNumberIntra')}:</strong> ${vatNumber}</p>` : ''}
    `;
  }

  /**
   * 验证模板类型
   */
  validateTemplateType(templateType) {
    if (!this.supportedTemplates.includes(templateType)) {
      throw new Error(`不支持的模板类型: ${templateType}. 支持的类型: ${this.supportedTemplates.join(', ')}`);
    }
    return true;
  }

  /**
   * 获取支持的模板类型
   */
  getSupportedTemplates() {
    return [...this.supportedTemplates];
  }

  /**
   * 获取支持的格式
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }
}

module.exports = TemplateAdapter;