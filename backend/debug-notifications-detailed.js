const memoryDb = require('./src/config/memoryDatabase');

console.log('=== Detailed Notifications Debug ===');
const now = new Date();
const userId = 1;
console.log('Current time:', now);
console.log('User ID:', userId);

// 手动更新逾期状态
console.log('\n=== Updating overdue status ===');
memoryDb.invoices.forEach(invoice => {
  if (invoice.status === 'sent' && invoice.dueDate) {
    const dueDate = new Date(invoice.dueDate);
    if (now > dueDate) {
      console.log(`Updating invoice ${invoice.invoiceNumber} from ${invoice.status} to overdue`);
      invoice.status = 'overdue';
    }
  }
});

console.log('\n=== All Invoices After Update ===');
memoryDb.invoices.forEach(invoice => {
  console.log(`ID: ${invoice.id}, Number: ${invoice.invoiceNumber}, Status: ${invoice.status}, DueDate: ${invoice.dueDate}, UserID: ${invoice.userId}`);
});

console.log('\n=== Filtering Overdue Invoices ===');
const overdueInvoices = memoryDb.invoices.filter(invoice => {
  console.log(`\nChecking invoice ${invoice.invoiceNumber}:`);
  console.log(`  - UserID match: ${invoice.userId} === ${userId} = ${invoice.userId === userId}`);
  console.log(`  - Status check: ${invoice.status} in ['sent', 'overdue'] = ${['sent', 'overdue'].includes(invoice.status)}`);
  console.log(`  - Has dueDate: ${!!invoice.dueDate}`);
  
  if (invoice.userId !== userId) {
    console.log(`  - SKIP: UserID mismatch`);
    return false;
  }
  if (!['sent', 'overdue'].includes(invoice.status)) {
    console.log(`  - SKIP: Status not sent/overdue`);
    return false;
  }
  if (!invoice.dueDate) {
    console.log(`  - SKIP: No dueDate`);
    return false;
  }
  
  const dueDate = new Date(invoice.dueDate);
  const isOverdue = now > dueDate;
  console.log(`  - Due date: ${dueDate}`);
  console.log(`  - Is overdue: ${isOverdue}`);
  
  if (isOverdue) {
    console.log(`  - INCLUDE: Invoice is overdue`);
  } else {
    console.log(`  - SKIP: Invoice not overdue`);
  }
  
  return isOverdue;
});

console.log(`\n=== Found ${overdueInvoices.length} overdue invoices ===`);
overdueInvoices.forEach(invoice => {
  const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
  console.log(`- ${invoice.invoiceNumber}: ${daysOverdue} days overdue`);
});

console.log('\n=== Filtering Due Soon Invoices ===');
const dueSoonInvoices = memoryDb.invoices.filter(invoice => {
  console.log(`\nChecking due soon for invoice ${invoice.invoiceNumber}:`);
  console.log(`  - UserID match: ${invoice.userId} === ${userId} = ${invoice.userId === userId}`);
  console.log(`  - Status is sent: ${invoice.status} === 'sent' = ${invoice.status === 'sent'}`);
  console.log(`  - Has dueDate: ${!!invoice.dueDate}`);
  
  if (invoice.userId !== userId) {
    console.log(`  - SKIP: UserID mismatch`);
    return false;
  }
  if (invoice.status !== 'sent') {
    console.log(`  - SKIP: Status not sent`);
    return false;
  }
  if (!invoice.dueDate) {
    console.log(`  - SKIP: No dueDate`);
    return false;
  }
  
  const dueDate = new Date(invoice.dueDate);
  const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  console.log(`  - Due date: ${dueDate}`);
  console.log(`  - Days until due: ${daysUntilDue}`);
  
  const isDueSoon = daysUntilDue > 0 && daysUntilDue <= 7;
  console.log(`  - Is due soon (0 < days <= 7): ${isDueSoon}`);
  
  if (isDueSoon) {
    console.log(`  - INCLUDE: Invoice is due soon`);
  } else {
    console.log(`  - SKIP: Invoice not due soon`);
  }
  
  return isDueSoon;
});

console.log(`\n=== Found ${dueSoonInvoices.length} due soon invoices ===`);
dueSoonInvoices.forEach(invoice => {
  const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - now) / (1000 * 60 * 60 * 24));
  console.log(`- ${invoice.invoiceNumber}: due in ${daysUntilDue} days`);
});