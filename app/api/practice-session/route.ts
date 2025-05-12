import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  // Expecting:
  // { user_id, page_id, file_name, started_at, duration_seconds }
  const { user_id, page_id, file_name, started_at, duration_seconds } = body;

  if (!user_id || !page_id || !file_name || !started_at || !duration_seconds) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('practice_sessions').insert([
    {
      user_id,
      page_id,
      file_name,
      started_at,
      duration_seconds,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}