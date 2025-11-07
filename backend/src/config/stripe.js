const stripe = require('stripe');

// Stripe configuration
const stripeConfig = {
  // Keys must come from environment variables; no hardcoded defaults
  secretKey: process.env.STRIPE_SECRET_KEY || 'invalid-stripe-key',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'invalid-publishable-key',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'invalid-webhook-secret',
  
  // Stripe API version
  apiVersion: '2023-10-16',
  
  // Default currency
  defaultCurrency: 'eur',
  
  // Payment methods to accept
  paymentMethods: ['card', 'sepa_debit', 'bancontact', 'ideal'],
  
  // Automatic payment methods
  automaticPaymentMethods: {
    enabled: true,
    allow_redirects: 'never'
  }
};

// Initialize Stripe with secret key
const stripeClient = stripe(stripeConfig.secretKey, {
  apiVersion: stripeConfig.apiVersion
});

module.exports = {
  stripeClient,
  stripeConfig
};