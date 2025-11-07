// Set test port to avoid conflicts
process.env.PORT = '8082';

const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { User, Invoice, Client } = require('../models');

describe('Settings Data Sync Tests', () => {
  let authToken;
  let testUser;
  let testClient;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      username: 'testsync',
      email: 'testsync@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      emailVerified: true
    });

    // Create test client
    testClient = await Client.create({
      userId: testUser.id,
      name: 'Test Client',
      email: 'client@test.com',
      company: 'Client Company',
      address: '456 Client St'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Cleanup
    await Invoice.destroy({ where: { userId: testUser.id } });
    await Client.destroy({ where: { id: testClient.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  test('should create invoice with unified settings data', async () => {
    const invoiceData = {
      clientId: testClient.id,
      items: [
        {
          description: 'Test Service',
          quantity: 1,
          unitPrice: 1000,
          taxRate: 20
        }
      ],
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      subtotal: 1000,
      taxAmount: 200,
      total: 1200,
      status: 'draft',
      settings: {
        invoiceMode: 'fr',
        modeConfig: {
          fr: {
            companyName: 'French Company Name',
            companyAddress: '123 Rue de Paris, 75001 Paris',
            taxId: 'FR12345678901',
            siren: '123456789',
            siret: '12345678901234',
            phone: '+33123456789',
            email: 'contact@frenchcompany.com',
            nafCode: '6201Z',
            rcsNumber: 'RCS Paris 123456789',
            legalForm: 'SARL',
            capital: 10000,
            tvaExempt: false
          }
        }
      }
    };

    const response = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invoiceData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.invoice).toBeDefined();
    
    const createdInvoice = response.body.data.invoice;
    
    // Verify unified settings data is stored in invoice
    expect(createdInvoice.sellerCompanyName).toBe('French Company Name');
    expect(createdInvoice.sellerCompanyAddress).toBe('123 Rue de Paris, 75001 Paris');
    expect(createdInvoice.sellerTaxId).toBe('FR12345678901');
    expect(createdInvoice.sellerSiren).toBe('123456789');
    expect(createdInvoice.sellerSiret).toBe('12345678901234');
    expect(createdInvoice.sellerPhone).toBe('+33123456789');
    expect(createdInvoice.sellerEmail).toBe('contact@frenchcompany.com');
    expect(createdInvoice.sellerNafCode).toBe('6201Z');
    expect(createdInvoice.sellerRcsNumber).toBe('RCS Paris 123456789');
    expect(createdInvoice.sellerLegalForm).toBe('SARL');
    expect(createdInvoice.sellerRegisteredCapital).toBe(10000);
    expect(createdInvoice.tvaExempt).toBe(false);
  });

  test('should use fallback to user data when settings not provided', async () => {
    const invoiceData = {
      clientId: testClient.id,
      items: [
        {
          description: 'Test Service 2',
          quantity: 1,
          unitPrice: 500,
          taxRate: 20
        }
      ],
      issueDate: '2024-01-16',
      dueDate: '2024-02-16',
      subtotal: 500,
      taxAmount: 100,
      total: 600,
      status: 'draft'
      // No settings provided
    };

    const response = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invoiceData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.invoice).toBeDefined();
    
    const createdInvoice = response.body.data.invoice;
    
    // Should not have seller data when no settings provided
    expect(createdInvoice.sellerCompanyName).toBeUndefined();
    expect(createdInvoice.sellerCompanyAddress).toBeUndefined();
  });

  test('PDF generation should use unified data structure', async () => {
    // First create an invoice with settings
    const invoiceData = {
      clientId: testClient.id,
      items: [
        {
          description: 'PDF Test Service',
          quantity: 1,
          unitPrice: 2000,
          taxRate: 20
        }
      ],
      issueDate: '2024-01-17',
      dueDate: '2024-02-17',
      subtotal: 2000,
      taxAmount: 400,
      total: 2400,
      status: 'draft',
      settings: {
        invoiceMode: 'fr',
        modeConfig: {
          fr: {
            companyName: 'PDF Test Company',
            companyAddress: '789 PDF Street, 75002 Paris',
            taxId: 'FR98765432109',
            siren: '987654321',
            siret: '98765432109876',
            phone: '+33987654321',
            email: 'pdf@test.com',
            nafCode: '6202A',
            rcsNumber: 'RCS Lyon 987654321',
            legalForm: 'SA',
            registeredCapital: 50000,
            tvaExempt: true
          }
        }
      }
    };

    const createResponse = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invoiceData);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toBeDefined();
    expect(createResponse.body.data.invoice).toBeDefined();
    const invoiceId = createResponse.body.data.invoice.id;

    // Generate PDF
    const pdfResponse = await request(app)
      .get(`/api/invoices/${invoiceId}/pdf`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers['content-type']).toBe('application/pdf');
  });
});