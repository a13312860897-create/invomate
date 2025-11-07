const TemplateRenderer = require('../services/templateRenderer');

/**
 * 模板控制器
 * 处理模板渲染相关的HTTP请求
 */
class TemplateController {
  constructor() {
    this.renderer = new TemplateRenderer();
  }

  /**
   * 渲染发票模板
   * POST /api/templates/render
   */
  async renderInvoice(req, res) {
    try {
      const { format, invoiceData, userData, clientData, templateType = 'french-standard' } = req.body;

      // 验证必填参数
      if (!format || !invoiceData || !userData || !clientData) {
        return res.status(400).json({
          success: false,
          error: '缺少必填参数: format, invoiceData, userData, clientData'
        });
      }

      // 渲染模板
      const result = await this.renderer.renderInvoice({
        format,
        invoiceData,
        userData,
        clientData,
        templateType
      });

      // 统一返回 JSON，便于前端统一解析
      if (format === 'email') {
        return res.json({
          success: !!result.success,
          data: result.data,
          metadata: result.metadata
        });
      } else if (format === 'pdf') {
        const size = result?.data?.pdfBuffer ? result.data.pdfBuffer.length : 0;
        return res.json({
          success: !!result.success,
          data: {
            size,
            metadata: result?.data?.metadata || result?.metadata || {}
          },
          metadata: result.metadata
        });
      } else if (format === 'print') {
        return res.json({
          success: !!result.success,
          data: {
            html: result?.data?.html || '',
            metadata: result?.data?.metadata || result?.metadata || {}
          },
          metadata: result.metadata
        });
      }

    } catch (error) {
      console.error('模板渲染错误:', error);
      return res.status(500).json({
        success: false,
        error: '模板渲染失败',
        message: error.message
      });
    }
  }

  /**
   * 批量渲染多种格式
   * POST /api/templates/render-multiple
   */
  async renderMultipleFormats(req, res) {
    try {
      const { 
        invoiceData, 
        userData, 
        clientData, 
        templateType = 'french-standard',
        formats = ['email', 'pdf', 'print']
      } = req.body;

      // 验证必填参数
      if (!invoiceData || !userData || !clientData) {
        return res.status(400).json({
          success: false,
          error: '缺少必填参数: invoiceData, userData, clientData'
        });
      }

      // 批量渲染
      const result = await this.renderer.renderMultipleFormats(
        invoiceData,
        userData,
        clientData,
        templateType,
        formats
      );

      return res.json(result);

    } catch (error) {
      console.error('批量模板渲染错误:', error);
      return res.status(500).json({
        success: false,
        error: '批量模板渲染失败',
        message: error.message
      });
    }
  }

  /**
   * 获取模板预览
   * GET /api/templates/preview/:templateType
   */
  async getTemplatePreview(req, res) {
    try {
      const { templateType } = req.params;
      const { format = 'html' } = req.query;

      // 验证模板类型
      const availableTemplates = this.renderer.getAvailableTemplates();
      if (!availableTemplates.includes(templateType)) {
        return res.status(400).json({
          success: false,
          error: `无效的模板类型。可用类型: ${availableTemplates.join(', ')}`
        });
      }

      // 获取预览
      const result = await this.renderer.getTemplatePreview(templateType, format);

      if (result.success) {
        if (format === 'html') {
          res.setHeader('Content-Type', 'text/html');
          return res.send(result.data);
        } else if (format === 'pdf') {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="preview_${templateType}.pdf"`);
          return res.send(result.data);
        } else {
          return res.json(result);
        }
      } else {
        return res.status(500).json(result);
      }

    } catch (error) {
      console.error('模板预览错误:', error);
      return res.status(500).json({
        success: false,
        error: '模板预览失败',
        message: error.message
      });
    }
  }

  /**
   * 获取可用模板列表
   * GET /api/templates/list
   */
  async getAvailableTemplates(req, res) {
    try {
      const templates = this.renderer.getAvailableTemplates();
      const formats = this.renderer.getAvailableFormats();
      const stats = this.renderer.getRenderStats();

      return res.json({
        success: true,
        data: {
          templates: templates.map(template => ({
            type: template,
            name: this.getTemplateName(template),
            description: this.getTemplateDescription(template)
          })),
          formats,
          stats
        }
      });

    } catch (error) {
      console.error('获取模板列表错误:', error);
      return res.status(500).json({
        success: false,
        error: '获取模板列表失败',
        message: error.message
      });
    }
  }

  /**
   * 获取模板配置
   * GET /api/templates/config
   */
  async getTemplateConfig(req, res) {
    try {
      const config = {
        templates: this.renderer.getAvailableTemplates(),
        formats: this.renderer.getAvailableFormats(),
        features: [
          '统一模板渲染',
          '多格式输出支持',
          '数据标准化',
          '法国法律合规',
          '模板预览',
          '批量渲染'
        ],
        legalRequirements: {
          france: [
            'SIRET/SIREN号码',
            'TVA号码（如适用）',
            '法律形式',
            'RCS注册信息',
            'NAF代码',
            '付款条件',
            '法律条款（免税、自清算等）'
          ]
        }
      };

      return res.json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('获取模板配置错误:', error);
      return res.status(500).json({
        success: false,
        error: '获取模板配置失败',
        message: error.message
      });
    }
  }

  /**
   * 获取模板名称
   */
  getTemplateName(templateType) {
    const names = {
      'french-standard': '法国标准模板',
      'tva-exempt': '免税模板',
      'self-liquidation': '自清算模板'
    };
    return names[templateType] || templateType;
  }

  /**
   * 获取模板描述
   */
  getTemplateDescription(templateType) {
    const descriptions = {
      'french-standard': '标准的法国发票模板，适用于大多数商业交易',
      'tva-exempt': '适用于TVA免税交易的发票模板',
      'self-liquidation': '适用于TVA自清算机制的发票模板'
    };
    return descriptions[templateType] || '';
  }
}

module.exports = TemplateController;