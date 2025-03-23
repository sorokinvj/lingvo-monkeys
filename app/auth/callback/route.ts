import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const firstSignIn = requestUrl.searchParams.get('firstSignIn');
  const redirectTo = requestUrl.searchParams.get('redirect_to');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const email = requestUrl.searchParams.get('email');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // If redirect_to parameter exists, use it; otherwise default to upload
  let redirectPath =
    redirectTo || `/upload${firstSignIn ? `?firstSignIn=${firstSignIn}` : ''}`;

  // For password reset flow, preserve token, type, and email parameters
  if (redirectTo && redirectTo.includes('reset-password') && token) {
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (type) params.append('type', type);
    if (email) params.append('email', email);

    redirectPath = `${redirectTo}?${params.toString()}`;
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
