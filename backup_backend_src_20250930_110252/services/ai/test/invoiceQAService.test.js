/**
 * 发票自然语言问答服务测试
 */

const InvoiceQAService = require('../invoiceQAService');
const { expect } = require('chai');

describe('InvoiceQAService', () => {
  let qaService;

  beforeEach(() => {
    qaService = new InvoiceQAService({
      maxResults: 5,
      confidenceThreshold: 0.7,
      useRAG: false,
      enableDataAnalysis: true
    });
  });

  describe('extractClientName', () => {
    it('应该从查询中提取客户名称', () => {
      const query1 = '客户"ABC公司"的发票有哪些？';
      const clientName1 = qaService.extractClientName(query1);
      expect(clientName1).to.equal('ABC公司');

      const query2 = '客户是张三的发票情况';
      const clientName2 = qaService.extractClientName(query2);
      expect(clientName2).to.equal('张三');

      const query3 = '客户李四的未付发票';
      const clientName3 = qaService.extractClientName(query3);
      expect(clientName3).to.equal('李四');

      const query4 = '没有客户名称的查询';
      const clientName4 = qaService.extractClientName(query4);
      expect(clientName4).to.be.null;
    });
  });

  describe('extractTimePeriod', () => {
    it('应该从查询中提取时间段', () => {
      const query1 = '上个月收入多少？';
      const timePeriod1 = qaService.extractTimePeriod(query1);
      expect(timePeriod1).to.equal('lastMonth');

      const query2 = '今年的收入统计';
      const timePeriod2 = qaService.extractTimePeriod(query2);
      expect(timePeriod2).to.equal('thisYear');

      const query3 = '最近7天的支付情况';
      const timePeriod3 = qaService.extractTimePeriod(query3);
      expect(timePeriod3).to.equal('last7Days');

      const query4 = '没有时间段的查询';
      const timePeriod4 = qaService.extractTimePeriod(query4);
      expect(timePeriod4).to.be.null;
    });
  });

  describe('fallbackIntentAnalysis', () => {
    it('应该正确分析查询意图', () => {
      const query1 = '客户ABC的发票有哪些？';
      const intent1 = qaService.fallbackIntentAnalysis(query1);
      expect(intent1.type).to.equal('client_invoices');
      expect(intent1.params.clientName).to.equal('ABC');

      const query2 = '支付状态如何？';
      const intent2 = qaService.fallbackIntentAnalysis(query2);
      expect(intent2.type).to.equal('payment_status');

      const query3 = '上个月收入多少？';
      const intent3 = qaService.fallbackIntentAnalysis(query3);
      expect(intent3.type).to.equal('revenue_summary');
      expect(intent3.params.timePeriod).to.equal('lastMonth');

      const query4 = '有哪些逾期发票？';
      const intent4 = qaService.fallbackIntentAnalysis(query4);
      expect(intent4.type).to.equal('overdue_invoices');

      const query5 = '客户ABC的付款情况如何？';
      const intent5 = qaService.fallbackIntentAnalysis(query5);
      expect(intent5.type).to.equal('client_summary');
      expect(intent5.params.clientName).to.equal('ABC');

      const query6 = '一般性问题';
      const intent6 = qaService.fallbackIntentAnalysis(query6);
      expect(intent6.type).to.equal('general');
    });
  });

  describe('getDateRangeFromPeriod', () => {
    it('应该根据时间段返回正确的日期范围', () => {
      const now = new Date();
      
      const range1 = qaService.getDateRangeFromPeriod('thisMonth');
      expect(range1.startDate.getDate()).to.equal(1);
      expect(range1.startDate.getMonth()).to.equal(now.getMonth());
      expect(range1.endDate.getDate()).to.equal(now.getDate());
      expect(range1.endDate.getMonth()).to.equal(now.getMonth());

      const range2 = qaService.getDateRangeFromPeriod('lastMonth');
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      expect(range2.startDate.getMonth()).to.equal(lastMonth.getMonth());
      expect(range2.startDate.getDate()).to.equal(1);

      const range3 = qaService.getDateRangeFromPeriod('thisYear');
      expect(range3.startDate.getMonth()).to.equal(0);
      expect(range3.startDate.getDate()).to.equal(1);
      expect(range3.startDate.getFullYear()).to.equal(now.getFullYear());

      const range4 = qaService.getDateRangeFromPeriod('lastYear');
      expect(range4.startDate.getFullYear()).to.equal(now.getFullYear() - 1);
      expect(range4.startDate.getMonth()).to.equal(0);
      expect(range4.startDate.getDate()).to.equal(1);
      expect(range4.endDate.getFullYear()).to.equal(now.getFullYear() - 1);
      expect(range4.endDate.getMonth()).to.equal(11);
      expect(range4.endDate.getDate()).to.equal(31);
    });
  });

  describe('calculateInvoiceStats', () => {
    it('应该正确计算发票统计信息', () => {
      const invoices = [
        { id: 1, amount: '1000', status: 'paid', payments: [{ amount: '1000' }] },
        { id: 2, amount: '2000', status: 'overdue', payments: [{ amount: '500' }] },
        { id: 3, amount: '1500', status: 'pending', payments: [] },
        { id: 4, amount: '3000', status: 'paid', payments: [{ amount: '3000' }] }
      ];

      const stats = qaService.calculateInvoiceStats(invoices);
      
      expect(stats.totalInvoices).to.equal(4);
      expect(stats.paidInvoices).to.equal(2);
      expect(stats.overdueInvoices).to.equal(1);
      expect(stats.pendingInvoices).to.equal(1);
      expect(stats.totalAmount).to.equal(7500);
      expect(stats.paidAmount).to.equal(4500);
      expect(stats.overdueAmount).to.equal(1500);
      expect(stats.outstandingAmount).to.equal(3000);
    });
  });

  describe('calculatePaidAmount', () => {
    it('应该正确计算已付金额', () => {
      const invoice1 = { payments: [{ amount: '1000' }, { amount: '500' }] };
      const paidAmount1 = qaService.calculatePaidAmount(invoice1);
      expect(paidAmount1).to.equal(1500);

      const invoice2 = { payments: [] };
      const paidAmount2 = qaService.calculatePaidAmount(invoice2);
      expect(paidAmount2).to.equal(0);

      const invoice3 = {};
      const paidAmount3 = qaService.calculatePaidAmount(invoice3);
      expect(paidAmount3).to.equal(0);
    });
  });

  describe('calculatePaymentCycles', () => {
    it('应该正确计算付款周期', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(now.getDate() - 60);
      
      const invoices = [
        { 
          status: 'paid', 
          issueDate: thirtyDaysAgo.toISOString(), 
          payments: [{ paymentDate: now.toISOString() }] 
        },
        { 
          status: 'paid', 
          issueDate: sixtyDaysAgo.toISOString(), 
          payments: [{ paymentDate: thirtyDaysAgo.toISOString() }] 
        }
      ];

      const cycles = qaService.calculatePaymentCycles(invoices);
      
      expect(cycles.averageDays).to.equal(45);
      expect(cycles.fastestDays).to.equal(30);
      expect(cycles.slowestDays).to.equal(60);
    });

    it('应该处理没有已付发票的情况', () => {
      const invoices = [
        { status: 'pending', payments: [] },
        { status: 'overdue', payments: [] }
      ];

      const cycles = qaService.calculatePaymentCycles(invoices);
      
      expect(cycles.averageDays).to.equal(0);
      expect(cycles.fastestDays).to.equal(0);
      expect(cycles.slowestDays).to.equal(0);
    });
  });

  describe('generateRequestId', () => {
    it('应该生成唯一的请求ID', () => {
      const id1 = qaService.generateRequestId();
      const id2 = qaService.generateRequestId();
      
      expect(id1).to.be.a('string');
      expect(id2).to.be.a('string');
      expect(id1).to.not.equal(id2);
      expect(id1).to.match(/^qa_\d+_[\w-]+$/);
    });
  });

  describe('parseIntentData', () => {
    it('应该正确解析意图数据', () => {
      const jsonText = '{"type": "client_invoices", "params": {"clientName": "ABC公司"}}';
      const intent = qaService.parseIntentData(jsonText);
      
      expect(intent.type).to.equal('client_invoices');
      expect(intent.params.clientName).to.equal('ABC公司');
    });

    it('应该从包含额外文本的响应中提取JSON', () => {
      const textWithJson = '这是AI的响应，包含JSON数据：{"type": "payment_status", "params": {}}。这是额外的文本。';
      const intent = qaService.parseIntentData(textWithJson);
      
      expect(intent.type).to.equal('payment_status');
      expect(intent.params).to.deep.equal({});
    });

    it('应该抛出错误当无法解析JSON时', () => {
      const invalidJson = '这不是一个有效的JSON';
      
      expect(() => qaService.parseIntentData(invalidJson)).to.throw();
    });
  });
});

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始运行发票自然语言问答服务测试...');
  
  // 这里应该使用测试框架运行所有测试
  // 由于我们使用的是简单的测试结构，这里只是一个占位符
  console.log('发票自然语言问答服务测试完成！');
  
  return {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests
};