import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Define an interface for the extended data type that includes redirectType
interface AuthExchangeResponse {
  user: any;
  session: any;
  redirectType?: string;
}

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const firstSignIn = requestUrl.searchParams.get('firstSignIn');
  const redirectTo = requestUrl.searchParams.get('redirect_to');
  const type = requestUrl.searchParams.get('type');
  const email = requestUrl.searchParams.get('email');

  // Initialize Supabase client
  const supabase = createClient();

  // Handle different types of callbacks:
  // 1. Code exchange - from auth links
  // 2. Error handling - e.g., from expired links
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // In case of errors, redirect with error parameters
  if (error && redirectTo) {
    const errorUrl = new URL(`${origin}${redirectTo}`);
    errorUrl.searchParams.set('error', error);
    if (error_description) {
      errorUrl.searchParams.set('error_description', error_description);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Exchange code for session (standard scenario)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log('exchangeCodeForSession', data, error);

    if (error) {
      // If there's an error exchanging the code, redirect with error
      if (redirectTo) {
        const errorUrl = new URL(`${origin}${redirectTo}`);
        errorUrl.searchParams.set('error', 'code_exchange_error');
        errorUrl.searchParams.set('error_description', error.message);
        return NextResponse.redirect(errorUrl);
      }
    }

    // Type assert data as our extended interface to access redirectType
    const authData = data as unknown as AuthExchangeResponse;

    // Special handling for PASSWORD_RECOVERY flow
    // The key insight: for password recovery, the Supabase auth flow automatically
    // validates the OTP during exchangeCodeForSession - we don't need to call verifyOtp separately
    if (authData?.redirectType === 'PASSWORD_RECOVERY' && redirectTo) {
      // If we have a valid session and the redirect type is PASSWORD_RECOVERY
      // this means the magic link was valid and the user can reset their password
      const userEmail = authData.user?.email;

      if (userEmail) {
        const resetUrl = new URL(`${origin}${redirectTo}`);
        // Set verified=true to indicate the OTP was already verified during code exchange
        resetUrl.searchParams.set('verified', 'true');
        resetUrl.searchParams.set('email', userEmail);
        return NextResponse.redirect(resetUrl);
      }
    }
  }

  // Default redirect behavior if none of the above conditions are met
  // If redirect_to parameter exists, use it; otherwise default to upload
  let redirectPath =
    redirectTo || `/upload${firstSignIn ? `?firstSignIn=${firstSignIn}` : ''}`;

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
