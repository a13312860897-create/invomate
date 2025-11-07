/**
 * 测试新的总金额处理实现
 */

const path = require('path');

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'memory';

// 模拟发票数据
const testInvoiceData = {
  id: 1,
  invoiceNumber: 'INV-2024-001',
  total: 60,
  totalAmount: 60,
  subtotal: 50,
  taxAmount: 10,
  currency: 'EUR',
  dueDate: '2024-12-31',
  clientName: '测试客户',
  items: [
    {
      quantity: 2,
      unitPrice: 25,
      taxRate: 20,
      description: '测试项目'
    }
  ]
};

const testClientData = {
  name: '测试客户',
  email: 'test@example.com'
};

async function testAmountUtils() {
  console.log('=== 测试统一金额处理工具 ===');
  
  try {
    const { extractTotalAmount, getDisplayAmount, normalizeInvoiceAmounts } = require('./src/utils/amountUtils');
    
    // 测试金额提取
    console.log('1. 测试金额提取:');
    const amount = extractTotalAmount(testInvoiceData);
    console.log('提取的总金额:', amount);
    
    // 测试金额格式化
    console.log('\n2. 测试金额格式化:');
    const displayAmount = getDisplayAmount(testInvoiceData, 'EUR');
    console.log('格式化金额:', displayAmount);
    
    // 测试数据标准化
    console.log('\n3. 测试数据标准化:');
    const normalized = normalizeInvoiceAmounts(testInvoiceData);
    console.log('标准化后的数据:', {
      total: normalized.total,
      totalAmount: normalized.totalAmount
    });
    
    return { success: true, amount, displayAmount, normalized };
  } catch (error) {
    console.error('金额工具测试失败:', error);
    return { success: false, error: error.message };
  }
}

async function testEmailService() {
  console.log('\n=== 测试邮件服务 ===');
  
  try {
    const EmailService = require('./src/services/emailService');
    const emailService = new EmailService();
    
    // 测试邮件内容生成
    console.log('测试邮件内容生成...');
    const emailContent = emailService.generateEmailContent(testInvoiceData, testClientData);
    
    console.log('生成的邮件内容:');
    console.log('- 主题:', emailContent.subject);
    console.log('- 文本内容包含金额:', emailContent.text.includes('€60.00'));
    console.log('- HTML内容包含金额:', emailContent.html.includes('€60.00'));
    console.log('- 是否包含调试信息:', emailContent.text.includes('调试') || emailContent.html.includes('调试'));
    
    return { 
      success: true, 
      hasCorrectAmount: emailContent.text.includes('€60.00'),
      hasDebugInfo: emailContent.text.includes('调试') || emailContent.html.includes('调试')
    };
  } catch (error) {
    console.error('邮件服务测试失败:', error);
    return { success: false, error: error.message };
  }
}

async function testReminderService() {
  console.log('\n=== 测试提醒邮件服务 ===');
  
  try {
    // 模拟提醒邮件服务的数据处理
    const { normalizeInvoiceAmounts } = require('./src/utils/amountUtils');
    
    const normalizedData = normalizeInvoiceAmounts(testInvoiceData);
    console.log('提醒服务标准化数据:', {
      total: normalizedData.total,
      totalAmount: normalizedData.totalAmount
    });
    
    return { 
      success: true, 
      normalizedTotal: normalizedData.total,
      normalizedTotalAmount: normalizedData.totalAmount
    };
  } catch (error) {
    console.error('提醒邮件服务测试失败:', error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 开始测试新的总金额处理实现\n');
  
  const results = {
    amountUtils: await testAmountUtils(),
    emailService: await testEmailService(),
    reminderService: await testReminderService()
  };
  
  console.log('\n=== 测试结果汇总 ===');
  console.log('金额工具测试:', results.amountUtils.success ? '✅ 通过' : '❌ 失败');
  console.log('邮件服务测试:', results.emailService.success ? '✅ 通过' : '❌ 失败');
  console.log('提醒服务测试:', results.reminderService.success ? '✅ 通过' : '❌ 失败');
  
  if (results.emailService.success) {
    console.log('邮件金额显示:', results.emailService.hasCorrectAmount ? '✅ 正确' : '❌ 错误');
    console.log('调试信息清理:', !results.emailService.hasDebugInfo ? '✅ 已清理' : '❌ 仍存在');
  }
  
  const allPassed = results.amountUtils.success && 
                   results.emailService.success && 
                   results.reminderService.success &&
                   results.emailService.hasCorrectAmount &&
                   !results.emailService.hasDebugInfo;
  
  console.log('\n总体结果:', allPassed ? '🎉 所有测试通过！' : '⚠️ 部分测试失败');
  
  return results;
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };