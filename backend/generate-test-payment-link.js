const axios = require('axios');

(async () => {
  try {
    console.log('正在生成测试支付链接...');
    
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功, Token:', token ? '已获取' : '未获取');
    
    // 获取未支付发票
    const invoicesResponse = await axios.get('http://localhost:8080/api/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const invoices = invoicesResponse.data.data.invoices;
    const unpaidInvoice = invoices.find(inv => inv.status === 'pending' || inv.status === 'sent');
    if (!unpaidInvoice) {
      console.log('❌ 没有找到未支付的发票');
      return;
    }
    
    console.log(`✅ 找到未支付发票: ${unpaidInvoice.invoiceNumber} (金额: €${unpaidInvoice.total})`);
    
    // 生成支付链接
    const paymentLinkResponse = await axios.post(
      `http://localhost:8080/api/invoices/${unpaidInvoice.id}/payment-link`,
      { paymentMethod: 'stripe' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('支付链接响应:', JSON.stringify(paymentLinkResponse.data, null, 2));
    
    const paymentData = paymentLinkResponse.data.data || paymentLinkResponse.data;
    
    console.log('');
    console.log('🔗 === 支付测试链接生成成功 ===');
    console.log('支付URL:', paymentData.paymentUrl);
    console.log('支付令牌:', paymentData.token);
    console.log('发票信息:', `${unpaidInvoice.invoiceNumber} - €${unpaidInvoice.total}`);
    console.log('');
    console.log('💳 Stripe测试卡号信息:');
    console.log('卡号: 4242 4242 4242 4242');
    console.log('过期日期: 12/25');
    console.log('CVC: 123');
    console.log('邮编: 12345');
    console.log('');
    console.log('请在浏览器中打开支付URL进行测试');
    
  } catch (error) {
    console.error('❌ 生成支付链接失败:', error.response?.data || error.message);
  }
})();