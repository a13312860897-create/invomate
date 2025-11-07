const puppeteer = require('puppeteer');

async function testInvoiceStatusPage() {
  console.log('🚀 开始测试Invoice Status页面...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // 监听控制台日志
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 前端错误:', msg.text());
      } else if (msg.text().includes('Invoice Status') || msg.text().includes('statusBreakdown')) {
        console.log('📊 前端日志:', msg.text());
      }
    });
    
    // 访问登录页面
    console.log('📱 访问登录页面...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // 登录
    console.log('🔐 执行登录...');
    await page.type('input[type="email"]', 'a133128860897@163.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // 等待登录成功并跳转到仪表板
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ 登录成功');
    
    // 导航到Reports页面
    console.log('📊 导航到Reports页面...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForSelector('.bg-white', { timeout: 10000 });
    
    // 等待一下让数据加载
    await page.waitForTimeout(3000);
    
    // 点击Invoice Status标签
    console.log('🎯 切换到Invoice Status标签...');
    const invoiceStatusTab = await page.$x("//button[contains(text(), 'Invoice Status')]");
    if (invoiceStatusTab.length > 0) {
      await invoiceStatusTab[0].click();
      await page.waitForTimeout(2000);
    }
    
    // 检查页面元素
    console.log('🔍 检查页面元素...');
    
    // 检查Total Amount是否显示€符号
    const totalAmountElements = await page.$$eval('*', els => 
      els.filter(el => el.textContent && el.textContent.includes('€')).map(el => el.textContent.trim())
    );
    console.log('💰 找到的€符号元素:', totalAmountElements);
    
    // 检查Status Distribution图表
    const chartElements = await page.$$('canvas');
    console.log('📈 找到的图表数量:', chartElements.length);
    
    // 检查Status Breakdown表格
    const tableRows = await page.$$('tbody tr');
    console.log('📋 Status Breakdown表格行数:', tableRows.length);
    
    if (tableRows.length > 0) {
      for (let i = 0; i < Math.min(tableRows.length, 5); i++) {
        const rowText = await page.evaluate(el => el.textContent, tableRows[i]);
        console.log(`📋 表格行 ${i + 1}:`, rowText.trim());
      }
    }
    
    // 截图保存
    await page.screenshot({ 
      path: 'invoice-status-test.png', 
      fullPage: true 
    });
    console.log('📸 截图已保存为 invoice-status-test.png');
    
    console.log('✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testInvoiceStatusPage();