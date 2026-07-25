import { signIn, auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign in — SoapLedger',
};

export default async function LoginPage({ searchParams }) {
  const session = await auth();
  if (session?.user) redirect('/');

  const params = await searchParams;
  // Auth.js sends ?error=AccessDenied when the signIn callback rejects an
  // address that is not on the allowlist.
  const denied = params?.error === 'AccessDenied';
  const otherError = params?.error && !denied;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#D6CFC4] bg-white p-8 text-center">
        <h1 className="mb-2 font-serif text-3xl text-[#1E5631]">SoapLedger</h1>
        <p className="mb-8 font-sans text-sm text-[#666666]">
          Healing Soil operations. Sign in to continue.
        </p>

        {denied && (
          <p className="mb-6 rounded border border-red-200 bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
            That Google account does not have access to SoapLedger.
          </p>
        )}

        {otherError && (
          <p className="mb-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 font-sans text-sm text-amber-800">
            Sign-in could not be completed. Please try again.
          </p>
        )}

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="w-full rounded border border-[#D6CFC4] bg-white px-4 py-3 font-sans text-sm font-medium text-[#1A1A14] transition hover:bg-[#F7F5F0]"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
