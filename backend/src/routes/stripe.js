const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Stripe Webhook处理器
 * 处理支付状态更新事件
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    console.log('Stripe webhook received');

    // 验证webhook签名
    const webhookResult = await stripeService.handleWebhook(payload, signature);
    
    if (!webhookResult.success) {
      console.error('Webhook verification failed:', webhookResult.error);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const { type, object } = webhookResult.data;
    console.log(`Processing Stripe webhook event: ${type}`);

    // 处理不同类型的事件
    switch (type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(object);
        break;
      
      default:
        console.log(`Unhandled Stripe webhook event type: ${type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed', message: error.message });
  }
});

/**
 * 处理支付成功事件
 */
async function handlePaymentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment succeeded:', paymentIntent.id);
    
    // 从metadata中获取发票ID
    const invoiceId = paymentIntent.metadata?.invoiceId;
    
    if (!invoiceId) {
      console.warn('No invoice ID found in payment intent metadata');
      return;
    }

    // 更新发票状态为已支付
    const updatedInvoice = await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        updatedAt: new Date()
      }
    });

    console.log(`Invoice ${invoiceId} marked as paid via Stripe`);

    // 可以在这里添加其他业务逻辑，比如发送支付确认邮件
    // await sendPaymentConfirmationEmail(updatedInvoice);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

/**
 * 处理支付失败事件
 */
async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('Processing payment failed:', paymentIntent.id);
    
    const invoiceId = paymentIntent.metadata?.invoiceId;
    
    if (!invoiceId) {
      console.warn('No invoice ID found in payment intent metadata');
      return;
    }

    // 可以记录支付失败日志或发送通知
    console.log(`Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);

    // 可以在这里添加其他业务逻辑，比如发送支付失败通知
    // await sendPaymentFailedNotification(invoiceId, paymentIntent.last_payment_error);

  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

/**
 * 处理支付取消事件
 */
async function handlePaymentCanceled(paymentIntent) {
  try {
    console.log('Processing payment canceled:', paymentIntent.id);
    
    const invoiceId = paymentIntent.metadata?.invoiceId;
    
    if (!invoiceId) {
      console.warn('No invoice ID found in payment intent metadata');
      return;
    }

    console.log(`Payment canceled for invoice ${invoiceId}`);

    // 可以在这里添加其他业务逻辑，比如发送支付取消通知
    // await sendPaymentCanceledNotification(invoiceId);

  } catch (error) {
    console.error('Error handling payment canceled:', error);
    throw error;
  }
}

module.exports = router;