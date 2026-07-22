export function calculateInvoiceBalance(totalAmount: number, payments: Array<{ amount?: number } | null | undefined> = []) {
  const paid = payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0);
  return Math.max(0, totalAmount - paid);
}

export function deriveInvoiceStatus(
  totalAmount: number,
  payments: Array<{ amount?: number } | null | undefined> = [],
  dueDate?: Date | null,
  existingStatus?: string,
) {
  const paid = payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0);
  if (paid >= totalAmount && totalAmount > 0) return 'paid';
  if (existingStatus === 'overdue' || (dueDate && dueDate < new Date() && paid < totalAmount)) return 'overdue';
  return 'pending';
}
