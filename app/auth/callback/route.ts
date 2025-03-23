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

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // If redirect_to parameter exists, use it; otherwise default to upload
  const redirectPath =
    redirectTo || `/upload${firstSignIn ? `?firstSignIn=${firstSignIn}` : ''}`;
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
