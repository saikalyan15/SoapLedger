# SoapLedger Authentication Setup

Google sign-in restricted to an allowlist. Replaces the previous shared
magic-link token.

## Who has access

Edit `ALLOWED_EMAILS` in `auth.ts` at the repo root. Currently:

- saikalyan.akunuri@gmail.com
- deepanjali.naik@gmail.com
- healingsoil.in@gmail.com

The list lives in code rather than an env var deliberately — a change to who can
see customer data should show up in a git diff.

Removing an address takes effect on that person's next request. Their existing
session token stops working immediately; it does not stay valid until expiry.

## One-time setup

### 1. Install the dependency

```bash
npm install
```

### 2. Create a Google OAuth client

Use the **same Google Cloud project** that already holds the Search Console
service account (`GOOGLE_SERVICE_ACCOUNT_EMAIL`). A service account is a
different credential type — you still need an OAuth client for sign-in.

1. Google Cloud Console → APIs & Services → Credentials
2. Create Credentials → OAuth client ID → Application type: **Web application**
3. Authorised redirect URIs — add both:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://soap-ledger.vercel.app/api/auth/callback/google`
   - (add your custom domain too if you attach one later)
4. Copy the Client ID and Client secret

If the project has no OAuth consent screen yet, configure it as **External** and
add the three addresses above as test users. With only three users there is no
need to submit for verification.

### 3. Generate a session secret

```bash
npx auth secret
```

Or: `openssl rand -base64 32`

### 4. Set environment variables

Locally in `.env.local`, and in Vercel under Settings → Environment Variables
(Production, Preview and Development):

```
AUTH_SECRET=<the generated secret>
AUTH_GOOGLE_ID=<client id>
AUTH_GOOGLE_SECRET=<client secret>
```

`AUTH_URL` is not needed on Vercel — it is inferred.

### 5. Remove the old token

`HEALINGSOIL_API_KEY` is still required — healingsoil.in uses it for
`/api/products` and `/api/orders/incoming`. That stays.

The old `AUTH_TOKEN` was hardcoded in `middleware.ts`, not an env var, and is
gone with this change. It remains in git history, so treat
`healingsoil@7580` as burned — do not reuse it anywhere.

## How it works

- `auth.ts` — provider, allowlist, session config
- `app/api/auth/[...nextauth]/route.ts` — OAuth callback endpoints
- `app/login/page.jsx` — sign-in screen
- `middleware.ts` — the gate
- `lib/actions/auth.js` — sign-out server action, wired into the sidebar footer

### Sessions are JWT, not database-backed

This is deliberate and should not be changed. A database session strategy would
query Neon to validate the session on **every request**. Neon bills a full 5
minutes of compute each time it wakes, which is exactly the runaway-compute
problem this app was fixed for in July 2026. A signed JWT is verified in-process
with no database round trip.

### What stays open

- `/api/auth/*` — the sign-in flow itself
- `/login`
- `/api/products` and `/api/orders/incoming` — called by healingsoil.in with an
  `x-api-key` header, validated inside those route handlers

Everything else requires a session. Pages redirect anonymous visitors to
`/login`; API routes return 401.

## Testing after deploy

1. Open the site in a private window → should redirect to `/login`
2. Sign in with an allowlisted account → should land on the dashboard
3. Sign in with any other Google account → should show "does not have access"
4. `npm run verify:auth -- --url=https://soap-ledger.vercel.app` → should print
   all ✅ and exit 0. This checks steps 4-6 below automatically for every
   database-backed route, not just `/api/backup/export`, so it's the fast way
   to confirm the middleware guard is intact after any change to it or to
   `auth.ts` — run it after every deploy that touches either file.
5. Place a test order from healingsoil.in → should still reach SoapLedger
6. healingsoil.in shop page → products should still load

### Why `verify:auth` exists

This is the regression test for the vulnerability found on 25 Jul 2026:
middleware skipped `/api` entirely on the assumption routes checked their own
auth, and 6 of 8 didn't — including `/api/backup/export`, which returned the
full customer database to anyone who requested the URL, no login required.

The current middleware denies by default, so a new API route is protected
automatically without anyone having to remember to add a check. `verify:auth`
is what catches it if that default-deny logic is ever accidentally loosened -
there's no compiler error for "this route stopped requiring auth," so this
script is the only thing that would actually notice.
