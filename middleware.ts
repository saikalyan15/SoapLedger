import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Access control for SoapLedger.
 *
 * Replaces the previous shared magic-link token. That scheme had three problems:
 *  - the token was hardcoded in this file and committed to git history
 *  - it travelled in the URL, so it leaked into browser history and Referer headers
 *  - the cookie check only tested that the cookie EXISTED, never its value, so
 *    anyone could set `soapledger_auth=true` by hand in devtools and walk in
 *
 * Access is now a Google sign-in checked against an allowlist in auth.ts.
 */

// Called by healingsoil.in with an x-api-key header; they validate the key
// themselves inside the route handler.
const API_KEY_ROUTES = [
  '/api/products',
  '/api/orders/incoming',
  '/api/orders/payment',
  '/api/order-availability',
];

// Must stay open or the sign-in flow cannot complete.
const PUBLIC_PATHS = ['/login', '/api/auth'];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isSignedIn = Boolean(request.auth?.user);

  // Static assets.
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // The OAuth endpoints and the login page itself.
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    // Machine-to-machine routes handle their own API key.
    if (API_KEY_ROUTES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Every other API route reads the database. Require a real session or a
    // valid API key before anything can touch Neon — an unauthenticated request
    // must never be able to wake the compute or read customer data.
    const hasApiKey =
      request.headers.get('x-api-key') === process.env.HEALINGSOIL_API_KEY;

    if (!isSignedIn && !hasApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Static files (images, etc.)
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // Pages: send anonymous visitors to the login screen rather than a bare 401,
  // so a bookmarked deep link still works after signing in.
  if (!isSignedIn) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * /api is deliberately INCLUDED so database-backed API routes are gated
     * too. Handling for it is branched inside the middleware above.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
