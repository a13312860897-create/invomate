/**
 * AI服务测试文件
 * 用于测试AI服务是否正常工作
 */

const aiServiceFactory = require('../aiServiceFactory');
const reminderEmailService = require('../reminderEmailService');

// 模拟发票数据
const mockInvoice = {
  id: 'inv-123',
  invoiceNumber: 'INV-2023-001',
  date: '2023-10-01',
  dueDate: '2023-10-15',
  amount: 1500,
  currency: 'CNY',
  overdueDays: 5,
  paymentMethods: ['银行转账', '支付宝'],
  paymentInstructions: '请转账至以下账户：户名：XXX公司，账号：123456789，开户行：XX银行'
};

// 模拟客户数据
const mockClient = {
  id: 'client-456',
  name: '张三',
  companyName: 'ABC科技有限公司',
  country: 'France',
  vatNumber: 'FR12345678901',
  siren: '123456789',
  siret: '12345678901234',
  type: '企业客户'
};

/**
 * 测试AI服务工厂
 */
async function testAIServiceFactory() {
  console.log('测试AI服务工厂...');
  
  try {
    // 获取默认AI服务
    const defaultService = aiServiceFactory.getDefaultService();
    console.log('✓ 默认AI服务创建成功:', defaultService.constructor.name);
    
    // 获取支持的提供商
    const supportedProviders = aiServiceFactory.getSupportedProviders();
    console.log('✓ 支持的AI提供商:', supportedProviders);
    
    return true;
  } catch (error) {
    console.error('✗ AI服务工厂测试失败:', error.message);
    return false;
  }
}

/**
 * 测试催款邮件服务
 */
async function testReminderEmailService() {
  console.log('\n测试催款邮件服务...');
  
  try {
    // 生成催款邮件内容
    const emailResult = await reminderEmailService.generateReminderEmail(
      mockInvoice,
      mockClient,
      {
        template: 'friendly',
        language: 'zh-CN'
      }
    );
    
    if (emailResult.success) {
      console.log('✓ 催款邮件内容生成成功');
      console.log('  主题:', emailResult.subject);
      console.log('  模板:', emailResult.template);
      console.log('  语气:', emailResult.tone);
      console.log('  紧急程度:', emailResult.urgency);
      
      // 打印部分邮件内容
      const bodyPreview = emailResult.body.substring(0, 100) + '...';
      console.log('  内容预览:', bodyPreview);
      
      return true;
    } else {
      console.error('✗ 催款邮件内容生成失败:', emailResult.error);
      return false;
    }
  } catch (error) {
    console.error('✗ 催款邮件服务测试失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始运行AI服务测试...\n');
  
  const results = [];
  
  // 测试AI服务工厂
  results.push(await testAIServiceFactory());
  
  // 测试催款邮件服务
  results.push(await testReminderEmailService());
  
  // 输出测试结果
  console.log('\n测试结果摘要:');
  console.log('============');
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`通过: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！AI服务架构工作正常。');
  } else {
    console.log(`\n⚠️  有 ${totalTests - passedTests} 个测试失败，请检查配置和实现。`);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAIServiceFactory,
  testReminderEmailService,
  runAllTests
};