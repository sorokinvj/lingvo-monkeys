import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';
import { NextResponse } from 'next/server';

// Email пользователя, владеющего коллекцией.
// Продублирован в public.library_owner_id() (миграция 20260902000000),
// откуда RLS-политика на File/Transcription берёт список публичных файлов.
const COLLECTION_OWNER_EMAIL = 'christrobs@gmail.com';

export async function GET() {
  // Сервисный ключ: роут читает чужую (владельца коллекции) строку в User,
  // что под RLS недоступно ни anon, ни обычному авторизованному пользователю.
  // Наружу отдаём только файлы коллекции — они и так публичные.
  const supabase = createClient({ useServiceRole: true });

  try {
    // Находим пользователя в таблице User по email
    const { data: userData, error: userError } = await supabase
      .from(Tables.USER)
      .select('id')
      .eq('email', COLLECTION_OWNER_EMAIL)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: 'Collection owner not found' },
        { status: 404 }
      );
    }

    console.log('Found collection owner:', userData);

    // Загружаем все файлы пользователя
    const { data: files, error: filesError } = await supabase
      .from(Tables.FILE)
      .select('*')
      .eq(Columns.COMMON.USER_ID, userData.id)
      .order('createdAt', { ascending: false });

    if (filesError) {
      console.error('Error fetching collection files:', filesError);
      return NextResponse.json({ error: filesError.message }, { status: 500 });
    }

    // Если нет файлов, возвращаем пустой массив
    if (!files || files.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error in collection API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}
