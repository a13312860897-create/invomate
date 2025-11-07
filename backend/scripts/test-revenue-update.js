const fetch = require('node-fetch');
const { DateTime } = require('luxon');

async function testRevenueUpdate() {
  try {
    // Step 1: Login to get token
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a133128860897@163.com', password: 'Ddtb959322' })
    });
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    const token = loginData.data.token;
    console.log('Token acquired:', token);

    // Step 2: Get initial revenue trend
    const initialRevenueResponse = await fetch(`http://localhost:3002/api/dashboard/unified-chart-data?month=${DateTime.now().toFormat('yyyy-MM')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const initialData = await initialRevenueResponse.json();
    console.log('Initial revenue data:', initialData);

    const initialRevenue = initialData.data.revenueTrend.totalRevenue || 0;
    console.log('Initial revenue:', initialRevenue);

    // Step 3: Create a new paid invoice
    const newInvoice = {
      clientId: 1, // Assume client ID 1 exists
      invoiceNumber: `INV-${DateTime.now().toFormat('yyyyMM')}-TEST`,
      issueDate: DateTime.now().toISODate(),
      dueDate: DateTime.now().plus({ days: 30 }).toISODate(),
      status: 'paid',
      paidDate: DateTime.now().toISODate(),
      totalAmount: 100.00,
      currency: 'USD',
      items: [{ description: 'Test Item', quantity: 1, unitPrice: 100, taxRate: 0 }]
    };
    const createResponse = await fetch('http://localhost:3002/api/invoices', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newInvoice)
    });
    const createData = await createResponse.json();
    console.log('New invoice created:', createData);

    // Step 4: Get updated revenue trend
    const updatedRevenueResponse = await fetch(`http://localhost:3002/api/dashboard/unified-chart-data?month=${DateTime.now().toFormat('yyyy-MM')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedData = await updatedRevenueResponse.json();
    console.log('Updated revenue data:', updatedData);

    const updatedRevenue = updatedData.data.revenueTrend.totalRevenue || 0;
    console.log('Updated revenue:', updatedRevenue);

    // Step 5: Verify update
    if (updatedRevenue === initialRevenue + 100) {
      console.log('Test passed: Revenue updated correctly.');
    } else {
      console.error('Test failed: Revenue did not update as expected.');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testRevenueUpdate();