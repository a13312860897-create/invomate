const express = require('express');
const router = express.Router();
const { User, Client, Invoice, Payment, PaymentRecord } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// 引入Stripe库（将在添加依赖后使用）
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// 验证支付数据
const validatePayment = (data) => {
  const schema = Joi.object({
    invoiceId: Joi.number().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().default('EUR'),
    paymentMethod: Joi.string().optional(),
    description: Joi.string().optional()
  });
  return schema.validate(data);
};

// 创建支付意图
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    // 验证请求数据
    const { error } = validatePayment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { invoiceId, amount, currency = 'EUR', paymentMethod, description } = req.body;
    const userId = req.user.id;

    // 检查发票是否存在且属于当前用户
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Client }]
    });

    if (!invoice) {
      return res.status(404).json({ message: '发票不存在' });
    }

    if (invoice.userId !== userId) {
      return res.status(403).json({ message: '无权访问此发票' });
    }

    // 检查发票是否已支付
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: '发票已支付' });
    }

    // 生成支付意图ID
    const paymentIntentId = `pi_${uuidv4()}`;

    // 创建支付记录
    const payment = await Payment.create({
      paymentIntentId,
      amount,
      currency,
      status: 'pending',
      paymentMethod,
      description: description || `支付发票 ${invoice.invoiceNumber}`,
      invoiceId,
      userId
    });

    // 创建支付记录
    await PaymentRecord.create({
      paymentId: payment.id,
      status: 'pending',
      amount,
      currency,
      eventType: 'payment_intent.created',
      description: '支付意图已创建'
    });

    // 在实际应用中，这里会调用Stripe API创建支付意图
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Stripe使用分为单位
    //   currency: currency.toLowerCase(),
    //   payment_method_types: ['card'],
    //   metadata: {
    //     invoiceId: invoiceId,
    //     paymentIntentId: paymentIntentId
    //   }
    // });

    // 返回支付意图信息
    res.status(201).json({
      success: true,
      paymentIntentId,
      clientSecret: `pi_${uuidv4()}_secret_${uuidv4()}`, // 模拟Stripe返回的clientSecret
      amount,
      currency,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        client: invoice.Client.name
      }
    });
  } catch (error) {
    console.error('创建支付意图错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 确认支付成功
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({ message: '支付意图ID不能为空' });
    }

    // 查找支付记录
    const payment = await Payment.findOne({
      where: { paymentIntentId, userId },
      include: [{ model: Invoice }]
    });

    if (!payment) {
      return res.status(404).json({ message: '支付记录不存在' });
    }

    // 更新支付状态
    payment.status = 'succeeded';
    payment.paidAt = new Date();
    await payment.save();

    // 创建支付记录
    await PaymentRecord.create({
      paymentId: payment.id,
      status: 'succeeded',
      amount: payment.amount,
      currency: payment.currency,
      eventType: 'payment_intent.succeeded',
      description: '支付成功'
    });

    // 更新发票状态为已支付
    const invoice = payment.Invoice;
    invoice.status = 'paid';
    await invoice.save();

    res.status(200).json({
      success: true,
      message: '支付成功',
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status
      }
    });
  } catch (error) {
    console.error('确认支付错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 处理支付失败
router.post('/handle-payment-failure', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, failureReason } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({ message: '支付意图ID不能为空' });
    }

    // 查找支付记录
    const payment = await Payment.findOne({
      where: { paymentIntentId, userId }
    });

    if (!payment) {
      return res.status(404).json({ message: '支付记录不存在' });
    }

    // 更新支付状态
    payment.status = 'failed';
    payment.failureReason = failureReason || '未知错误';
    await payment.save();

    // 创建支付记录
    await PaymentRecord.create({
      paymentId: payment.id,
      status: 'failed',
      amount: payment.amount,
      currency: payment.currency,
      eventType: 'payment_intent.payment_failed',
      description: '支付失败',
      failureReason: payment.failureReason
    });

    res.status(200).json({
      success: true,
      message: '支付失败已记录',
      payment: {
        id: payment.id,
        status: payment.status,
        failureReason: payment.failureReason
      }
    });
  } catch (error) {
    console.error('处理支付失败错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取支付历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, invoiceId } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const whereCondition = { userId };
    if (invoiceId) {
      whereCondition.invoiceId = invoiceId;
    }

    // 获取支付记录
    const payments = await Payment.findAll({
      where: whereCondition
    });
    
    // 手动分页
    const count = payments.length;
    const paginatedPayments = payments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + parseInt(limit));
    
    // 为每个支付记录获取关联的发票和客户信息
    const paymentsWithDetails = await Promise.all(
      paginatedPayments.map(async (payment) => {
        const invoice = await Invoice.findOne({ where: { id: payment.invoiceId } });
        if (invoice) {
          const client = await Client.findOne({ where: { id: invoice.clientId } });
          return {
            ...payment,
            Invoice: {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              issueDate: invoice.issueDate,
              dueDate: invoice.dueDate,
              status: invoice.status,
              Client: client ? {
                id: client.id,
                name: client.name,
                email: client.email
              } : null
            }
          };
        }
        return payment;
      })
    );

    // 获取每笔支付的支付记录
    const paymentHistory = await Promise.all(
      paymentsWithDetails.map(async (payment) => {
        const records = await PaymentRecord.findAll({
          where: { paymentId: payment.id }
        });
        
        return {
          ...payment,
          records
        };
      })
    );

    res.status(200).json({
      success: true,
      payments: paymentHistory,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取支付历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个支付详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取支付记录
    const payment = await Payment.findOne({
      where: { id, userId }
    });
    
    if (payment) {
      // 获取关联的发票信息
      const invoice = await Invoice.findOne({ where: { id: payment.invoiceId } });
      if (invoice) {
        // 获取关联的客户信息
        const client = await Client.findOne({ where: { id: invoice.clientId } });
        if (client) {
          payment.Invoice = {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            status: invoice.status,
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            total: invoice.total,
            Client: {
              id: client.id,
              name: client.name,
              email: client.email,
              company: client.company
            }
          };
        }
      }
    }

    if (!payment) {
      return res.status(404).json({ message: '支付记录不存在' });
    }

    // 获取支付记录
    const records = await PaymentRecord.findAll({
      where: { paymentId: payment.id },
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      payment: {
        ...payment.toJSON(),
        records
      }
    });
  } catch (error) {
    console.error('获取支付详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// Stripe Webhook处理
router.post('/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    // 在实际应用中，这里会验证webhook签名
    // try {
    //   event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // } catch (err) {
    //   console.log(`Webhook signature verification failed.`, err.message);
    //   return res.status(400).send(`Webhook Error: ${err.message}`);
    // }

    // 模拟Stripe事件
    event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_${uuidv4()}`,
          amount: 1000,
          currency: 'usd',
          metadata: {
            invoiceId: '1',
            paymentIntentId: `pi_${uuidv4()}`
          }
        }
      }
    };

    // 处理事件
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;
      case 'charge.refunded':
        const charge = event.data.object;
        await handleRefund(charge);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // 返回响应
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook处理错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 处理支付成功
async function handlePaymentSuccess(paymentIntent) {
  try {
    const paymentIntentId = paymentIntent.metadata.paymentIntentId;
    
    // 查找支付记录
    const payment = await Payment.findOne({
      where: { paymentIntentId }
    });

    if (!payment) {
      console.log('支付记录不存在:', paymentIntentId);
      return;
    }

    // 更新支付状态
    payment.status = 'succeeded';
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.paidAt = new Date();
    await payment.save();

    // 创建支付记录
    await PaymentRecord.create({
      paymentId: payment.id,
      status: 'succeeded',
      amount: payment.amount,
      currency: payment.currency,
      eventType: 'payment_intent.succeeded',
      description: '支付成功',
      stripeEventId: paymentIntent.id
    });

    // 更新发票状态为已支付
    const invoice = await Invoice.findByPk(payment.invoiceId);
    if (invoice) {
      invoice.status = 'paid';
      await invoice.save();
    }
  } catch (error) {
    console.error('处理支付成功错误:', error);
  }
}

// 处理支付失败
async function handlePaymentFailure(paymentIntent) {
  try {
    const paymentIntentId = paymentIntent.metadata.paymentIntentId;
    
    // 查找支付记录
    const payment = await Payment.findOne({
      where: { paymentIntentId }
    });

    if (!payment) {
      console.log('支付记录不存在:', paymentIntentId);
      return;
    }

    // 更新支付状态
    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error?.message || '未知错误';
    await payment.save();

    // 创建支付记录
    await PaymentRecord.create({
      paymentId: payment.id,
      status: 'failed',
      amount: payment.amount,
      currency: payment.currency,
      eventType: 'payment_intent.payment_failed',
      description: '支付失败',
      failureReason: payment.failureReason,
      stripeEventId: paymentIntent.id
    });
  } catch (error) {
    console.error('处理支付失败错误:', error);
  }
}

// 处理退款
async function handleRefund(charge) {
  try {
    // 在实际应用中，这里会处理退款逻辑
    console.log('处理退款:', charge.id);
  } catch (error) {
    console.error('处理退款错误:', error);
  }
}

module.exports = router;