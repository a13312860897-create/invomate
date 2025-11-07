import api from './api';

class PaymentService {
  /**
   * Generate a payment link for an invoice
   * @param {number} invoiceId - The invoice ID
   * @param {string} paymentMethod - Payment method (stripe, paypal, etc.)
   * @returns {Promise} Payment link data
   */
  async generatePaymentLink(invoiceId, paymentMethod = 'stripe') {
    try {
      const response = await api.post(`/invoices/${invoiceId}/payment-link`, {
        paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Generate payment link error:', error);
      throw error;
    }
  }

  /**
   * Get invoice details by payment token (public)
   * @param {string} token - Payment token
   * @returns {Promise} Invoice data
   */
  async getInvoiceByToken(token) {
    try {
      const response = await api.get(`/invoices/payment/${token}`);
      return response.data;
    } catch (error) {
      console.error('Get invoice by token error:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for Stripe using payment token
   * @param {string} token - Payment token
   * @returns {Promise<Object>} API response
   */
  async createPaymentIntentByToken(token) {
    try {
      const response = await api.post(`/invoices/payment/${token}/payment-intent`);
      return response.data;
    } catch (error) {
      console.error('Create payment intent by token error:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for Stripe
   * @param {Object} data - Payment intent data
   * @returns {Promise<Object>} API response
   */
  async createPaymentIntent(data) {
    try {
      const response = await api.post(`/invoices/${data.invoiceId}/payment-intent`, data);
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Confirm a payment with the backend
   * @param {Object} data - Payment confirmation data
   * @returns {Promise<Object>} API response
   */
  async confirmPayment(data) {
    try {
      const response = await api.post('/invoices/payment/confirm', data);
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }

  /**
   * Copy payment link to clipboard
   * @param {string} paymentUrl - The payment URL to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyPaymentLink(paymentUrl) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(paymentUrl);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = paymentUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success;
      }
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      return false;
    }
  }

  /**
   * Share payment link via Web Share API or fallback
   * @param {string} paymentUrl - The payment URL to share
   * @param {object} invoiceData - Invoice data for sharing context
   * @returns {Promise<boolean>} Success status
   */
  async sharePaymentLink(paymentUrl, invoiceData) {
    try {
      const shareData = {
        title: `Facture ${invoiceData.invoiceNumber}`,
        text: `Paiement de la facture ${invoiceData.invoiceNumber} - ${invoiceData.total}€`,
        url: paymentUrl
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback: copy to clipboard
        return await this.copyPaymentLink(paymentUrl);
      }
    } catch (error) {
      console.error('Share payment link error:', error);
      // Fallback: copy to clipboard
      return await this.copyPaymentLink(paymentUrl);
    }
  }

  /**
   * Send payment link via email
   * @param {number} invoiceId - The invoice ID
   * @param {string} paymentUrl - The payment URL
   * @param {string} recipientEmail - Recipient email address
   * @param {string} message - Optional custom message
   * @returns {Promise} Email sending result
   */
  async sendPaymentLinkByEmail(invoiceId, paymentUrl, recipientEmail, message = '') {
    try {
      // This would integrate with your existing email service
      const response = await api.post('/ai/send-invoice-email', {
        invoiceId,
        recipientEmail,
        customMessage: message,
        includePaymentLink: true,
        paymentUrl
      });
      return response.data;
    } catch (error) {
      console.error('Send payment link by email error:', error);
      throw error;
    }
  }
}

export default new PaymentService();