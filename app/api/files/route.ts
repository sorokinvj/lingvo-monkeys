import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: files, error } = await supabase
    .from('File')
    .select('*')
    .eq('userId', user.id);

  if (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(files);
}
