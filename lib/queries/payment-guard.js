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
  return Number(order?.order_value) > 0
    && !['paid', 'manual'].includes(order?.payment_status)
    && PAYMENT_CONFIRMED_STATUSES.has(nextStatus);
}
