import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper function to check if a user is an admin
async function isAdmin(userId: string) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get the user's email
  const { data: userData } = await supabase
    .from('User')
    .select('email')
    .eq('id', userId)
    .single();

  // Check if the user is an admin
  return (
    userData?.email &&
    (userData.email === process.env.ADMIN_EMAIL ||
      userData.email.endsWith('@lingvomonkeys.com'))
  );
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if user is admin
  const admin = await isAdmin(user.id);

  if (!admin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Count total users
    const { count } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ value: count || 0 });
  } catch (error) {
    console.error('Error fetching user count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user count' },
      { status: 500 }
    );
  }
}
