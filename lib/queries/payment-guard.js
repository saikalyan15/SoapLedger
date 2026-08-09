const PAYMENT_REQUIRED_STATUSES = new Set([
  'Payment Confirmed',
  'In Manufacturing',
  'Ready to Dispatch',
  'Dispatched',
  'Delivered',
]);

export function assertRazorpayCanAdvance(order, nextStatus) {
  const unresolvedRazorpayPayment = order?.payment_provider === 'razorpay'
    && !['paid', 'manual'].includes(order.payment_status);
  if (unresolvedRazorpayPayment && PAYMENT_REQUIRED_STATUSES.has(nextStatus)) {
    throw new Error(`Verify the captured payment in the Payment card before moving this Razorpay order to ${nextStatus}.`);
  }
}
