/**
 * 发票自然语言问答控制器
 * 处理发票自然语言问答相关的HTTP请求
 */

const InvoiceQAService = require('../services/ai/invoiceQAService');
const { validationResult } = require('express-validator');

class InvoiceQAController {
  constructor() {
    this.qaService = new InvoiceQAService();
  }

  /**
   * 处理自然语言查询
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async processQuery(req, res) {
    try {
      // 验证请求参数
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '请求参数验证失败',
          errors: errors.array()
        });
      }

      const { query, options = {} } = req.body;
      const userId = req.user.id; // 从认证中间件获取用户ID

      // 处理查询
      const result = await this.qaService.processQuery(query, options, userId);

      // 返回结果
      return res.json({
        success: result.success,
        data: result,
        message: result.success ? '查询处理成功' : '查询处理失败',
        requestId: result.requestId
      });
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(500).json({
        success: false,
        message: '处理查询时发生错误',
        error: error.message
      });
    }
  }

  /**
   * 获取支持的查询类型
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async getSupportedQueryTypes(req, res) {
    try {
      const supportedTypes = [
        {
          type: 'client_invoices',
          name: '客户发票查询',
          description: '查询特定客户的发票信息',
          examples: [
            '客户A的发票有哪些？',
            '显示客户B的所有发票',
            '客户C最近三个月的发票'
          ]
        },
        {
          type: 'payment_status',
          name: '支付状态查询',
          description: '查询支付状态和统计信息',
          examples: [
            '我的支付状态如何？',
            '已收和未收款项统计',
            '最近的支付记录'
          ]
        },
        {
          type: 'revenue_summary',
          name: '收入摘要查询',
          description: '查询收入摘要和趋势',
          examples: [
            '上个月收入多少？',
            '今年的收入趋势',
            '最近30天的收入统计'
          ]
        },
        {
          type: 'overdue_invoices',
          name: '逾期发票查询',
          description: '查询逾期发票信息',
          examples: [
            '有哪些逾期发票？',
            '逾期超过60天的发票',
            '逾期发票总金额'
          ]
        },
        {
          type: 'client_summary',
          name: '客户摘要查询',
          description: '查询客户摘要信息',
          examples: [
            '客户A的付款情况如何？',
            '客户B的平均付款周期',
            '客户C的财务摘要'
          ]
        }
      ];

      return res.json({
        success: true,
        data: supportedTypes,
        message: '获取支持的查询类型成功'
      });
    } catch (error) {
      console.error('Error getting supported query types:', error);
      return res.status(500).json({
        success: false,
        message: '获取支持的查询类型时发生错误',
        error: error.message
      });
    }
  }

  /**
   * 获取查询历史
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @returns {Promise<void>}
   */
  async getQueryHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;

      // 这里应该从数据库中查询历史记录
      // 由于没有历史记录模型，这里返回一个空数组
      // 实际实现应该从数据库中查询
      const history = [];

      return res.json({
        success: true,
        data: {
          history,
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset)
        },
        message: '获取查询历史成功'
      });
    } catch (error) {
      console.error('Error getting query history:', error);
      return res.status(500).json({
        success: false,
        message: '获取查询历史时发生错误',
        error: error.message
      });
    }
  }

  /**
   * 获取查询建议
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
     * @returns {Promise<void>}
   */
  async getQuerySuggestions(req, res) {
    try {
      const suggestions = [
        '客户A的发票有哪些？',
        '上个月收入多少？',
        '有哪些逾期发票？',
        '客户B的付款情况如何？',
        '我的支付状态如何？',
        '今年收入最高的客户是谁？',
        '逾期超过30天的发票有哪些？',
        '客户C的平均付款周期是多少？',
        '最近30天的收入统计',
        '未付发票总金额是多少？'
      ];

      return res.json({
        success: true,
        data: suggestions,
        message: '获取查询建议成功'
      });
    } catch (error) {
      console.error('Error getting query suggestions:', error);
      return res.status(500).json({
        success: false,
        message: '获取查询建议时发生错误',
        error: error.message
      });
    }
  }
}

module.exports = new InvoiceQAController();