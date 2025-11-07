/**
 * 模拟支付服务 - 用于开发和测试
 * 在Paddle API配置正确之前使用此服务
 */
class MockPaymentService {
  constructor() {
    this.mockTransactions = new Map();
    this.transactionCounter = 1000;
  }

  /**
   * 模拟创建支付链接
   */
  async createPaymentLink(data) {
    console.log('🎭 使用模拟支付服务创建支付链接');
    console.log('📝 支付数据:', JSON.stringify(data, null, 2));

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const transactionId = `txn_mock_${this.transactionCounter++}`;
    const checkoutUrl = `https://mock-checkout.paddle.com/checkout/${transactionId}`;

    const mockTransaction = {
      id: transactionId,
      status: 'draft',
      checkout: {
        url: checkoutUrl
      },
      items: data.items,
      collection_mode: data.collection_mode,
      currency_code: data.currency_code,
      custom_data: data.custom_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 存储模拟交易
    this.mockTransactions.set(transactionId, mockTransaction);

    console.log('✅ 模拟支付链接创建成功');
    console.log('🔗 支付URL:', checkoutUrl);

    return {
      data: mockTransaction
    };
  }

  /**
   * 模拟获取交易信息
   */
  async getTransaction(transactionId) {
    console.log('🎭 获取模拟交易信息:', transactionId);
    
    const transaction = this.mockTransactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    return {
      data: transaction
    };
  }

  /**
   * 模拟处理webhook
   */
  async processWebhook(webhookData) {
    console.log('🎭 处理模拟webhook:', webhookData);
    
    // 模拟webhook处理逻辑
    return {
      success: true,
      message: 'Mock webhook processed successfully'
    };
  }

  /**
   * 获取所有模拟交易（用于调试）
   */
  getAllMockTransactions() {
    return Array.from(this.mockTransactions.values());
  }

  /**
   * 清除所有模拟数据
   */
  clearMockData() {
    this.mockTransactions.clear();
    this.transactionCounter = 1000;
    console.log('🧹 模拟数据已清除');
  }
}

module.exports = new MockPaymentService();