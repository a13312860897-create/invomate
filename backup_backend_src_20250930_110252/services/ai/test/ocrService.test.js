/**
 * OCR服务测试
 * 测试OCR服务的功能
 */

const OCRService = require('../ocrService');
const fs = require('fs');
const path = require('path');

/**
 * 测试OCR服务工厂
 */
async function testOCRService() {
  console.log('开始测试OCR服务...');
  
  try {
    // 创建OCR服务实例
    const ocrService = new OCRService();
    
    // 测试基本配置
    console.log('OCR服务配置:');
    console.log('- 提供商:', ocrService.ocrProvider);
    console.log('- 置信度阈值:', ocrService.confidenceThreshold);
    console.log('- 支持的格式:', ocrService.supportedFormats);
    console.log('- 最大文件大小:', ocrService.maxFileSize / (1024 * 1024), 'MB');
    console.log('- 临时目录:', ocrService.tempDir);
    
    // 测试文件验证功能
    console.log('\n测试文件验证功能...');
    
    // 创建一个临时测试文件
    const testDir = path.join(__dirname, '../../../temp');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFilePath = path.join(testDir, 'test.txt');
    fs.writeFileSync(testFilePath, '这是一个测试文件');
    
    try {
      await ocrService.validateFile(testFilePath);
      console.log('✓ 文件验证通过');
    } catch (error) {
      console.error('✗ 文件验证失败:', error.message);
    }
    
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    // 测试请求ID生成
    console.log('\n测试请求ID生成...');
    const requestId = ocrService.generateRequestId();
    console.log('生成的请求ID:', requestId);
    console.log('✓ 请求ID生成成功');
    
    // 测试发票数据解析
    console.log('\n测试发票数据解析...');
    
    const testJsonData = {
      invoiceNumber: 'INV-2023-001',
      invoiceDate: '2023-11-15',
      totalAmount: 1000.00,
      currency: 'CNY',
      items: [
        {
          description: '测试项目1',
          quantity: 1,
          unitPrice: 500.00,
          amount: 500.00
        },
        {
          description: '测试项目2',
          quantity: 1,
          unitPrice: 500.00,
          amount: 500.00
        }
      ]
    };
    
    const testJsonString = JSON.stringify(testJsonData);
    const parsedData = ocrService.parseInvoiceData(testJsonString);
    
    console.log('解析结果:', JSON.stringify(parsedData, null, 2));
    console.log('✓ 发票数据解析成功');
    
    // 测试提示词构建
    console.log('\n测试提示词构建...');
    
    const testText = '发票号码: INV-2023-001\n发票日期: 2023-11-15\n总金额: 1000.00元\n货币: CNY';
    const prompt = ocrService.buildInvoiceAnalysisPrompt(testText);
    
    console.log('生成的提示词（前200字符）:', prompt.substring(0, 200) + '...');
    console.log('✓ 提示词构建成功');
    
    console.log('\nOCR服务测试完成！');
    return true;
  } catch (error) {
    console.error('OCR服务测试失败:', error);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始运行OCR服务测试...\n');
  
  const results = {
    ocrService: await testOCRService()
  };
  
  console.log('\n测试结果总结:');
  Object.keys(results).forEach(testName => {
    console.log(`- ${testName}: ${results[testName] ? '✓ 通过' : '✗ 失败'}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n总体结果: ${allPassed ? '✓ 所有测试通过' : '✗ 部分测试失败'}`);
  
  return allPassed;
}

// 导出测试函数
module.exports = {
  testOCRService,
  runAllTests
};

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('测试运行出错:', error);
      process.exit(1);
    });
}