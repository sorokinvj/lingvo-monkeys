import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(withFooter)/admin/helpers';

export async function GET() {
  const supabase = createClient();

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
  const { data: userData } = await supabase
    .from(Tables.USER)
    .select('email')
    .eq('id', user.id)
    .single();

  // Используем ту же функцию проверки что и на странице
  const isAdmin = isAdminEmail(userData?.email);

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Get date for 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Count files uploaded in the last 7 days
    const { count } = await supabase
      .from(Tables.FILE)
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', weekAgo.toISOString());

    return NextResponse.json({ value: count || 0 });
  } catch (error) {
    console.error("Error fetching week's file count:", error);
    return NextResponse.json(
      { error: "Failed to fetch week's file count" },
      { status: 500 }
    );
  }
}
