const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// 测试配置
const testConfig = {
  email: 'a133128860897@163.com',
  password: '123456'
};

let authToken = '';

async function login() {
  try {
    console.log('=== 登录测试 ===');
    const response = await axios.post(`${BASE_URL}/auth/login`, testConfig);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ 登录成功');
      return true;
    } else {
      console.log('❌ 登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 登录错误:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetInvoices() {
  try {
    console.log('\n=== 测试获取发票列表 ===');
    const response = await axios.get(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const invoices = response.data.data.invoices;
      console.log(`✅ 获取发票列表成功，共 ${invoices.length} 张发票`);
      
      // 检查每张发票是否包含必要字段
      invoices.forEach((invoice, index) => {
        console.log(`发票 ${index + 1}:`);
        console.log(`  - ID: ${invoice.id}`);
        console.log(`  - 编号: ${invoice.invoiceNumber}`);
        console.log(`  - 状态: ${invoice.status}`);
        console.log(`  - 总金额: ${invoice.total}`);
        console.log(`  - 客户: ${invoice.Client?.name || '未知'}`);
        console.log(`  - 项目数量: ${invoice.InvoiceItems?.length || 0}`);
        
        if (!invoice.InvoiceItems || invoice.InvoiceItems.length === 0) {
          console.log('  ⚠️  警告: 发票缺少项目信息');
        } else {
          console.log('  ✅ 发票包含项目信息');
        }
      });
      
      return invoices;
    } else {
      console.log('❌ 获取发票列表失败:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ 获取发票列表错误:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testExportFunction(invoiceId) {
  try {
    console.log(`\n=== 测试导出功能 (发票ID: ${invoiceId}) ===`);
    const response = await axios.get(`${BASE_URL}/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ PDF导出成功');
    console.log(`PDF大小: ${response.data.byteLength} bytes`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // 检查PDF头部
    const pdfHeader = Buffer.from(response.data.slice(0, 8)).toString();
    if (pdfHeader.startsWith('%PDF')) {
      console.log('✅ PDF格式正确');
      return true;
    } else {
      console.log('❌ PDF格式错误');
      return false;
    }
  } catch (error) {
    console.log('❌ PDF导出失败:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testMarkAsPaid(invoiceId) {
  try {
    console.log(`\n=== 测试标记已付功能 (发票ID: ${invoiceId}) ===`);
    const response = await axios.patch(`${BASE_URL}/invoices/${invoiceId}/status`, {
      status: 'paid'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.message && response.data.message.includes('successfully')) {
      console.log('✅ 标记已付成功');
      return true;
    } else {
      console.log('❌ 标记已付失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 标记已付错误:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testPaymentLink(invoiceId) {
  try {
    console.log(`\n=== 测试支付链接生成 (发票ID: ${invoiceId}) ===`);
    const response = await axios.post(`${BASE_URL}/invoices/${invoiceId}/payment-link`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ 支付链接生成成功');
      console.log(`支付链接: ${response.data.data.paymentUrl}`);
      return true;
    } else {
      console.log('❌ 支付链接生成失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 支付链接生成错误:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testEmailSending(invoiceId) {
  try {
    console.log(`\n=== 测试邮件发送功能 (发票ID: ${invoiceId}) ===`);
    const response = await axios.post(`${BASE_URL}/ai/send-invoice-email`, {
      invoiceId: invoiceId,
      recipientEmail: 'test@example.com',
      subject: '测试发票邮件',
      message: '这是一封测试邮件'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ 邮件发送成功');
      console.log(`邮件ID: ${response.data.data.messageId}`);
      return true;
    } else {
      console.log('❌ 邮件发送失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 邮件发送错误:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDeleteInvoice(invoiceId) {
  try {
    console.log(`\n=== 测试删除发票功能 (发票ID: ${invoiceId}) ===`);
    const response = await axios.delete(`${BASE_URL}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ 删除发票成功');
      return true;
    } else {
      console.log('❌ 删除发票失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 删除发票错误:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== 发票界面按钮功能全面测试 ===\n');
  
  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ 登录失败，终止测试');
    return;
  }
  
  // 2. 获取发票列表
  const invoices = await testGetInvoices();
  if (invoices.length === 0) {
    console.log('❌ 没有发票可测试');
    return;
  }
  
  // 选择一张未付款的发票进行测试
  const testInvoice = invoices.find(inv => inv.status !== 'paid') || invoices[0];
  console.log(`\n选择测试发票: ${testInvoice.invoiceNumber} (ID: ${testInvoice.id})`);
  
  // 3. 测试导出功能
  await testExportFunction(testInvoice.id);
  
  // 4. 测试邮件发送
  await testEmailSending(testInvoice.id);
  
  // 5. 测试支付链接生成
  await testPaymentLink(testInvoice.id);
  
  // 6. 测试标记已付（如果发票未付款）
  if (testInvoice.status !== 'paid') {
    await testMarkAsPaid(testInvoice.id);
  }
  
  // 7. 测试删除功能（使用最后一张发票）
  const lastInvoice = invoices[invoices.length - 1];
  if (lastInvoice && lastInvoice.id !== testInvoice.id) {
    console.log(`\n⚠️  注意: 将删除发票 ${lastInvoice.invoiceNumber} (ID: ${lastInvoice.id})`);
    // await testDeleteInvoice(lastInvoice.id); // 注释掉删除测试，避免误删数据
    console.log('🔒 删除测试已跳过（保护数据）');
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('✅ 所有主要按钮功能已测试');
}

// 运行测试
runAllTests().catch(console.error);