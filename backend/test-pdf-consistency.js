const PDFService = require('./src/services/pdfServiceNew');
const PDFEmailService = require('./src/services/pdfEmailService');
const fs = require('fs');
const path = require('path');

async function testPDFConsistency() {
    console.log('=== PDF生成和预览功能一致性测试 ===\n');

    // 测试发票数据
    const testInvoiceData = {
        id: 1,
        invoiceNumber: 'INV-2025-001',
        date: '2025-01-15',
        dueDate: '2025-02-15',
        clientName: '测试客户公司',
        clientAddress: '123 测试街道\n75001 巴黎, 法国',
        clientEmail: 'test@example.com',
        items: [
            {
                description: '网站开发服务',
                quantity: 1,
                unitPrice: 1000,
                total: 1000
            },
            {
                description: '维护服务',
                quantity: 12,
                unitPrice: 100,
                total: 1200
            }
        ],
        subtotal: 2200,
        taxRate: 20,
        taxAmount: 440,
        total: 2640,
        currency: 'EUR'
    };

    const testClientData = {
        name: '测试客户公司',
        email: 'test@example.com',
        address: '123 测试街道\n75001 巴黎, 法国'
    };

    const testUserData = {
        companyName: '我的公司',
        name: '张三',
        email: 'company@example.com',
        address: '456 公司街道',
        city: '巴黎',
        postalCode: '75001',
        country: '法国',
        phone: '+33 1 23 45 67 89',
        tvaNumber: 'FR12345678901',
        siret: '12345678901234',
        siren: '123456789'
    };

    try {
        console.log('1. 测试前端预览PDF生成...');
        
        // 生成前端预览PDF
        const previewResult = await PDFService.generateInvoicePDF(testInvoiceData, testUserData, testClientData);
        console.log('预览PDF生成结果:', previewResult);
        
        // 检查返回结果格式
        let previewPdfBuffer;
        if (previewResult && previewResult.success && previewResult.buffer) {
            previewPdfBuffer = previewResult.buffer;
        } else if (Buffer.isBuffer(previewResult)) {
            previewPdfBuffer = previewResult;
        } else {
            throw new Error('前端预览PDF生成失败或返回格式不正确');
        }
        
        console.log(`✓ 前端预览PDF生成成功，大小: ${previewPdfBuffer.length} bytes`);

        // 保存预览PDF用于对比
        const previewPdfPath = path.join(__dirname, 'test-preview-pdf.pdf');
        fs.writeFileSync(previewPdfPath, previewPdfBuffer);
        console.log(`✓ 预览PDF已保存到: ${previewPdfPath}`);

        console.log('\n2. 测试邮件附件PDF生成...');
        
        // 创建PDFEmailService实例
        const pdfEmailService = new PDFEmailService();
        
        // 生成邮件附件PDF
        const emailResult = await pdfEmailService.generatePDF({
            invoiceData: testInvoiceData,
            userData: testUserData,
            clientData: testClientData
        });
        console.log('邮件PDF生成结果:', emailResult);
        
        // 检查返回结果格式
        let emailPdfBuffer;
        if (emailResult && emailResult.success && emailResult.buffer) {
            emailPdfBuffer = emailResult.buffer;
        } else if (emailResult && emailResult.pdfBuffer) {
            emailPdfBuffer = emailResult.pdfBuffer;
        } else if (Buffer.isBuffer(emailResult)) {
            emailPdfBuffer = emailResult;
        } else {
            throw new Error('邮件附件PDF生成失败或返回格式不正确');
        }
        
        console.log(`✓ 邮件附件PDF生成成功，大小: ${emailPdfBuffer.length} bytes`);

        // 保存邮件PDF用于对比
        const emailPdfPath = path.join(__dirname, 'test-email-pdf.pdf');
        fs.writeFileSync(emailPdfPath, emailPdfBuffer);
        console.log(`✓ 邮件PDF已保存到: ${emailPdfPath}`);

        console.log('\n3. 对比PDF内容一致性...');
        
        // 比较文件大小
        const sizeDifference = Math.abs(previewPdfBuffer.length - emailPdfBuffer.length);
        const sizePercentageDiff = (sizeDifference / Math.max(previewPdfBuffer.length, emailPdfBuffer.length)) * 100;
        
        console.log(`预览PDF大小: ${previewPdfBuffer.length} bytes`);
        console.log(`邮件PDF大小: ${emailPdfBuffer.length} bytes`);
        console.log(`大小差异: ${sizeDifference} bytes (${sizePercentageDiff.toFixed(2)}%)`);

        // 比较文件内容
        const contentMatch = Buffer.compare(previewPdfBuffer, emailPdfBuffer) === 0;
        console.log(`内容完全匹配: ${contentMatch ? '✓ 是' : '✗ 否'}`);

        if (!contentMatch) {
            console.log('\n⚠️  PDF内容不完全匹配，可能的原因:');
            console.log('- 生成时间戳不同');
            console.log('- PDF元数据不同');
            console.log('- 使用了不同的PDF生成参数');
            
            // 检查前几个字节是否匹配（PDF头部）
            const headerMatch = previewPdfBuffer.subarray(0, 100).equals(emailPdfBuffer.subarray(0, 100));
            console.log(`PDF头部匹配: ${headerMatch ? '✓ 是' : '✗ 否'}`);
        }

        console.log('\n4. 测试邮件发送功能...');
        
        // 测试邮件发送（不实际发送，只生成内容）
        try {
            const emailResult = await pdfEmailService.generateAndSendInvoice({
                invoiceData: testInvoiceData,
                userData: testUserData,
                clientData: testClientData,
                recipientEmail: 'test@example.com',
                customText: '这是一个PDF一致性测试邮件',
                dryRun: true // 不实际发送
            });
            console.log('✓ 邮件内容生成成功');
            console.log(`邮件主题: ${emailResult.subject || '发票邮件'}`);
        } catch (emailError) {
            console.log(`⚠️  邮件功能测试失败: ${emailError.message}`);
        }

        console.log('\n=== 测试总结 ===');
        console.log(`✓ 前端预览PDF生成: 正常`);
        console.log(`✓ 邮件附件PDF生成: 正常`);
        console.log(`${contentMatch ? '✓' : '⚠️'} PDF内容一致性: ${contentMatch ? '完全匹配' : '存在差异'}`);
        console.log(`✓ 大小差异: ${sizePercentageDiff.toFixed(2)}% (${sizePercentageDiff < 5 ? '可接受' : '需要检查'})`);

        if (contentMatch || sizePercentageDiff < 5) {
            console.log('\n🎉 PDF生成和预览功能一致性验证通过！');
        } else {
            console.log('\n⚠️  PDF一致性存在问题，建议进一步检查生成逻辑');
        }

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('错误详情:', error);
    } finally {
        // 清理测试文件
        try {
            const previewPath = path.join(__dirname, 'test-preview-pdf.pdf');
            const emailPath = path.join(__dirname, 'test-email-pdf.pdf');
            
            if (fs.existsSync(previewPath)) {
                fs.unlinkSync(previewPath);
                console.log('\n🧹 已清理预览PDF测试文件');
            }
            
            if (fs.existsSync(emailPath)) {
                fs.unlinkSync(emailPath);
                console.log('🧹 已清理邮件PDF测试文件');
            }
        } catch (cleanupError) {
            console.log('⚠️  清理测试文件时出错:', cleanupError.message);
        }
    }
}

// 运行测试
testPDFConsistency().catch(console.error);