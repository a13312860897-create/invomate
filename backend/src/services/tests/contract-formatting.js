/**
 * 契约测试：验证金额/税率格式与公司映射在前后端的一致性（以法国模式为基准）
 * 运行方式：node src/services/tests/contract-formatting.js
 */

const assert = require('assert');
const { formatCurrency, formatPercentage, generateInvoiceNumber, getDeliveryAddress } = require('../pdfServiceNew');
const { formatCurrencyUnified, formatPercentageUnified, mapCompanyLegalInfo } = require('../../utils/normalizers');

function normalizeSpaces(str) {
  return String(str || '').replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ').trim();
}

async function run() {
  const invoiceMode = 'fr';
  const currency = 'EUR';

  const user = {
    companyName: 'ACME SAS',
    address: '123 Rue de Paris',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    phone: '+33 1 23 45 67 89',
    email: 'billing@acme.com',
    vatNumber: 'FR12345678901',
    sirenNumber: '123456789',
    siretNumber: '12345678900011',
    legalForm: 'SAS',
    registeredCapital: 10000,
    rcsNumber: 'Paris B 123 456 789',
    nafCode: '62.01Z',
    Company: { currency }
  };

  const client = {
    companyName: 'Client SARL',
    contactName: 'Jean Dupont',
    address: '45 Avenue de Lyon',
    city: 'Lyon',
    postalCode: '69001',
    country: 'France',
    vatNumber: 'FR98765432109'
  };

  const invoice = {
    currency,
    invoiceNumber: 'INV-2025-005',
    invoiceDate: '2025-11-01',
    serviceDate: '2025-11-01',
    dueDate: '2025-11-30',
    deliveryAddressSameAsBilling: true,
    items: [
      { description: 'Développement', quantity: 2, unitPrice: 150, taxRate: 20 },
      { description: 'Maintenance', quantity: 3, unitPrice: 80, taxRate: 10 }
    ]
  };

  // 1) 金额格式一致性
  const amountsToTest = [0, 12.5, 1000, 123456.78];
  amountsToTest.forEach((amt) => {
    const unified = normalizeSpaces(formatCurrencyUnified(amt, currency, invoiceMode));
    const backend = normalizeSpaces(formatCurrency(amt, currency));
    assert.strictEqual(unified, backend, `formatCurrency mismatch for ${amt}: unified='${unified}', backend='${backend}'`);
  });

  // 2) 税率格式一致性
  const ratesToTest = [0, 5.5, 10, 20];
  ratesToTest.forEach((rate) => {
    const unified = formatPercentageUnified(rate, invoiceMode);
    const backend = formatPercentage(rate);
    assert.strictEqual(unified, backend, `formatPercentage mismatch for ${rate}: unified='${unified}', backend='${backend}'`);
  });

  // 3) 发票编号法国模式转换
  const converted = generateInvoiceNumber(invoice, invoiceMode);
  assert.ok(converted.startsWith('FR-'), `Invoice number not converted to FR format: ${converted}`);

  // 4) 公司/法律信息映射
  const mapped = mapCompanyLegalInfo(user);
  assert.strictEqual(mapped.companyName, 'ACME SAS');
  assert.strictEqual(mapped.vatNumber, 'FR12345678901');
  assert.strictEqual(mapped.siren, '123456789');
  assert.strictEqual(mapped.siret, '12345678900011');
  assert.strictEqual(mapped.legalForm, 'SAS');
  assert.strictEqual(mapped.registeredCapital, 10000);
  assert.strictEqual(mapped.rcsNumber, 'Paris B 123 456 789');
  assert.strictEqual(mapped.nafCode, '62.01Z');

  // 5) 交付地址优先级：same as billing
  const delivery = getDeliveryAddress(invoice, client);
  assert.ok(delivery.hasDeliveryAddress, 'Delivery address should exist');
  assert.ok(delivery.address.includes('France'), 'Delivery address should include country');

  console.log('[Contract] 所有断言通过：金额与税率格式、公司映射与交付地址逻辑一致。');
}

run().catch((err) => {
  console.error('[Contract] 测试失败:', err.message);
  process.exit(1);
});