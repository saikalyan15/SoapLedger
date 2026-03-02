// Business Logic Constants
export const DEFAULT_PACKAGING_COST = 100;
export const FREE_SHIPPING_THRESHOLD = 1000;
export const SHIPPING_CHARGE_BELOW = 100;

// Order Statuses
export const ORDER_STATUSES = [
  'Order Placed',
  'Awaiting Payment',
  'Payment Confirmed',
  'In Manufacturing',
  'Ready to Dispatch',
  'Dispatched',
  'Delivered',
  'Cancelled'
];

// Statuses where Edit and Delete are allowed
export const EDITABLE_STATUSES = [
  'Order Placed',
  'Awaiting Payment',
  'Payment Confirmed',
  'In Manufacturing',
  'Ready to Dispatch'
];

// Product Units
export const PRODUCT_UNITS = ['kg', 'g', 'ml', 'pieces'];
