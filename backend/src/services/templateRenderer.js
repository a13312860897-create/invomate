const TemplateAdapter = require('./templateAdapter');
const TemplateDataService = require('./templateDataService');
const PDFTemplateAdapter = require('./pdfTemplateAdapter');
const PrintTemplateAdapter = require('./printTemplateAdapter');

/**
 * 统一模板渲染服务
 * 提供统一的接口来渲染邮件、PDF和打印模板
 */
class TemplateRenderer {
  constructor() {
    this.adapter = new TemplateAdapter();
    this.dataService = new TemplateDataService();
    this.pdfAdapter = new PDFTemplateAdapter();
    this.printAdapter = new PrintTemplateAdapter();
    this.renderStats = {
      totalRenders: 0,
      byFormat: {
        email: 0,
        pdf: 0,
        print: 0
      },
      byTemplate: {
        'french-standard': 0,
        'tva-exempt': 0,
        'self-liquidation': 0
      }
    };
  }

  /**
   * 渲染发票模板
   * @param {Object} options - 渲染选项
   * @param {string} options.format - 输出格式: 'email', 'pdf', 'print'
   * @param {Object} options.invoiceData - 发票数据
   * @param {Object} options.userData - 用户/公司数据
   * @param {Object} options.clientData - 客户数据
   * @param {string} options.templateType - 模板类型: 'french-standard', 'tva-exempt', 'self-liquidation'
   * @returns {Promise<Object>} 渲染结果
   */
  async renderInvoice(options) {
    const { format, invoiceData, userData, clientData, templateType = 'french-standard' } = options;

    try {
      // 验证输入参数
      this.validateRenderOptions(options);

      // 根据格式调用相应的渲染方法
      switch (format) {
        case 'email':
          return await this.renderEmailTemplate({
            invoiceData,
            userData,
            clientData,
            templateType
          });
        
        case 'pdf':
          return await this.renderPDFTemplate({
            invoiceData,
            userData,
            clientData,
            templateType
          });
        
        case 'print':
          return await this.renderPrintTemplate({
            invoiceData,
            userData,
            clientData,
            templateType
          });
        
        default:
          throw new Error(`不支持的输出格式: ${format}`);
      }
    } catch (error) {
      console.error(`模板渲染失败 [${format}]:`, error);
      throw new Error(`模板渲染失败: ${error.message}`);
    }
  }

