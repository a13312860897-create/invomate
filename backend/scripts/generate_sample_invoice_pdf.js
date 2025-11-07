const fs = require('fs');
const path = require('path');
const { generateInvoicePDFNew } = require('../src/services/pdfServiceNew');

async function run() {
  const outDir = path.join(__dirname, '..', 'generated_pdfs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const baseUser = {
    companyName: 'Société Démo SAS',
    address: '12 Rue de la Paix',
    city: 'Paris',
    postalCode: '75002',
    country: 'France',
    phone: '+33 1 23 45 67 89',
    email: 'demo@example.com',
    vatNumber: 'FR84999999999',
    siren: '123456789',
    siretNumber: '12345678900012',
    legalForm: 'SAS',
    capital: 10000,
    rcsNumber: 'Paris B 123 456 789',
    nafCode: '62.02A',
    Company: {
      currency: 'EUR',
      bankInfo: {
        iban: 'FR76 3000 6000 0112 3456 7890 189',
        bic: 'AGRIFRPP',
        bankName: 'Crédit Agricole',
        accountHolder: 'Société Démo SAS'
      }
    }
  };

  const baseClient = {
    companyName: 'Client Exemple SARL',
    contactName: 'Jean Dupont',
    address: '25 Avenue des Champs-Élysées',
    city: 'Paris',
    postalCode: '75008',
    country: 'France',
    vatNumber: 'FR11999999999'
  };

  const items = [
    { description: 'Prestation de conseil', quantity: 2, unitPrice: 500, tvaRate: 0 },
    { description: 'Développement logiciel', quantity: 1, unitPrice: 1200, tvaRate: 0 }
  ];

  const commonInvoiceProps = {
    currency: 'EUR',
    invoiceDate: new Date().toISOString(),
    serviceDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    items
  };

  // 1) TVA豁免场景（293 B）
  const exemptInvoice = {
    ...commonInvoiceProps,
    tvaExempt: true,
    tvaExemptClause: "TVA non applicable, art. 293 B du CGI",
    paymentTerms: '30 jours'
  };

  // 2) 自清算场景（article 283-1）
  const autoInvoice = {
    ...commonInvoiceProps,
    tvaSelfBilling: true,
    autoLiquidation: true,
    paymentTerms: '30 jours'
  };

  try {
    const resExempt = await generateInvoicePDFNew(exemptInvoice, baseUser, baseClient, 'fr');
    if (!resExempt.success) throw new Error(resExempt.error || 'Exempt PDF failed');
    const fileExempt = path.join(outDir, 'sample-exempt.pdf');
    fs.writeFileSync(fileExempt, resExempt.buffer);
    console.log('Exempt PDF saved:', fileExempt, 'size:', resExempt.buffer.length);

    const resAuto = await generateInvoicePDFNew(autoInvoice, baseUser, baseClient, 'fr');
    if (!resAuto.success) throw new Error(resAuto.error || 'Auto PDF failed');
    const fileAuto = path.join(outDir, 'sample-auto.pdf');
    fs.writeFileSync(fileAuto, resAuto.buffer);
    console.log('Auto-liquidation PDF saved:', fileAuto, 'size:', resAuto.buffer.length);

    console.log('Done. Verify TVA block texts in generated PDFs.');
  } catch (err) {
    console.error('Error generating sample PDFs:', err);
    process.exit(1);
  }
}

run();