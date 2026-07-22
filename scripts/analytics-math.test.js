const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateInvoiceBalance, deriveInvoiceStatus } = require('../src/lib/invoice-math.js');

test('calculateInvoiceBalance subtracts paid amounts from total', () => {
  assert.equal(calculateInvoiceBalance(100, [{ amount: 30 }, { amount: 20 }]), 50);
  assert.equal(calculateInvoiceBalance(100, [{ amount: 100 }]), 0);
});

test('deriveInvoiceStatus marks invoices as paid or overdue from payments and due dates', () => {
  assert.equal(deriveInvoiceStatus(100, [{ amount: 100 }], null, 'pending'), 'paid');
  assert.equal(
    deriveInvoiceStatus(100, [{ amount: 30 }], new Date('2020-01-01'), 'pending'),
    'overdue',
  );
  assert.equal(
    deriveInvoiceStatus(100, [{ amount: 30 }], new Date('2099-01-01'), 'draft'),
    'pending',
  );
});