  /**
   * 渲染邮件模板
   * @param {Object} options - 渲染选项
   * @returns {Promise<Object>} 渲染结果
   */
  async renderEmailTemplate(options) {
    try {
      const { invoiceData, userData, clientData, templateType = 'french-standard' } = options;

      // 标准化数据
      let standardizedData;
      try {
        standardizedData = this.dataService.standardizeInvoiceData(
          invoiceData,
          userData,
          clientData
        );
      } catch (e) {
        const { safeStandardizeInvoiceDataOnly } = require('./safeTemplateDataService');
        standardizedData = safeStandardizeInvoiceDataOnly({
          invoiceData,
          userData,
          clientData
        });
      }

      // 验证数据
      const validation = this.dataService.validateStandardizedData(standardizedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: '数据验证失败',
          details: validation.errors
        };
      }

      // 使用邮件适配器渲染 - 传递标准化数据对象
      const adapterResult = await this.adapter.renderInvoice({
        company: standardizedData.company,
        client: standardizedData.client,
        invoice: standardizedData.invoice,
        items: standardizedData.items,
        totals: standardizedData.totals,
        legalNotes: standardizedData.legalNotes
      }, 'email', templateType);

      if (adapterResult.success) {
        this.updateRenderStats('email', templateType);
        const html = adapterResult.content || adapterResult.data?.html || '';
        const subject = `Facture ${standardizedData.invoice.id}`;
        const text = this.adapter.htmlToText ? this.adapter.htmlToText(html) : html;
        return {
          success: true,
          data: {
            subject,
            html,
            text
          },
          metadata: {
            templateType,
            format: 'email',
            generatedAt: new Date().toISOString()
          }
        };
      }

      return adapterResult;

    } catch (error) {
      console.error('邮件模板渲染错误:', error);
      return {
        success: false,
        error: '邮件模板渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 渲染PDF模板
   * @param {Object} options - 渲染选项
   * @returns {Promise<Object>} 渲染结果
   */
  async renderPDFTemplate(options) {
    try {
      const { invoiceData, userData, clientData, templateType = 'french-standard', pdfOptions = {} } = options;

      // 标准化数据
      const standardizedData = this.dataService.standardizeInvoiceData(
        invoiceData,
        userData,
        clientData
      );

      // 验证数据
      const validation = this.dataService.validateStandardizedData(standardizedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: '数据验证失败',
          details: validation.errors
        };
      }

      // 使用PDF适配器渲染
      const result = await this.pdfAdapter.renderPDFTemplate({
        invoiceData: {
          ...standardizedData.invoice,
          items: standardizedData.items,
          totalHT: standardizedData.totals.subtotal,
          tva: standardizedData.totals.totalTVA,
          totalTTC: standardizedData.totals.total
        },
        userData: standardizedData.company,
        clientData: standardizedData.client,
        templateType,
        pdfOptions
      });

      if (result.success) {
        this.updateRenderStats('pdf', templateType);
      }

      return result;

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
   * 智能渲染发票（自动选择模板）
   * @param {Object} options - 渲染选项
   * @returns {Promise<Object>} 渲染结果
   */
  async renderInvoiceSmart(options) {
    try {
      const { format, invoiceData, userData, clientData, templateType } = options;

      // 如果没有指定模板类型，使用智能选择
      let finalTemplateType = templateType;
      let selectionInfo = null;

      if (!templateType) {
        const standardizedData = this.dataService.standardizeInvoiceData(
          invoiceData,
          userData,
          clientData
        );
        
        const selectionResult = this.templateSelector.selectTemplate(standardizedData);
        
        if (selectionResult.success) {
          finalTemplateType = selectionResult.selectedTemplate;
          selectionInfo = selectionResult;
        } else {
          // 如果智能选择失败，使用默认模板
          finalTemplateType = 'french-standard';
        }
      }

      // 使用确定的模板类型进行渲染
      const renderResult = await this.renderInvoice({
        format,
        invoiceData,
        userData,
        clientData,
        templateType: finalTemplateType
      });

      // 添加智能选择信息
      if (renderResult.success && selectionInfo) {
        renderResult.metadata = {
          ...renderResult.metadata,
          smartSelection: selectionInfo,
          autoSelected: true
        };
      }

      return renderResult;

    } catch (error) {
      console.error('智能渲染错误:', error);
      return {
        success: false,
        error: '智能渲染失败',
        message: error.message
      };
    }
  }

  /**
   * 获取模板选择建议
   * @param {Object} invoiceData - 发票数据
   * @param {Object} userData - 用户数据
   * @param {Object} clientData - 客户数据
   * @returns {Object} 选择建议
   */
  getTemplateRecommendation(invoiceData, userData, clientData) {
    try {
      const standardizedData = this.dataService.standardizeInvoiceData(
        invoiceData,
        userData,
        clientData
      );
      
      return this.templateSelector.selectTemplate(standardizedData);
    } catch (error) {
      console.error('获取模板建议错误:', error);
      return {
        success: false,
        error: '获取模板建议失败',
        message: error.message
      };
    }
  }

  /**
   * 验证法国法律要求
   * @param {Object} invoiceData - 发票数据
   * @param {Object} userData - 用户数据
   * @param {Object} clientData - 客户数据
   * @param {string} templateType - 模板类型
   * @returns {Object} 验证结果
   */
  validateFrenchLegalRequirements(invoiceData, userData, clientData, templateType) {
    try {
      const standardizedData = this.dataService.standardizeInvoiceData(
        invoiceData,
        userData,
        clientData
      );
      
      return this.templateSelector.validateLegalRequirements(standardizedData, templateType);
    } catch (error) {
      console.error('验证法国法律要求错误:', error);
      return {
        success: false,
        error: '验证法国法律要求失败',
        message: error.message
      };
    }
  }
  async renderPrintTemplate(options) {
    try {
      const { invoiceData, userData, clientData, templateType = 'french-standard' } = options;

      // 标准化数据
      const standardizedData = this.dataService.standardizeInvoiceData(
        invoiceData,
        userData,
        clientData
      );

      // 验证数据
      const validation = this.dataService.validateStandardizedData(standardizedData);
      if (!validation.isValid) {
        return {
          success: false,
          error: '数据验证失败',
          details: validation.errors
        };
      }

      // 使用打印适配器渲染
      const result = await this.printAdapter.renderPrintTemplate({
        invoiceData: {
          ...standardizedData.invoice,
          items: standardizedData.items,
          totalHT: standardizedData.totals.subtotal,
          tva: standardizedData.totals.totalTVA,
          totalTTC: standardizedData.totals.total
        },
        userData: standardizedData.company,
        clientData: standardizedData.client,
        templateType
      });

      if (result.success) {
        this.updateRenderStats('print', templateType);
      }

      return result;

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
   * 批量渲染多种格式
   */
  async renderMultipleFormats(invoiceData, userData, clientData, templateType, formats = ['email', 'pdf', 'print']) {
    const results = {};
    const errors = [];

    for (const format of formats) {
      try {
        results[format] = await this.renderInvoice({
          format,
          invoiceData,
          userData,
          clientData,
          templateType
        });
      } catch (error) {
        errors.push({ format, error: error.message });
        results[format] = {
          success: false,
          format,
          error: error.message,
          metadata: { templateType, timestamp: new Date().toISOString() }
        };
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: formats.length,
        successful: formats.length - errors.length,
        failed: errors.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 获取模板预览
   */
  async getTemplatePreview(templateType, format = 'html') {
    const sampleData = this.dataService.getSampleData();
    
    try {
      if (format === 'html') {
        // 使用模板引擎直接渲染HTML预览
        const { UnifiedTemplateEngine } = require('./unifiedTemplateEngine');
        const engine = new UnifiedTemplateEngine();
        const html = await engine.render(templateType, sampleData, 'html');
        
        return {
          success: true,
          data: html,
          metadata: {
            templateType,
            format: 'html',
            timestamp: new Date().toISOString()
          }
        };
      } else {
        // 使用适配器渲染其他格式
        return await this.renderInvoice({
          format,
          invoiceData: sampleData.invoice,
          userData: sampleData.company,
          clientData: sampleData.client,
          templateType
        });
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          templateType,
          format,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 验证渲染选项
   */
  validateRenderOptions(options) {
    const { format, invoiceData, userData, clientData } = options;

    if (!format || !['email', 'pdf', 'print'].includes(format)) {
      throw new Error('必须指定有效的输出格式 (email, pdf, print)');
    }

    if (!invoiceData || typeof invoiceData !== 'object') {
      throw new Error('必须提供有效的发票数据');
    }

    if (!userData || typeof userData !== 'object') {
      throw new Error('必须提供有效的用户/公司数据');
    }

    if (!clientData || typeof clientData !== 'object') {
      throw new Error('必须提供有效的客户数据');
    }
  }

  /**
   * 获取可用模板类型
   */
  getAvailableTemplates() {
    return ['french-standard', 'tva-exempt', 'self-liquidation'];
  }

  /**
   * 获取可用输出格式
   */
  getAvailableFormats() {
    return ['email', 'pdf', 'print'];
  }

  /**
   * 更新渲染统计信息
   */
  updateRenderStats(format, templateType) {
    this.renderStats.totalRenders++;
    this.renderStats.byFormat[format] = (this.renderStats.byFormat[format] || 0) + 1;
    this.renderStats.byTemplate[templateType] = (this.renderStats.byTemplate[templateType] || 0) + 1;
  }

  /**
   * 获取渲染统计信息
   */
  getRenderStats() {
    return {
      availableTemplates: this.getAvailableTemplates(),
      availableFormats: this.getAvailableFormats(),
      features: [
        '统一模板渲染',
        '多格式输出支持',
        '数据标准化',
        '法国法律合规',
        '模板预览',
        '批量渲染'
      ],
      stats: this.renderStats,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = TemplateRenderer;