const memoryDb = require('./src/config/memoryDatabase');

console.log('=== Debug Notifications ===');
console.log('Current time:', new Date());

// 手动更新逾期状态
const now = new Date();
memoryDb.invoices.forEach(invoice => {
  if (invoice.status === 'sent' && invoice.dueDate) {
    const dueDate = new Date(invoice.dueDate);
    if (now > dueDate) {
      console.log(`Updating invoice ${invoice.invoiceNumber} from ${invoice.status} to overdue`);
      invoice.status = 'overdue';
    }
  }
});

console.log('\n=== All Invoices ===');
memoryDb.invoices.forEach(invoice => {
  console.log(`${invoice.invoiceNumber}: status=${invoice.status}, dueDate=${invoice.dueDate}`);
});

console.log('\n=== Overdue Invoices ===');
const overdueInvoices = memoryDb.invoices.filter(invoice => {
  if (invoice.status !== 'overdue' && invoice.status !== 'sent') return false;
  if (!invoice.dueDate) return false;
  
  const dueDate = new Date(invoice.dueDate);
  const isOverdue = now > dueDate;
  
  console.log(`Checking ${invoice.invoiceNumber}: dueDate=${dueDate}, now=${now}, isOverdue=${isOverdue}`);
  
  return isOverdue;
});

console.log(`Found ${overdueInvoices.length} overdue invoices:`);
overdueInvoices.forEach(invoice => {
  const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
  console.log(`- ${invoice.invoiceNumber}: ${daysOverdue} days overdue`);
});