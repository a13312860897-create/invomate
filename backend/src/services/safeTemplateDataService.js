const templateDataService = require('./templateDataService');

function safeStandardizeInvoiceDataOnly(raw) {
  try {
    return templateDataService.standardizeInvoiceDataOnly(raw);
  } catch (e) {
    const { invoiceData = {}, userData = {}, clientData = {}, items = [], totals = {}, legalNotes = {} } = raw || {};

    const company = {
      name: userData.name || 'Demo Company',
      address: userData.address || 'N/A',
      postalCode: userData.postalCode || '00000',
      city: userData.city || 'N/A',
      country: userData.country || 'FR',
      legalForm: userData.legalForm || 'SAS',
      siret: userData.siret || '',
      vatNumber: userData.vatNumber || userData.tvaNumber || ''
    };

    const client = {
      name: clientData.name || 'Client Demo',
      address: clientData.address || 'N/A',
      postalCode: clientData.postalCode || '00000',
      city: clientData.city || 'N/A',
      country: clientData.country || 'FR',
      type: clientData.type || templateDataService.determineClientType?.(clientData) || 'company',
      vatNumber: clientData.vatNumber || clientData.tvaNumber || ''
    };

    const invoice = {
      id: invoiceData.id || invoiceData.number || 'INV-DEMO',
      date: invoiceData.date || new Date().toISOString().slice(0, 10),
      dueDate: invoiceData.dueDate || new Date().toISOString().slice(0, 10),
      currency: invoiceData.currency || 'EUR',
      notes: invoiceData.notes || ''
    };

    const baseItems = Array.isArray(items) ? items : (Array.isArray(invoiceData.items) ? invoiceData.items : []);
    const normalizedItems = baseItems.map((it, idx) => ({
      description: it.description || `Item ${idx + 1}`,
      quantity: it.quantity != null ? it.quantity : 1,
      unitPrice: it.unitPrice != null ? it.unitPrice : (it.price != null ? it.price : 0),
      tvaRate: it.tvaRate != null ? it.tvaRate : 20
    }));

    const computedSubtotal = normalizedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const computedTax = normalizedItems.reduce((sum, it) => sum + it.quantity * it.unitPrice * (it.tvaRate / 100), 0);
    const computedTotal = computedSubtotal + computedTax;

    const totalsFinal = {
      subtotal: totals.subtotal != null ? totals.subtotal : computedSubtotal,
      tax: totals.tax != null ? totals.tax : computedTax,
      total: totals.total != null ? totals.total : computedTotal
    };

    return {
      company,
      client,
      invoice,
      items: normalizedItems,
      totals: totalsFinal,
      legalNotes: legalNotes || {}
    };
  }
}

module.exports = { safeStandardizeInvoiceDataOnly };