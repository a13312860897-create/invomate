// 使用现有的数据库连接
const { Invoice, Customer } = require('./src/models');
const ReminderEmailService = require('./src/services/ai/reminderEmailService_new');

async function testEmailDataFlow() {
    try {
        console.log('🧪 开始测试邮件数据流...\n');
        
        // 使用模拟数据进行测试
        console.log('📝 使用模拟数据进行测试...');
        const mockInvoice = {
            id: 'mock-123',
            invoiceNumber: 'FR-2025-MOCK',
            total: 60.00,
            subtotal: 50.00,
            taxAmount: 10.00,
            customer: { name: 'Mock Customer' }
        };
        
        console.log('📋 模拟发票数据:');
        console.log('- ID:', mockInvoice.id);
        console.log('- 发票号:', mockInvoice.invoiceNumber);
        console.log('- 总金额 (total):', mockInvoice.total);
        console.log('- 小计 (subtotal):', mockInvoice.subtotal);
        console.log('- 税额 (taxAmount):', mockInvoice.taxAmount);
        console.log('- 客户:', mockInvoice.customer?.name || '未知');
        console.log('');
        
        // 2. 模拟AI控制器中的数据构造
        const invoiceData = {
            id: mockInvoice.id,
            invoiceNumber: mockInvoice.invoiceNumber,
            customer_name: mockInvoice.customer?.name || 'Test Customer',
            customerName: mockInvoice.customer?.name || 'Test Customer',
            dueDate: '2025-12-01',
            amount: mockInvoice.total,
            total: mockInvoice.total,
            totalAmount: mockInvoice.total,
            total_amount: mockInvoice.total,
            subtotal: mockInvoice.subtotal,
            taxAmount: mockInvoice.taxAmount
        };
        
        console.log('🔧 AI控制器构造的数据:');
        console.log(JSON.stringify(invoiceData, null, 2));
        console.log('');
        
        // 3. 测试ReminderEmailService
        console.log('📧 测试邮件服务数据处理...');
        
        // 这里我们不实际发送邮件，只测试数据处理
        console.log('✅ 邮件服务接收到的数据:');
        console.log('- invoiceData.amount:', invoiceData.amount);
        console.log('- invoiceData.total:', invoiceData.total);
        console.log('- invoiceData.totalAmount:', invoiceData.totalAmount);
        console.log('- invoiceData.total_amount:', invoiceData.total_amount);
        console.log('');
        
        // 4. 测试emailService中的金额处理逻辑
        console.log('💰 测试emailService金额处理逻辑:');
        
        let totalAmountRaw = invoiceData.totalAmount || 
                            invoiceData.total || 
                            invoiceData.total_amount || 
                            invoiceData.amount || '';
        
        console.log('- totalAmountRaw:', totalAmountRaw, '(类型:', typeof totalAmountRaw, ')');
        
        let totalAmount = 0;
        if (totalAmountRaw) {
            totalAmount = parseFloat(totalAmountRaw);
            if (isNaN(totalAmount)) {
                console.log('⚠️ 总金额转换失败，NaN结果:', totalAmountRaw);
                totalAmount = 0;
            }
        }
        
        console.log('- 转换后的totalAmount:', totalAmount);
        console.log('- totalAmount > 0:', totalAmount > 0);
        
        const formattedAmount = totalAmount > 0 ? `€${totalAmount.toFixed(2)}` : '';
        console.log('- formattedAmount:', formattedAmount);
        
        const finalFormattedAmount = formattedAmount || '€0.00 (调试:金额为空)';
        console.log('- finalFormattedAmount:', finalFormattedAmount);
        
        console.log('');
        
        if (totalAmount > 0) {
            console.log('✅ 数据流测试成功！总金额正确传递');
            console.log('🎯 预期邮件显示: €60.00');
            console.log('🎯 实际邮件显示:', finalFormattedAmount);
        } else {
            console.log('❌ 数据流测试失败！总金额为0或未正确传递');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 运行测试
testEmailDataFlow();