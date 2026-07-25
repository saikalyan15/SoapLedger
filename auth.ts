import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Who is allowed into SoapLedger.
 *
 * Kept in code rather than an env var on purpose: it is not a secret, and a
 * change to who can see customer data should be visible in a git diff and
 * reviewable, not silently editable in a dashboard.
 *
 * Compared case-insensitively — Google returns the address as registered.
 */
const ALLOWED_EMAILS = [
  'saikalyan.akunuri@gmail.com',
  'deepanjali.naik@gmail.com',
  'healingsoil.in@gmail.com',
];

function isAllowed(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  /**
   * JWT sessions, deliberately — NOT a database adapter.
   *
   * A database session strategy would query Neon to validate the session on
   * every single request. Neon's compute is billed for a full 5 minutes each
   * time it wakes, so that would recreate exactly the runaway-compute problem
   * this app was just fixed for. A signed JWT is verified in-process with no
   * database round trip.
   */
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },

  callbacks: {
    /**
     * The allowlist gate. Returning false aborts sign-in, so a Google account
     * outside the list never gets a session at all.
     */
    signIn({ profile }) {
      return isAllowed(profile?.email);
    },

    /**
     * Re-check on every session read. If an address is removed from the
     * allowlist, existing JWTs stop working immediately rather than staying
     * valid until they expire.
     */
    jwt({ token }) {
      token.allowed = isAllowed(token.email);
      return token;
    },

    session({ session, token }) {
      if (!token.allowed) {
        // Surfaces as an unauthenticated session; middleware then rejects.
        return null as unknown as typeof session;
      }
      return session;
    },
  },

  trustHost: true,
});
