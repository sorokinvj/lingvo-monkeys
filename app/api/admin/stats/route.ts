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
  // You may want to replace this with a proper admin role check
  return (
    userData?.email &&
    (userData.email === process.env.ADMIN_EMAIL ||
      userData.email.endsWith('@lingvomonkeys.com'))
  );
}

// Main handler function for basic stats
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
    const { count: userCount } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });

    // Count total files
    const { count: fileCount } = await supabase
      .from('File')
      .select('*', { count: 'exact', head: true });

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count files uploaded today
    const { count: filesToday } = await supabase
      .from('File')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', today.toISOString());

    // Get date for 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Count files uploaded in the last 7 days
    const { count: filesWeek } = await supabase
      .from('File')
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', weekAgo.toISOString());

    return NextResponse.json({
      userCount,
      fileCount,
      filesToday,
      filesWeek,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
