import { createHash, randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local', quiet: true });

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3101';
const apiKey = process.env.HEALINGSOIL_API_KEY;
const sql = neon(process.env.DATABASE_URL);
if (!apiKey) throw new Error('HEALINGSOIL_API_KEY is not set');

const headers = { 'content-type': 'application/json', 'x-api-key': apiKey };
const marker = randomUUID().replaceAll('-', '').slice(0, 16);
const email = `payment-test-${marker}@example.invalid`;
const sessionOne = randomUUID();
const sessionTwo = randomUUID();
const concurrentSession = randomUUID();
const fingerprint = createHash('sha256').update(`checkout-${marker}`).digest('hex');
const changedFingerprint = createHash('sha256').update(`changed-${marker}`).digest('hex');
const providerOne = `order_Test${marker}A`;
const providerRace = `order_Test${marker}B`;
const providerTwo = `order_Test${marker}C`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

let createdOrderIds = [];
try {
  const [product] = await sql`SELECT id, unit_price FROM products WHERE is_active = true ORDER BY created_at LIMIT 1`;
  if (!product) throw new Error('No active product available for test');
  const basePayload = {
    customer: { name: 'Payment Robustness Test', phone: '919876543210', email, address: 'Test address, Karnataka' },
    items: [{ product_id: product.id, qty: 1, price: Number(product.unit_price) }],
    shipping: 0,
    source: 'Website',
  };

  const first = await post('/api/orders/incoming', {
    ...basePayload,
    payment: { provider: 'razorpay', provider_order_id: providerOne, checkout_session_id: sessionOne, checkout_fingerprint: fingerprint },
  });
  assert(first.response.ok, `Initial order failed: ${first.response.status}`);
  createdOrderIds.push(first.data.order_id);

  const duplicate = await post('/api/orders/incoming', {
    ...basePayload,
    payment: { provider: 'razorpay', provider_order_id: providerRace, checkout_session_id: sessionOne, checkout_fingerprint: fingerprint },
  });
  assert(duplicate.response.ok, `Idempotent retry failed: ${duplicate.response.status}`);
  assert(duplicate.data.order_id === first.data.order_id, 'Same checkout session created a duplicate SoapLedger order');
  assert(duplicate.data.provider_order_id === providerOne, 'Retry did not return the winning Razorpay order');

  const changed = await post('/api/orders/incoming', {
    ...basePayload,
    payment: { provider: 'razorpay', provider_order_id: providerRace, checkout_session_id: sessionOne, checkout_fingerprint: changedFingerprint },
  });
  assert(changed.response.status === 409, 'Changed checkout reused an existing session');

  const second = await post('/api/orders/incoming', {
    ...basePayload,
    payment: { provider: 'razorpay', provider_order_id: providerTwo, checkout_session_id: sessionTwo, checkout_fingerprint: changedFingerprint },
  });
  assert(second.response.ok, `Second genuine order failed: ${second.response.status}`);
  assert(second.data.order_id !== first.data.order_id, 'Different checkout session was incorrectly deduplicated by customer');
  createdOrderIds.push(second.data.order_id);

  const concurrent = await Promise.all(Array.from({ length: 5 }, (_, index) => post('/api/orders/incoming', {
    ...basePayload,
    payment: {
      provider: 'razorpay',
      provider_order_id: `order_Test${marker}R${index}`,
      checkout_session_id: concurrentSession,
      checkout_fingerprint: fingerprint,
    },
  })));
  assert(concurrent.every(({ response }) => response.ok), 'A concurrent checkout request failed');
  const concurrentOrderIds = new Set(concurrent.map(({ data }) => data.order_id));
  const concurrentProviderIds = new Set(concurrent.map(({ data }) => data.provider_order_id));
  assert(concurrentOrderIds.size === 1, 'Concurrent checkout created duplicate SoapLedger orders');
  assert(concurrentProviderIds.size === 1, 'Concurrent checkout exposed more than one Razorpay order');
  createdOrderIds.push(concurrent[0].data.order_id);

  const paymentOne = `pay_Test${marker}A`;
  const paymentTwo = `pay_Test${marker}B`;
  const paymentThree = `pay_Test${marker}C`;
  for (const [paymentId, reason] of [[paymentOne, 'timeout'], [paymentTwo, 'bank_declined']]) {
    const failed = await post('/api/orders/payment', {
      action: 'failed', provider_order_id: providerOne, provider_payment_id: paymentId,
      failure_reason: reason,
      failure_details: { payment_id: paymentId, method: 'upi', reason },
      payment_details: { status: 'failed', method: 'upi', amount_paise: Math.round(Number(product.unit_price) * 100), currency: 'INR' },
    });
    assert(failed.response.ok, `Failure attempt was not recorded: ${failed.response.status}`);
  }

  // Simulate an owner manually advancing fulfilment before a delayed captured
  // webhook arrives. Payment confirmation must not rewind that workflow.
  await sql`UPDATE orders SET status = 'In Manufacturing' WHERE id = ${first.data.order_id}`;
  await sql`UPDATE shipments SET status = 'In Manufacturing' WHERE order_id = ${first.data.order_id}`;

  const confirmed = await post('/api/orders/payment', {
    action: 'confirm', provider_order_id: providerOne, provider_payment_id: paymentThree,
    payment_details: { status: 'captured', method: 'upi', amount_paise: Math.round(Number(product.unit_price) * 100), currency: 'INR' },
  });
  assert(confirmed.response.ok && confirmed.data.transitioned === true, 'Captured attempt did not confirm order exactly once');

  const duplicateConfirm = await post('/api/orders/payment', {
    action: 'confirm', provider_order_id: providerOne, provider_payment_id: paymentThree,
    payment_details: { status: 'captured', method: 'upi' },
  });
  assert(duplicateConfirm.response.ok && duplicateConfirm.data.transitioned === false, 'Duplicate capture was not idempotent');

  await post('/api/orders/payment', {
    action: 'failed', provider_order_id: providerOne, provider_payment_id: paymentThree,
    failure_reason: 'late failure webhook', failure_details: { payment_id: paymentThree, reason: 'late' },
  });

  const [order] = await sql`SELECT status, payment_status, provider_payment_id FROM orders WHERE id = ${first.data.order_id}`;
  const attempts = await sql`SELECT provider_payment_id, status FROM payment_attempts WHERE order_id = ${first.data.order_id} ORDER BY provider_payment_id`;
  assert(order.payment_status === 'paid' && order.provider_payment_id === paymentThree, 'Late failure regressed the paid order');
  assert(order.status === 'In Manufacturing', 'Payment confirmation rewound the fulfilment workflow');
  assert(attempts.length === 3, `Expected 3 payment attempts, found ${attempts.length}`);
  assert(attempts.find((attempt) => attempt.provider_payment_id === paymentThree)?.status === 'captured', 'Late failure regressed captured attempt');

  console.log(JSON.stringify({
    passed: true,
    same_session_orders: 1,
    different_session_orders: 3,
    concurrent_requests_serialized: concurrent.length,
    attempts_preserved: attempts.length,
    late_failure_regression_blocked: true,
    fulfilment_workflow_preserved: true,
  }));
} finally {
  if (createdOrderIds.length > 0) await sql`DELETE FROM orders WHERE id = ANY(${[...new Set(createdOrderIds)]})`;
  await sql`DELETE FROM customers WHERE email = ${email}`;
}
