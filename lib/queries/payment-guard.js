const PAYMENT_CONFIRMED_STATUSES = new Set([
  'Payment Confirmed',
  'In Manufacturing',
  'Ready to Dispatch',
  'Dispatched',
  'Partially Dispatched',
  'Partially Delivered',
  'Delivered',
]);

export function shouldConfirmPaymentFromWorkflow(order, nextStatus) {
  if (!PAYMENT_CONFIRMED_STATUSES.has(nextStatus)) return false;

  if (order?.payment_provider === 'razorpay') {
    if (order.payment_status !== 'paid') {
      throw new Error(`Verify the captured payment in the Payment card before moving this Razorpay order to ${nextStatus}.`);
    }
    return false;
  }

  return Number(order?.order_value) > 0
    && !['paid', 'manual'].includes(order?.payment_status);
}
