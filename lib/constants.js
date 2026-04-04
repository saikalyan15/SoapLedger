// Business Logic Constants
export const DEFAULT_PACKAGING_COST = 100;
export const FREE_SHIPPING_THRESHOLD = 1000;
export const SHIPPING_CHARGE_BELOW = 100;

// All statuses that can appear on an order (including view-derived partial states)
export const ORDER_STATUSES = [
  'Order Placed',
  'Awaiting Payment',
  'Payment Confirmed',
  'In Manufacturing',
  'Ready to Dispatch',
  'Dispatched',
  'Partially Dispatched',
  'Partially Delivered',
  'Delivered',
  'Cancelled'
];

// Statuses a user can manually set (no derived partial states)
export const SETTABLE_STATUSES = [
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

// Order Sources — where orders originate
export const ORDER_SOURCES = [
  'Instagram',
  'Website',
  'WhatsApp',
  'Referral',
  'Other'
];
