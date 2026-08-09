/**
 * Regression check: confirms every database-backed API route rejects
 * unauthenticated requests.
 *
 * Why this exists: on 25 Jul 2026, middleware.ts skipped auth for all of /api
 * on the assumption that routes "have their own API key logic." Only 2 of 8
 * did. The other 6 - including /api/backup/export, which returns the entire
 * customer database - were reachable by anyone with the URL, no credentials
 * required.
 *
 * middleware.ts was rewritten to deny by default: every /api route now
 * requires a session or API key unless it is explicitly listed as exempt.
 * This script is what proves that hasn't quietly regressed - e.g. if a future
 * refactor of the middleware's route matching loosens the check without
 * anyone noticing, because there is no build-time error for "route is no
 * longer protected."
 *
 * Run against a live instance (local dev server or a deployed URL):
 *
 *   npm run dev                      # in one terminal
 *   npm run verify:auth               # in another (defaults to localhost:3000)
 *
 *   npm run verify:auth -- --url=https://soap-ledger.vercel.app
 *
 * Exits 1 if any route fails to reject an unauthenticated request, so this
 * can gate a deploy script or pre-push hook, not just be run by hand.
 */

const urlArg = process.argv.find((a) => a.startsWith('--url='));
const BASE_URL = (urlArg ? urlArg.slice('--url='.length) : process.env.SOAPLEDGER_URL || 'http://localhost:3000').replace(/\/$/, '');

// Every route here reads from the database. A bare, credential-less request
// must be rejected before any query runs.
const PROTECTED_GET_ROUTES = [
  '/api/backup/export',                 // dumps customers, orders, addresses, expenses
  '/api/customers/search?q=a',
  '/api/customers/00000000-0000-0000-0000-000000000000/orders',
  '/api/customers/00000000-0000-0000-0000-000000000000/addresses',
  '/api/growth/insights',
  '/api/growth/orders',
];

// These validate their own x-api-key header inside the route handler rather
// than in middleware, because healingsoil.in calls them machine-to-machine.
// A request with no key at all must still be rejected — just by the route,
// not by middleware.
const API_KEY_ROUTES = [
  ['/api/products', 'GET'],
  ['/api/orders/incoming', 'POST'],
  ['/api/orders/payment', 'POST'],
  ['/api/order-availability', 'GET'],
];

let failures = 0;

function report(path, ok, detail) {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${path}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function checkRejectsUnauthenticated(path, method = 'GET') {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method });
    const ok = res.status === 401;
    report(path, ok, ok ? undefined : `expected 401, got ${res.status}`);
  } catch (err) {
    report(path, false, `request failed: ${err.message}`);
  }
}

async function main() {
  console.log(`--- Auth guard check against ${BASE_URL} ---\n`);

  console.log('Routes that must require a session or API key:');
  for (const path of PROTECTED_GET_ROUTES) {
    await checkRejectsUnauthenticated(path);
  }

  console.log('\nRoutes that validate their own x-api-key (no key sent, expect 401):');
  for (const [path, method] of API_KEY_ROUTES) {
    await checkRejectsUnauthenticated(path, method);
  }

  // Sanity check: if EVERY route were unreachable (wrong URL, server down),
  // the checks above would falsely "pass" as 401s that are actually network
  // failures reported as something else, or every single request erroring
  // out identically. Confirm the login page is actually reachable and public,
  // so a total-outage doesn't masquerade as a clean auth report.
  try {
    const res = await fetch(`${BASE_URL}/login`);
    report('/login (should be public, sanity check)', res.status === 200, res.status === 200 ? undefined : `expected 200, got ${res.status}`);
  } catch (err) {
    report('/login (should be public, sanity check)', false, `request failed: ${err.message}`);
  }

  console.log('');
  if (failures > 0) {
    console.error(`❌ ${failures} check(s) failed — an API route may be exposed without auth.`);
    process.exit(1);
  }
  console.log('✅ All checks passed. No route served data without authentication.');
}

main();
