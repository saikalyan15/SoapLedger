import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The secret token used for the magic link
const AUTH_TOKEN = 'healingsoil@7580';
const COOKIE_NAME = 'soapledger_auth';

// Routes called by external systems (healingsoil.in) that authenticate
// themselves with the x-api-key header. Everything else under /api is only
// ever called by this app's own browser UI, so it must carry the auth cookie.
const API_KEY_ROUTES = ['/api/products', '/api/orders/incoming'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Static assets — always allowed.
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    // These validate their own API key inside the route handler.
    if (API_KEY_ROUTES.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Every other API route reads from the database. Require either the
    // browser auth cookie or a valid API key before anything touches Neon —
    // an unauthenticated request must never be able to wake the compute or
    // read customer data.
    const hasCookie = request.cookies.get(COOKIE_NAME);
    const hasApiKey =
      request.headers.get('x-api-key') === process.env.HEALINGSOIL_API_KEY;

    if (!hasCookie && !hasApiKey) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    return NextResponse.next();
  }

  // Static files (images, etc.)
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. Check if the "Magic Token" is in the URL
  const token = searchParams.get('token');

  if (token === AUTH_TOKEN) {
    // Correct token! Set a secure cookie for 1 year and redirect to clean URL
    const response = NextResponse.redirect(new URL(pathname, request.url));
    
    response.cookies.set(COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    
    return response;
  }

  // 3. Check if the user already has a valid auth cookie
  const isAuthenticated = request.cookies.get(COOKIE_NAME);

  if (!isAuthenticated) {
    // Not authenticated and no token? Block access.
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized. Please use your magic link to login.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  // User is authenticated, proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * /api is deliberately INCLUDED so that database-backed API routes are
     * gated too. Handling for it is branched inside middleware() above.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
