const axios = require('axios');

const API_BASE = 'http://localhost:8080/api';

// 测试发票数据
const testInvoices = [
  {
    clientName: 'TechCorp Solutions',
    clientEmail: 'contact@techcorp.fr',
    clientAddress: '123 Avenue des Champs-Élysées, 75008 Paris',
    clientSiret: '12345678901234',
    items: [
      { description: 'Développement web', quantity: 10, unitPrice: 150, taxRate: 20 }
    ],
    issueDate: '2024-11-05',
    dueDate: '2024-12-05',
    status: 'paid',
    paidDate: '2024-11-15'
  },
  {
    clientName: 'Digital Marketing Pro',
    clientEmail: 'info@digitalmarketing.fr',
    clientAddress: '456 Rue de Rivoli, 75001 Paris',
    clientSiret: '98765432109876',
    items: [
      { description: 'Consultation SEO', quantity: 5, unitPrice: 200, taxRate: 20 },
      { description: 'Audit technique', quantity: 1, unitPrice: 500, taxRate: 20 }
    ],
    issueDate: '2024-11-10',
    dueDate: '2024-12-10',
    status: 'paid',
    paidDate: '2024-11-20'
  },
  {
    clientName: 'StartUp Innovation',
    clientEmail: 'hello@startup-innovation.fr',
    clientAddress: '789 Boulevard Saint-Germain, 75006 Paris',
    clientSiret: '11223344556677',
    items: [
      { description: 'Formation React', quantity: 3, unitPrice: 300, taxRate: 20 }
    ],
    issueDate: '2024-11-15',
    dueDate: '2024-12-15',
    status: 'paid',
    paidDate: '2024-11-25'
  },
  {
    clientName: 'E-commerce Solutions',
    clientEmail: 'support@ecommerce-solutions.fr',
    clientAddress: '321 Rue du Faubourg Saint-Antoine, 75011 Paris',
    clientSiret: '55667788990011',
    items: [
      { description: 'Intégration API', quantity: 8, unitPrice: 125, taxRate: 20 },
      { description: 'Tests automatisés', quantity: 4, unitPrice: 175, taxRate: 20 }
    ],
    issueDate: '2024-11-20',
    dueDate: '2024-12-20',
    status: 'paid',
    paidDate: '2024-11-28'
  },
  {
    clientName: 'Consulting Group France',
    clientEmail: 'contact@consulting-group.fr',
    clientAddress: '654 Avenue Montaigne, 75008 Paris',
    clientSiret: '99887766554433',
    items: [
      { description: 'Audit sécurité', quantity: 1, unitPrice: 800, taxRate: 20 },
      { description: 'Rapport de conformité', quantity: 1, unitPrice: 400, taxRate: 20 }
    ],
    issueDate: '2024-11-25',
    dueDate: '2024-12-25',
    status: 'paid',
    paidDate: '2024-11-30'
  }
];

async function createTestInvoices() {
  try {
    console.log('🔍 开始创建十一月份测试发票...');
    
    // 首先登录获取token
    console.log('📝 正在登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'a133128860897@163.com',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log(`📊 准备创建 ${testInvoices.length} 张发票...`);
    
    for (let i = 0; i < testInvoices.length; i++) {
      const invoice = testInvoices[i];
      console.log(`\n📄 创建发票 ${i + 1}/${testInvoices.length}: ${invoice.clientName}`);
      
      try {
        // 首先创建客户
        console.log(`👤 创建客户: ${invoice.clientName}`);
        const clientData = {
          name: invoice.clientName,
          email: invoice.clientEmail,
          address: invoice.clientAddress,
          siret: invoice.clientSiret
        };
        
        const clientResponse = await axios.post(`${API_BASE}/clients`, clientData, { headers });
        const clientId = clientResponse.data.data.id;
        console.log(`✅ 客户创建成功，ID: ${clientId}`);
        
        // 创建发票数据
        let subtotal = 0;
        let taxAmount = 0;
        
        // 计算金额
        invoice.items.forEach(item => {
          const itemSubtotal = item.quantity * item.unitPrice;
          const itemTax = itemSubtotal * (item.taxRate / 100);
          subtotal += itemSubtotal;
          taxAmount += itemTax;
        });
        
        const total = subtotal + taxAmount;
        
        const invoiceData = {
          clientId: clientId,
          items: invoice.items,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          status: invoice.status,
          subtotal: subtotal,
          taxAmount: taxAmount,
          total: total
        };
        
        console.log(`💰 计算金额: 小计=${subtotal}€, 税额=${taxAmount}€, 总计=${total}€`);
        
        // 创建发票
        const createResponse = await axios.post(`${API_BASE}/invoices`, invoiceData, { headers });
        console.log('发票创建响应:', createResponse.data);
        
        const invoiceId = createResponse.data.data?.id || createResponse.data.id;
        console.log(`✅ 发票创建成功，ID: ${invoiceId}`);
        
        // 如果状态是已支付，更新支付状态
        if (invoice.status === 'paid' && invoiceId) {
          await axios.patch(`${API_BASE}/invoices/${invoiceId}/status`, {
            status: 'paid',
            paidDate: invoice.paidDate
          }, { headers });
          console.log(`💰 发票 ${invoiceId} 已标记为已支付`);
        }
        
      } catch (error) {
        console.error(`❌ 创建发票失败:`, error.response?.data || error.message);
      }
    }
    
    console.log('\n🎉 所有测试发票创建完成！');
    console.log('📈 现在可以访问报告页面查看数据');
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.response?.data || error.message);
  }
}

createTestInvoices();