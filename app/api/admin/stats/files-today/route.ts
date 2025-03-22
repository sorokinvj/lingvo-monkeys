import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';
import { NextResponse } from 'next/server';

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

  // Используем тот же метод проверки что и на странице
  const isAdmin = userData?.email === 'sorokinvj@gmail.com';

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count files uploaded today
    const { count } = await supabase
      .from(Tables.FILE)
      .select('*', { count: 'exact', head: true })
      .gte('createdAt', today.toISOString());

    return NextResponse.json({ value: count || 0 });
  } catch (error) {
    console.error("Error fetching today's file count:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's file count" },
      { status: 500 }
    );
  }
}
