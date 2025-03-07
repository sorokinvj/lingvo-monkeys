import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Email пользователя, владеющего коллекцией
const COLLECTION_OWNER_EMAIL = 'christrobs@gmail.com';

export async function GET() {
  const supabase = createClient();

  try {
    // Находим пользователя в таблице User по email
    const { data: userData, error: userError } = await supabase
      .from('User')
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
      .from('File')
      .select('*')
      .eq('userId', userData.id)
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
