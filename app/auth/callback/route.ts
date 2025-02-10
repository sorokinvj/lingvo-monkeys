// file: app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString();

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Создаем новые параметры, исключая code и redirect_to
  const newSearchParams = new URLSearchParams();
  requestUrl.searchParams.forEach((value, key) => {
    if (key !== 'code' && key !== 'redirect_to') {
      newSearchParams.append(key, value);
    }
  });

  const queryString = newSearchParams.toString();
  const redirectPath = redirectTo || '/upload';
  const finalUrl = `${origin}${redirectPath}${queryString ? `?${queryString}` : ''}`;

  return NextResponse.redirect(finalUrl);
}
