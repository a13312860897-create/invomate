/**
 * 打印模板适配器
 * 处理发票打印模板的渲染
 */
class PrintTemplateAdapter {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * 初始化模板
   */
  initializeTemplates() {
    // 法式标准打印模板
    this.templates.set('french-standard', {
      name: '法式标准模板',
      format: 'A4',
      orientation: 'portrait',
      styles: this.getFrenchStandardStyles()
    });
  }

  /**
   * 渲染打印模板
   * @param {Object} options - 打印选项
   * @param {Object} options.invoiceData - 发票数据
   * @param {Object} options.userData - 用户数据
   * @param {Object} options.clientData - 客户数据
   * @param {string} options.templateType - 模板类型
   * @returns {Promise<Object>} 渲染结果
   */
  async renderPrintTemplate(options) {
    try {
      const { invoiceData, userData, clientData, templateType = 'french-standard' } = options;

      // 验证必填参数
      if (!invoiceData || !userData || !clientData) {
        throw new Error('缺少必填参数: invoiceData, userData, clientData');
      }

      // 获取模板配置，未定义时回退到法式标准模板
      const templateKey = this.templates.has(templateType) ? templateType : 'french-standard';
      const templateConfig = this.templates.get(templateKey);

      // 渲染HTML内容
      const htmlContent = this.renderHTMLContent({
        invoiceData,
        userData,
        clientData,
        templateType,
        templateConfig
      });

      return {
        success: true,
        data: {
          html: htmlContent,
          format: templateConfig.format,
          orientation: templateConfig.orientation,
          styles: templateConfig.styles,
          metadata: {
            templateType,
            createdAt: new Date().toISOString(),
            optimizedFor: 'print'
          }
        }
      };

    } catch (error) {
      console.error('打印模板渲染错误:', error);
      return {
        success: false,
        error: '打印模板渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 渲染HTML内容
   * @param {Object} data - 模板数据
   * @returns {string} HTML内容
   */
  renderHTMLContent(data) {
    const { invoiceData, userData, clientData, templateType } = data;

    // 目前仅提供法式标准打印模板，其它类型回退到标准模板
    return this.getFrenchStandardHTMLTemplate({ invoiceData, userData, clientData });
  }

  /**
   * 获取法式标准HTML模板
   * @param {Object} data - 模板数据
   * @returns {string} HTML模板
   */
  getFrenchStandardHTMLTemplate(data) {
    const { invoiceData, userData, clientData } = data;

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoiceData.number}</title>
        <style>
            ${this.getFrenchStandardStyles()}
        </style>
    </head>
    <body>
        <div class="print-container">
            <div class="invoice-header">
                <div class="invoice-title">
                    FACTURE
                </div>
                <div class="invoice-info">
                    <p><strong>Numéro:</strong> ${invoiceData.number}</p>
                    <p><strong>Date:</strong> ${invoiceData.date}</p>
                    <p><strong>Échéance:</strong> ${invoiceData.dueDate}</p>
                </div>
            </div>

            <div class="company-info">
                <h3>Informations de l'entreprise</h3>
                <p><strong>${userData.companyName}</strong></p>
                <p>${userData.address}</p>
                <p>Tél: ${userData.phone}</p>
                <p>Email: ${userData.email}</p>
                <p>SIRET: ${userData.siret}</p>
            </div>

            <div class="client-info">
                <h3>Informations du client</h3>
                <p><strong>${clientData.companyName}</strong></p>
                <p>${clientData.address}</p>
                <p>Tél: ${clientData.phone}</p>
                <p>Email: ${clientData.email}</p>
                <p>SIRET: ${clientData.siret}</p>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Quantité</th>
                        <th class="text-right">Prix unitaire</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${item.unitPrice.toFixed(2)} €</td>
                            <td class="text-right">${item.totalPrice.toFixed(2)} €</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <p><strong>Total HT:</strong> ${invoiceData.totalHT.toFixed(2)} €</p>
                <p><strong>${invoiceData.tvaExempt ? 'TVA (Exonérée)' : invoiceData.autoLiquidation ? 'TVA (Auto-liquidation)' : 'TVA (20%)'}:</strong> ${(invoiceData.tvaExempt || invoiceData.autoLiquidation) ? '€0.00' : invoiceData.tva.toFixed(2) + ' €'}</p>
                <p class="total-row"><strong>Total TTC:</strong> ${invoiceData.totalTTC.toFixed(2)} €</p>
            </div>
            
            ${invoiceData.tvaExempt ? `
            <div class="legal-notice">
                <h4>TVA NON APPLICABLE</h4>
                <p>TVA non applicable, art. 293 B du CGI (régime de la franchise en base).</p>
            </div>
            ` : ''}
            
            ${invoiceData.autoLiquidation ? `
            <div class="legal-notice">
                <h4>AUTO-LIQUIDATION</h4>
                <p>Auto-liquidation de la TVA par le destinataire conformément à l'article 283-1 du CGI.</p>
            </div>
            ` : ''}

            <div class="footer">
                <p>Merci de votre confiance</p>
                <p>Pour toute question, n'hésitez pas à nous contacter</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * 获取法式标准样式
   * @returns {string} CSS样式
   */
  getFrenchStandardStyles() {
    return `
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #000;
        margin: 0;
        padding: 0;
        background: white;
      }
      
      .print-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .invoice-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        border-bottom: 2px solid #000;
        padding-bottom: 20px;
      }
      
      .invoice-title {
        font-size: 28px;
        font-weight: bold;
        color: #000;
      }
      
      .invoice-info {
        text-align: right;
      }
      
      .invoice-info p {
        margin: 5px 0;
      }
      
      .company-info, .client-info {
        margin-bottom: 25px;
        padding: 15px;
        border: 1px solid #ddd;
      }
      
      .company-info h3, .client-info h3 {
        color: #000;
        border-bottom: 1px solid #000;
        padding-bottom: 5px;
        margin-top: 0;
      }
      
      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 25px 0;
      }
      
      .items-table th, .items-table td {
        border: 1px solid #000;
        padding: 12px;
        text-align: left;
      }
      
      .items-table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .items-table .text-right {
        text-align: right;
      }
      
      .total-section {
        margin-top: 30px;
        text-align: right;
        padding: 20px;
        border: 1px solid #000;
        background-color: #f9f9f9;
      }
      
      .total-row {
        font-weight: bold;
        font-size: 18px;
        color: #000;
      }
      
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      
      .legal-notice {
        margin-top: 20px;
        padding: 15px;
        border: 1px solid #ddd;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
      
      .legal-notice h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
        font-weight: bold;
      }
      
      .legal-notice p {
        margin: 0;
        font-size: 12px;
        color: #666;
      }
      
      /* 打印优化样式 */
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .print-container {
          max-width: none;
          margin: 0;
          padding: 10mm;
        }
        
        .no-print {
          display: none !important;
        }
        
        .invoice-header, .company-info, .client-info, .items-table, .total-section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  /**
   * 获取可用的打印模板类型
   * @returns {Array} 模板类型列表
   */
  getAvailablePrintTemplates() {
    return Array.from(this.templates.keys()).map(key => ({
      key,
      name: this.templates.get(key).name,
      format: this.templates.get(key).format,
      orientation: this.templates.get(key).orientation
    }));
  }
}

module.exports = PrintTemplateAdapter;