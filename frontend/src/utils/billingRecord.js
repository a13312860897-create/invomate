export function appendLocalBillingRecord({
  id,
  amountCents,
  currency = 'EUR',
  description = '订阅付款',
  status = 'paid',
  billedAt,
  invoiceNumber,
  receiptUrl = null,
}) {
  try {
    const now = new Date();
    const recordId = id || `tx-${now.getTime()}`;
    const timestamp = billedAt || now.toISOString();
    const number = invoiceNumber || `INV-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getTime()}`;

    const raw = localStorage.getItem('mockBillingHistory');
    const list = raw ? JSON.parse(raw) : [];
    if (list.some(item => item.id === recordId)) return;

    list.unshift({
      id: recordId,
      billedAt: timestamp,
      description,
      status,
      amount: amountCents,
      currency,
      invoiceNumber: number,
      receiptUrl,
    });

    localStorage.setItem('mockBillingHistory', JSON.stringify(list));
  } catch (e) {
    console.warn('Append local billing record failed:', e);
  }
}