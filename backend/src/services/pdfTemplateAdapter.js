const puppeteer = require('puppeteer');

/**
 * PDF模板适配器
 * 处理发票PDF的生成和模板渲染
 */
class PDFTemplateAdapter {
  constructor() {
    this.browser = null;
  }

  /**
   * 获取法式自清算HTML模板
   * @param {Object} data - 模板数据
   * @returns {string} HTML模板
   */
  getFrenchAutoLiquidationHTMLTemplate(data) {
    const { invoiceData, userData, clientData } = data;
    
    // 基于标准模板，但修改TVA计算和添加自清算声明
    const standardTemplate = this.getFrenchStandardHTMLTemplate(data);
    
    // 修改TVA显示为0，并添加自清算声明
    let autoLiquidationTemplate = standardTemplate
      .replace(/<p><strong>TVA \(20%\):<\/strong> \d+\.\d+ €<\/p>/, 
               '<p><strong>TVA (Autoliquidation):</strong> 0.00 €</p>')
      .replace(/<div class="footer">/, 
               `<div class="legal-notes" style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                  <h4 style="color: #007bff; margin-bottom: 10px;">MENTIONS LÉGALES - AUTOLIQUIDATION</h4>
                  <p><strong>TVA intracommunautaire due par le preneur</strong></p>
                  <p>Conformément à l'article 283-2 du CGI, la TVA est due par le preneur.</p>
                </div>
                <div class="footer">`);
    
    return autoLiquidationTemplate;
  }

  /**
   * 获取法式TVA免税HTML模板
   * @param {Object} data - 模板数据
   * @returns {string} HTML模板
   */
  getFrenchTVAExemptHTMLTemplate(data) {
    const { invoiceData, userData, clientData } = data;
    
    // 基于标准模板，但修改TVA计算和添加免税声明
    const standardTemplate = this.getFrenchStandardHTMLTemplate(data);
    
    // 修改TVA显示为0，并添加免税声明
    let tvaExemptTemplate = standardTemplate
      .replace(/<p><strong>TVA \(20%\):<\/strong> \d+\.\d+ €<\/p>/, 
               '<p><strong>TVA:</strong> Exonéré</p>')
      .replace(/<div class="footer">/, 
               `<div class="legal-notes" style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #28a745;">
                  <h4 style="color: #28a745; margin-bottom: 10px;">MENTIONS LÉGALES - EXONÉRATION TVA</h4>
                  <p><strong>Exonération de TVA</strong></p>
                  <p>Cette facture est exonérée de TVA conformément aux dispositions légales applicables.</p>
                </div>
                <div class="footer">`);
    
    return tvaExemptTemplate;
  }

