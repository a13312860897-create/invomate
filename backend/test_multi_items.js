// 测试多物品发票的完整流程
const fetch = require('node-fetch');

// 模拟前端计算逻辑
function calculateItemTotal(item) {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const taxAmount = subtotal * ((item.taxRate || 0) / 100);
    return subtotal + taxAmount;
}

function calculateSubtotal(items) {
    return items.reduce((total, item) => {
        return total + ((item.quantity || 0) * (item.unitPrice || 0));
    }, 0);
}

function calculateTotalTax(items) {
    return items.reduce((total, item) => {
        const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
        const taxAmount = subtotal * ((item.taxRate || 0) / 100);
        return total + taxAmount;
    }, 0);
}

function calculateInvoiceTotal(items) {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
}

async function testMultiItemInvoice() {
    console.log('🧪 开始测试多物品发票...');
    
    // 创建多物品测试数据
    const items = [
        {
            description: "笔记本电脑 Dell XPS 13",
            quantity: 2,
            unitPrice: 1200.00,
            taxRate: 20.0
        },
        {
            description: "无线鼠标 Logitech MX Master",
            quantity: 3,
            unitPrice: 89.99,
            taxRate: 20.0
        },
        {
            description: "机械键盘 Cherry MX",
            quantity: 1,
            unitPrice: 150.00,
            taxRate: 10.0
        },
        {
            description: "显示器支架",
            quantity: 2,
            unitPrice: 45.50,
            taxRate: 20.0
        }
    ];
    
    // 计算总金额
    const subtotal = calculateSubtotal(items);
    const taxAmount = calculateTotalTax(items);
    const total = calculateInvoiceTotal(items);
    
    console.log('📊 计算结果:');
    console.log('物品详情:');
    items.forEach((item, index) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        const itemTax = itemSubtotal * (item.taxRate / 100);
        const itemTotal = itemSubtotal + itemTax;
        console.log(`  ${index + 1}. ${item.description}`);
        console.log(`     数量: ${item.quantity}, 单价: €${item.unitPrice}`);
        console.log(`     小计: €${itemSubtotal.toFixed(2)}, 税额: €${itemTax.toFixed(2)}, 总计: €${itemTotal.toFixed(2)}`);
    });
    
    console.log(`\n💰 总计算结果:`);
    console.log(`  小计: €${subtotal.toFixed(2)}`);
    console.log(`  税额: €${taxAmount.toFixed(2)}`);
    console.log(`  总计: €${total.toFixed(2)}`);
    
    // 构建发票数据
    const invoiceData = {
        formData: {
            items: items,
            invoiceNumber: "MULTI-TEST-001",
            issueDate: "2024-01-15",
            dueDate: "2024-02-15",
            notes: "多物品测试发票 - 包含不同税率的商品",
            subtotal: parseFloat(subtotal.toFixed(2)),
            taxAmount: parseFloat(taxAmount.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            totalAmount: parseFloat(total.toFixed(2)),
            amount: parseFloat(total.toFixed(2))
        },
        client: {
            name: "张三",
            company: "测试科技有限公司",
            email: "test@example.com",
            address: "北京市朝阳区测试大街123号",
            city: "北京",
            postalCode: "100000",
            country: "中国"
        },
        user: {
            name: "李四",
            email: "sender@example.com",
            company: "发票软件公司"
        },
        recipientEmail: "test@example.com",
        subject: "多物品测试发票 - 总金额验证",
        customText: "这是一个包含多个不同税率物品的测试发票，用于验证总金额计算和显示是否正确。"
    };
    
    console.log('\n📧 发送邮件测试...');
    console.log('发送的数据:', JSON.stringify(invoiceData, null, 2));
    
    try {
        const response = await fetch('http://localhost:8080/api/pdf-email/send/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });
        
        const result = await response.json();
        console.log('\n✅ 邮件发送结果:', result);
        
        if (result.success) {
            console.log('🎉 测试成功！邮件已发送，请检查邮箱中的总金额显示。');
        } else {
            console.log('❌ 测试失败:', result.message);
        }
        
    } catch (error) {
        console.error('❌ 发送邮件时出错:', error);
    }
}

// 运行测试
testMultiItemInvoice().catch(console.error);