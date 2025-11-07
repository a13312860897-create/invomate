/**
 * 统一模板引擎
 * 提供基于统一数据结构的 HTML 预览渲染能力
 */
const PrintTemplateAdapter = require('./printTemplateAdapter');
const TemplateDataService = require('./templateDataService');

class UnifiedTemplateEngine {
  constructor() {
    this.printAdapter = new PrintTemplateAdapter();
    this.dataService = new TemplateDataService();
  }

  /**
   * 渲染模板
   * @param {string} templateType - 模板类型 ('french-standard' | 'tva-exempt' | 'self-liquidation')
   * @param {Object} data - 统一数据对象 { company, client, invoice, items, totals, legalNotes }
   * @param {string} format - 仅支持 'html'
   * @returns {Promise<string>} HTML 字符串
   */
  async render(templateType, data, format = 'html') {
    if (format !== 'html') {
      throw new Error(`Unsupported format for preview: ${format}`);
    }

    // 标准化数据（与 TemplateRenderer 保持一致）
    // 注意：standardizeInvoiceData 从 invoiceData.items 中读取项目，因此需要合并 items
    const standardized = this.dataService.standardizeInvoiceData(
      { ...data.invoice, items: data.items },
      data.company,
      data.client
    );

    // 通过打印适配器生成 HTML 预览（其它类型回退至法式标准样式）
    const result = await this.printAdapter.renderPrintTemplate({
      invoiceData: {
        ...standardized.invoice,
        items: standardized.items,
        totalHT: standardized.totals.subtotal,
        tva: standardized.totals.totalTVA,
        totalTTC: standardized.totals.total
      },
      userData: standardized.company,
      clientData: standardized.client,
      templateType
    });

    if (!result || !result.success) {
      throw new Error(result?.message || 'Failed to render preview HTML');
    }

    return result.data.html;
  }
}

module.exports = { UnifiedTemplateEngine };