  /**
   * 初始化浏览器实例
   */
  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * 渲染PDF模板
   * @param {Object} options - PDF选项
   * @param {Object} options.invoiceData - 发票数据
   * @param {Object} options.userData - 用户数据
   * @param {Object} options.clientData - 客户数据
   * @param {string} options.templateType - 模板类型
   * @returns {Promise<Object>} 渲染结果
   */
  async renderPDFTemplate(options) {
    try {
      const { invoiceData, userData, clientData, templateType = 'french-standard' } = options;

      // 验证必填参数
      if (!invoiceData || !userData || !clientData) {
        throw new Error('缺少必填参数: invoiceData, userData, clientData');
      }

      // 初始化浏览器
      await this.initializeBrowser();

      // 渲染HTML模板
      const htmlResult = await this.renderHTMLTemplate({
        invoiceData,
        userData,
        clientData,
        templateType
      });

      if (!htmlResult.success) {
        return htmlResult;
      }

      // 生成PDF
      const page = await this.browser.newPage();
      await page.setContent(htmlResult.data.html);
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await page.close();

      return {
        success: true,
        data: {
          pdfBuffer,
          html: htmlResult.data.html,
          metadata: {
            format: 'A4',
            templateType,
            createdAt: new Date().toISOString()
          }
        }
      };

    } catch (error) {
      console.error('PDF模板渲染错误:', error);
      return {
        success: false,
        error: 'PDF模板渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 渲染HTML模板
   * @param {Object} options - HTML选项
   * @returns {Promise<Object>} 渲染结果
   */
  async renderHTMLTemplate(options) {
    try {
      const { invoiceData, userData, clientData, templateType } = options;

      // 根据模板类型选择不同的HTML模板
      let htmlTemplate;
      switch (templateType) {
        case 'french-standard':
          htmlTemplate = this.getFrenchStandardHTMLTemplate({
            invoiceData,
            userData,
            clientData
          });
          break;
        case 'french-auto-liquidation':
        case 'self-liquidation':
          htmlTemplate = this.getFrenchAutoLiquidationHTMLTemplate({
            invoiceData,
            userData,
            clientData
          });
          break;
        case 'french-tva-exempt':
        case 'tva-exempt':
          htmlTemplate = this.getFrenchTVAExemptHTMLTemplate({
            invoiceData,
            userData,
            clientData
          });
          break;
        default:
          htmlTemplate = this.getFrenchStandardHTMLTemplate({
            invoiceData,
            userData,
            clientData
          });
      }

      return {
        success: true,
        data: {
          html: htmlTemplate,
          templateType
        }
      };

    } catch (error) {
      console.error('HTML模板渲染错误:', error);
      return {
        success: false,
        error: 'HTML模板渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 获取法式标准HTML模板
   * @param {Object} data - 模板数据
   * @returns {string} HTML模板
   */
  getFrenchStandardHTMLTemplate(data) {
    const { invoiceData, userData, clientData } = data;
    
    // 使用与邮件模板相同的结构和样式
    const getFrenchLabel = (key) => {
      const labels = {
        'invoiceTitle': 'FACTURE',
        'invoiceNumber': 'Numéro de facture',
        'date': 'Date',
        'dueDate': 'Date d\'échéance',
        'seller': 'VENDEUR',
        'billedTo': 'FACTURÉ À',
        'vatNumber': 'N° TVA',
        'siret': 'SIRET',
        'siren': 'SIREN',
        'description': 'Description',
        'quantity': 'Quantité',
        'unitPrice': 'Prix unitaire',
        'vatRate': 'Taux TVA',
        'subtotal': 'Sous-total HT',
        'totalVat': 'Total TVA',
        'total': 'TOTAL TTC',
        'vatBreakdown': 'Détail TVA',
        'legalMentions': 'MENTIONS LÉGALES',
        'vatApplicable': 'TVA applicable selon l\'article 293 B du CGI',
        'vatDeductible': 'TVA déductible sur justificatifs',
        'invoiceCompliance': 'Facture conforme aux dispositions légales en vigueur',
        'vatSubject': 'Assujetti à la TVA',
        'paymentDue': 'Paiement à réception',
        'latePaymentPenalty': 'Pénalités de retard : 3 fois le taux d\'intérêt légal',
        'paymentTerms': 'Conditions de paiement',
        'latePayment': 'Retard de paiement',
        'latePaymentInterest': 'Intérêts de retard de 3 fois le taux légal',
        'thankYou': 'Merci pour votre confiance',
        'notProvided': 'Non renseigné',
        'apeCode': 'Code APE'
      };
      return labels[key] || key;
    };

    // 构建项目数据
    const items = invoiceData.items || [];
    const totals = invoiceData.totals || {
      subtotal: 0,
      totalTVA: 0,
      total: 0,
      tvaBreakdown: []
    };

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoiceData.number}</title>
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="invoice-title">${getFrenchLabel('invoiceTitle')}</h1>
                <div class="invoice-info">
                    <p><strong>${getFrenchLabel('invoiceNumber')}:</strong> ${invoiceData.number}</p>
                    <p><strong>${getFrenchLabel('date')}:</strong> ${invoiceData.date}</p>
                    <p><strong>${getFrenchLabel('dueDate')}:</strong> ${invoiceData.dueDate}</p>
                </div>
            </div>

            <div class="section">
                <div class="company-info">
                    <h3>${getFrenchLabel('seller')}</h3>
                    <p><strong>${userData.companyName}</strong></p>
                    <p>${userData.address}</p>
                    <p>${userData.postalCode} ${userData.city}</p>
                    <p>${userData.country}</p>
                    ${userData.tvaNumber ? `<p><strong>${getFrenchLabel('vatNumber')}:</strong> ${userData.tvaNumber}</p>` : ''}
                    ${userData.siret ? `<p><strong>${getFrenchLabel('siret')}:</strong> ${userData.siret}</p>` : ''}
                    ${userData.siren ? `<p><strong>${getFrenchLabel('siren')}:</strong> ${userData.siren}</p>` : ''}
                </div>
                <div class="client-info">
                    <h3>${getFrenchLabel('billedTo')}</h3>
                    <p><strong>${clientData.companyName}</strong></p>
                    <p>${clientData.address}</p>
                    <p>${clientData.postalCode} ${clientData.city}</p>
                    <p>${clientData.country}</p>
                    ${clientData.tvaNumber ? `<p><strong>${getFrenchLabel('vatNumber')}:</strong> ${clientData.tvaNumber}</p>` : ''}
                </div>
            </div>

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

            <div class="totals">
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
            </div>

            <div class="legal-notes">
                <h4>${getFrenchLabel('legalMentions')}</h4>
                <p><strong>${getFrenchLabel('vatApplicable')}</strong></p>
                <p>• ${getFrenchLabel('vatDeductible')}</p>
                <p>• ${getFrenchLabel('invoiceCompliance')}</p>
                <p>• ${getFrenchLabel('vatSubject')}</p>
                <p>• ${getFrenchLabel('paymentDue')}: ${invoiceData.dueDate}</p>
                <p>• ${getFrenchLabel('latePaymentPenalty')}</p>
                <p>• ${getFrenchLabel('siret')}: ${userData.siret || getFrenchLabel('notProvided')}</p>
                <p>• ${getFrenchLabel('apeCode')}: ${userData.apeCode || getFrenchLabel('notProvided')}</p>
            </div>

            <div class="footer">
                <p><strong>${getFrenchLabel('paymentTerms')}:</strong> ${getFrenchLabel('paymentDue')} ${invoiceData.dueDate}</p>
                <p><strong>${getFrenchLabel('latePayment')}:</strong> ${getFrenchLabel('latePaymentInterest')}</p>
                <p>${getFrenchLabel('thankYou')}</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * 关闭浏览器实例
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PDFTemplateAdapter;