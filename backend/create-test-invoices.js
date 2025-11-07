const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';
let authToken = '';

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    if (response.data.data && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ 登录成功');
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ 登录失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 获取客户列表
async function getClients() {
  try {
    const response = await axios.get(`${BASE_URL}/clients`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('客户API响应:', response.data);
    const clients = response.data.data?.clients || response.data.clients || response.data.data || response.data || [];
    return Array.isArray(clients) ? clients : [];
  } catch (error) {
    console.log('❌ 获取客户列表失败:', error.response?.data?.message || error.message);
    return [];
  }
}

// 创建发票
async function createInvoice(invoiceData) {
  try {
    console.log(`发送的发票数据:`, JSON.stringify(invoiceData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/invoices`, invoiceData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.invoice || response.data.id) {
      return response.data.invoice || response.data;
    }
    return null;
  } catch (error) {
    console.log(`创建发票失败详情:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    console.log('❌ 创建发票失败:', error.response?.data?.message || error.message);
    return null;
  }
}

// 生成测试发票数据
function generateInvoiceData(index, clients) {
  const client = clients[index % clients.length];
  
  const issueDate = new Date();
  issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30));
  
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);
  
  const statuses = ['draft', 'sent', 'paid', 'overdue'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  // 生成发票项目
  const quantity = 1 + Math.floor(Math.random() * 5);
  const unitPrice = 100 + Math.floor(Math.random() * 500);
  const taxRate = 20;
  
  // 计算金额
  const subtotal = quantity * unitPrice;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  return {
    clientId: client.id,
    // 不提供invoiceNumber，让API自动生成
    issueDate: issueDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    status,
    subtotal: subtotal,
    taxAmount: taxAmount,
    total: total,
    notes: `测试发票 ${index + 1}`,
    items: [
      {
        description: `测试服务 ${index + 1}`,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: taxRate
      }
    ]
  };
}

// 主函数
async function main() {
  console.log('=== 创建8张测试发票用于验证翻页功能 ===\n');
  
  // 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('登录失败，无法继续');
    return;
  }
  
  // 获取客户列表
  console.log('\n=== 获取客户列表 ===');
  const clients = await getClients();
  if (clients.length === 0) {
    console.log('❌ 没有可用的客户，无法创建发票');
    return;
  }
  console.log(`✅ 获取到 ${clients.length} 个客户`);
  
  // 创建8张测试发票
  console.log('\n=== 创建测试发票 ===');
  const createdInvoices = [];
  
  for (let i = 0; i < 8; i++) {
    const invoiceData = generateInvoiceData(i, clients);
    console.log(`创建第 ${i + 1} 张发票...`);
    
    const invoice = await createInvoice(invoiceData);
    if (invoice) {
      createdInvoices.push(invoice);
      console.log(`✅ 发票 ${i + 1} 创建成功 - ID: ${invoice.id}, 编号: ${invoice.invoiceNumber}, 状态: ${invoice.status}`);
    } else {
      console.log(`❌ 发票 ${i + 1} 创建失败`);
    }
    
    // 稍微延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n=== 创建完成 ===`);
  console.log(`✅ 成功创建 ${createdInvoices.length} 张测试发票`);
  console.log('现在可以在前端界面验证翻页功能了！');
  
  // 显示创建的发票摘要
  console.log('\n=== 创建的发票摘要 ===');
  createdInvoices.forEach((invoice, index) => {
    console.log(`${index + 1}. ${invoice.invoiceNumber} - ${invoice.status} - 客户: ${clients.find(c => c.id === invoice.clientId)?.name || 'N/A'}`);
  });
}

// 运行脚本
main().catch(console.error);