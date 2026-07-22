function calculateInvoiceBalance(totalAmount, payments = []) {
  const paid = payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0);
  return Math.max(0, totalAmount - paid);
}

function deriveInvoiceStatus(totalAmount, payments = [], dueDate, existingStatus) {
  const paid = payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0);
  if (paid >= totalAmount && totalAmount > 0) return 'paid';
  if (existingStatus === 'overdue' || (dueDate && dueDate < new Date() && paid < totalAmount)) return 'overdue';
  return 'pending';
}

module.exports = {
  calculateInvoiceBalance,
  deriveInvoiceStatus,
};
