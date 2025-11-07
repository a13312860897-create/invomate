const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testExportBug() {
  try {
    console.log('=== 测试导出功能Bug ===');
    
    // 1. 登录获取token
    console.log('1. 登录...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('登录成功，token长度:', token.length);
    
    // 2. 获取发票列表
    console.log('2. 获取发票列表...');
    const invoicesResponse = await axios.get(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const invoices = invoicesResponse.data.data.invoices;
    console.log('发票数量:', invoices.length);
    
    if (invoices.length === 0) {
      console.log('没有发票可供测试');
      return;
    }
    
    const testInvoice = invoices[0];
    console.log('测试发票:', testInvoice.invoiceNumber, 'ID:', testInvoice.id);
    
    // 3. 测试PDF生成
    console.log('3. 测试PDF生成...');
    try {
      const pdfResponse = await axios.get(`${BASE_URL}/invoices/${testInvoice.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer',
        timeout: 30000 // 30秒超时
      });
      
      console.log('PDF生成成功!');
      console.log('Content-Type:', pdfResponse.headers['content-type']);
      console.log('Content-Length:', pdfResponse.headers['content-length']);
      console.log('PDF大小:', pdfResponse.data.length, 'bytes');
      
      // 检查PDF内容
      const pdfBuffer = Buffer.from(pdfResponse.data);
      const pdfHeader = pdfBuffer.slice(0, 8).toString();
      console.log('PDF头部:', pdfHeader);
      
      if (pdfHeader.startsWith('%PDF-')) {
        console.log('✅ PDF格式正确');
      } else {
        console.log('❌ PDF格式错误');
        console.log('前100字节:', pdfBuffer.slice(0, 100).toString());
      }
      
    } catch (pdfError) {
      console.error('❌ PDF生成失败:');
      console.error('状态码:', pdfError.response?.status);
      console.error('错误信息:', pdfError.response?.data);
      console.error('错误详情:', pdfError.message);
      
      if (pdfError.code === 'ECONNABORTED') {
        console.error('请求超时 - PDF生成可能需要更长时间');
      }
    }
    
    // 4. 测试邮件发送功能
    console.log('4. 测试邮件发送功能...');
    try {
      const emailResponse = await axios.post(`${BASE_URL}/ai/send-invoice-email`, {
        invoiceId: testInvoice.id,
        recipientEmail: 'test@example.com',
        type: 'invoice',
        attachPDF: true,
        useUserConfig: true
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });
      
      console.log('✅ 邮件发送测试成功');
      console.log('响应:', emailResponse.data);
      
    } catch (emailError) {
      console.error('❌ 邮件发送测试失败:');
      console.error('状态码:', emailError.response?.status);
      console.error('错误信息:', emailError.response?.data);
      console.error('错误详情:', emailError.message);
    }
    
    // 5. 检查发票数据完整性
    console.log('5. 检查发票数据完整性...');
    console.log('发票基本信息:');
    console.log('- ID:', testInvoice.id);
    console.log('- 编号:', testInvoice.invoiceNumber);
    console.log('- 状态:', testInvoice.status);
    console.log('- 总金额:', testInvoice.total);
    console.log('- 客户ID:', testInvoice.clientId);
    console.log('- 发票项目数量:', testInvoice.InvoiceItems?.length || 0);
    
    if (!testInvoice.Client) {
      console.log('⚠️  警告: 发票缺少客户信息');
    } else {
      console.log('- 客户:', testInvoice.Client.name || testInvoice.Client.company);
      console.log('- 客户邮箱:', testInvoice.Client.email);
    }
    
    if (!testInvoice.InvoiceItems || testInvoice.InvoiceItems.length === 0) {
      console.log('⚠️  警告: 发票缺少项目信息');
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testExportBug().catch(console.error);