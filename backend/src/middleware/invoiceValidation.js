/**
 * 发票验证中间件
 * 包含发票编号验证、重复检查等功能
 */

const InvoiceNumberService = require('../services/invoiceNumberService');

/**
 * 验证发票编号格式和唯一性
 */
const validateInvoiceNumber = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.body;
    const userId = req.user.id;
    const invoiceId = req.params.id; // 用于更新时排除当前发票

    // 如果没有提供发票编号，跳过验证（将由系统自动生成）
    if (!invoiceNumber) {
      return next();
    }

    // 初始化发票编号服务
    const isMemoryMode = !require('../models').sequelize;
    const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize: require('../models').sequelize };
    const invoiceNumberService = new InvoiceNumberService(db);

    // 检查发票编号是否已存在
    const exists = await invoiceNumberService.isInvoiceNumberExists(
      invoiceNumber, 
      userId, 
      invoiceId ? parseInt(invoiceId) : null
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: '发票编号已存在',
        error: 'DUPLICATE_INVOICE_NUMBER',
        details: {
          invoiceNumber,
          suggestion: '请使用不同的发票编号或让系统自动生成'
        }
      });
    }

    // 验证发票编号格式
    const settings = isMemoryMode 
      ? require('../config/memoryDatabase').findSettingsByUserId(userId)
      : await require('../models').Settings.findOne({ where: { userId } });

    const invoiceMode = settings?.invoiceMode || 'standard';
    const expectedFormat = invoiceMode === 'fr' ? 'french' : 'standard';
    
    const isValidFormat = invoiceNumberService.validateInvoiceNumberFormat(invoiceNumber, expectedFormat);
    
    if (!isValidFormat) {
      const formatExample = expectedFormat === 'french' ? 'FR-2024-000001' : 'INV-202401-0001';
      return res.status(400).json({
        success: false,
        message: '发票编号格式不正确',
        error: 'INVALID_INVOICE_NUMBER_FORMAT',
        details: {
          invoiceNumber,
          expectedFormat,
          example: formatExample,
          suggestion: `请使用正确的格式，例如：${formatExample}`
        }
      });
    }

    next();
  } catch (error) {
    console.error('发票编号验证失败:', error);
    return res.status(500).json({
      success: false,
      message: '发票编号验证失败',
      error: 'VALIDATION_ERROR'
    });
  }
};

/**
 * 验证发票编号连续性（仅适用于法国发票）
 */
const validateInvoiceNumberSequence = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.body;
    const userId = req.user.id;

    // 获取用户设置
    const isMemoryMode = !require('../models').sequelize;
    const settings = isMemoryMode 
      ? require('../config/memoryDatabase').findSettingsByUserId(userId)
      : await require('../models').Settings.findOne({ where: { userId } });

    const invoiceMode = settings?.invoiceMode || 'standard';

    // 只对法国发票进行连续性检查
    if (invoiceMode !== 'fr' || !invoiceNumber || !invoiceNumber.startsWith('FR-')) {
      return next();
    }

    // 初始化发票编号服务
    const db = isMemoryMode ? require('../config/memoryDatabase') : { sequelize: require('../models').sequelize };
    const invoiceNumberService = new InvoiceNumberService(db);

    // 获取用户的所有发票
    const userInvoices = isMemoryMode 
      ? require('../config/memoryDatabase').findInvoicesByUserId(userId)
      : await require('../models').Invoice.findAll({ where: { userId } });

    // 提取当前年份的法国格式发票编号
    const currentYear = new Date().getFullYear();
    const frenchInvoicesThisYear = userInvoices.filter(invoice => {
      const invoiceYear = new Date(invoice.createdAt || invoice.issueDate).getFullYear();
      return invoiceYear === currentYear && 
             invoice.invoiceNumber && 
             invoice.invoiceNumber.startsWith(`FR-${currentYear}-`);
    });

    // 提取序列号
    const sequences = frenchInvoicesThisYear.map(invoice => {
      const match = invoice.invoiceNumber.match(/FR-\d{4}-(\d{6})/);
      return match ? parseInt(match[1], 10) : 0;
    }).filter(seq => seq > 0).sort((a, b) => a - b);

    // 检查当前发票编号的序列号
    const currentMatch = invoiceNumber.match(/FR-\d{4}-(\d{6})/);
    if (!currentMatch) {
      return res.status(400).json({
        success: false,
        message: '法国发票编号格式不正确',
        error: 'INVALID_FRENCH_INVOICE_NUMBER'
      });
    }

    const currentSequence = parseInt(currentMatch[1], 10);

    // 检查是否存在序列号跳跃（不连续）
    if (sequences.length > 0) {
      const expectedNext = Math.max(...sequences) + 1;
      if (currentSequence !== expectedNext) {
        return res.status(400).json({
          success: false,
          message: '法国发票编号必须连续，不能跳号',
          error: 'NON_SEQUENTIAL_INVOICE_NUMBER',
          details: {
            currentSequence,
            expectedSequence: expectedNext,
            suggestion: `建议使用编号：FR-${currentYear}-${String(expectedNext).padStart(6, '0')}`
          }
        });
      }
    } else {
      // 如果是第一张法国发票，允许从任意序列号开始
      // 这样用户可以在切换到法国模式后继续使用现有的编号序列
      console.log(`用户 ${userId} 创建第一张法国发票，序列号: ${currentSequence}`);
    }

    next();
  } catch (error) {
    console.error('发票编号连续性验证失败:', error);
    return res.status(500).json({
      success: false,
      message: '发票编号连续性验证失败',
      error: 'SEQUENCE_VALIDATION_ERROR'
    });
  }
};

/**
 * 发票数据完整性验证
 */
