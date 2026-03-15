import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The secret token used for the magic link
const AUTH_TOKEN = 'healingsoil@7580';
const COOKIE_NAME = 'soapledger_auth';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Skip auth for API routes (they have their own API key logic)
  // and static files (images, etc.)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check if the "Magic Token" is in the URL
  const token = searchParams.get('token');

  if (token === AUTH_TOKEN) {
    // Correct token! Set a secure cookie for 1 year and redirect to clean URL
    const response = NextResponse.redirect(new URL(pathname, request.url));
    
    response.cookies.set(COOKIE_NAME, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
     * Match all request paths except for the ones starting with:
     * - api (handled by its own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