const validateInvoiceData = (req, res, next) => {
  try {
    console.log('=== 后端发票数据验证开始 ===');
    console.log('请求体原始数据:', JSON.stringify(req.body, null, 2));
    
    const { 
      clientId, 
      items, 
      issueDate, 
      dueDate,
      total,
      subtotal 
    } = req.body;

    console.log('提取的字段:', {
      clientId: clientId,
      clientIdType: typeof clientId,
      items: items,
      itemsLength: items ? items.length : 'undefined',
      issueDate: issueDate,
      dueDate: dueDate,
      total: total,
      subtotal: subtotal
    });

    const errors = [];

    // 验证必填字段
    console.log('=== 验证clientId ===');
    if (!clientId) {
      console.error('clientId验证失败: 值为空或undefined');
      errors.push('客户ID不能为空');
    } else {
      // 确保clientId是数字类型
      const clientIdNum = parseInt(clientId, 10);
      console.log('clientId转换:', clientId, '->', clientIdNum);
      if (isNaN(clientIdNum) || clientIdNum <= 0) {
        console.error('clientId验证失败: 不是有效的正整数', { clientId, clientIdNum });
        errors.push('客户ID必须是有效的正整数');
      } else {
        console.log('✓ clientId验证通过');
      }
    }

    console.log('=== 验证items数组 ===');
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('items验证失败:', { items, isArray: Array.isArray(items), length: items ? items.length : 'N/A' });
      errors.push('发票项目不能为空');
    } else {
      console.log('✓ items数组基本验证通过，长度:', items.length);
    }

    console.log('=== 验证issueDate ===');
    if (!issueDate) {
      console.error('issueDate验证失败: 值为空');
      errors.push('开票日期不能为空');
    } else {
      console.log('✓ issueDate验证通过:', issueDate);
    }

    // dueDate 是可选字段，不强制要求
    // if (!dueDate) {
    //   errors.push('到期日期不能为空');
    // }

    // 验证日期格式和逻辑
    console.log('=== 验证日期格式 ===');
    if (issueDate && dueDate) {
      const issue = new Date(issueDate);
      const due = new Date(dueDate);
      
      console.log('日期解析:', { issueDate, issue: issue.toISOString(), dueDate, due: due.toISOString() });
      
      if (isNaN(issue.getTime())) {
        console.error('issueDate格式错误:', issueDate);
        errors.push('开票日期格式不正确');
      }
      
      if (isNaN(due.getTime())) {
        console.error('dueDate格式错误:', dueDate);
        errors.push('到期日期格式不正确');
      }
      
      if (due < issue) {
        console.error('日期逻辑错误: dueDate < issueDate', { issue, due });
        errors.push('到期日期不能早于开票日期');
      }
    }

    // 验证发票项目
    console.log('=== 验证发票项目详情 ===');
    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        console.log(`验证第${index + 1}项:`, item);
        
        if (!item.description || item.description.trim() === '') {
          console.error(`第${index + 1}项描述验证失败:`, item.description);
          errors.push(`第${index + 1}项：描述不能为空`);
        }
        
        // 转换并验证数量
        const quantity = parseFloat(item.quantity);
        console.log(`第${index + 1}项数量转换:`, item.quantity, '->', quantity);
        if (isNaN(quantity) || quantity <= 0) {
          console.error(`第${index + 1}项数量验证失败:`, { original: item.quantity, parsed: quantity });
          errors.push(`第${index + 1}项：数量必须大于0`);
        }
        
        // 转换并验证单价
        const unitPrice = parseFloat(item.unitPrice);
        console.log(`第${index + 1}项单价转换:`, item.unitPrice, '->', unitPrice);
        if (isNaN(unitPrice) || unitPrice < 0) {
          console.error(`第${index + 1}项单价验证失败:`, { original: item.unitPrice, parsed: unitPrice });
          errors.push(`第${index + 1}项：单价不能为负数`);
        }
        
        if (errors.length === 0) {
          console.log(`✓ 第${index + 1}项验证通过`);
        }
      });
    }

    // 验证金额
    console.log('=== 验证金额字段 ===');
    if (total !== undefined && total !== null) {
      const totalNum = parseFloat(total);
      console.log('total转换:', total, '->', totalNum);
      if (isNaN(totalNum) || totalNum < 0) {
        console.error('total验证失败:', { original: total, parsed: totalNum });
        errors.push('总金额必须是有效的非负数');
      } else {
        console.log('✓ total验证通过');
      }
    }

    if (subtotal !== undefined && subtotal !== null) {
      const subtotalNum = parseFloat(subtotal);
      console.log('subtotal转换:', subtotal, '->', subtotalNum);
      if (isNaN(subtotalNum) || subtotalNum < 0) {
        console.error('subtotal验证失败:', { original: subtotal, parsed: subtotalNum });
        errors.push('小计金额必须是有效的非负数');
      } else {
        console.log('✓ subtotal验证通过');
      }
    }

    console.log('=== 验证结果汇总 ===');
    console.log('错误数量:', errors.length);
    if (errors.length > 0) {
      console.error('验证失败，错误列表:', errors);
      return res.status(400).json({
        success: false,
        message: '发票数据验证失败',
        error: 'VALIDATION_ERROR',
        details: errors
      });
    }

    console.log('✓ 所有验证通过，继续处理请求');
    next();
  } catch (error) {
    console.error('=== 发票数据验证异常 ===');
    console.error('异常类型:', error.constructor.name);
    console.error('异常消息:', error.message);
    console.error('异常堆栈:', error.stack);
    console.error('请求体:', req.body);
    
    return res.status(500).json({
      success: false,
      message: '发票数据验证失败',
      error: 'VALIDATION_ERROR'
    });
  }
};

module.exports = {
  validateInvoiceNumber,
  validateInvoiceNumberSequence,
  validateInvoiceData
};