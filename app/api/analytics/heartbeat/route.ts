import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type HeartbeatPayload = {
  pageViewId: string;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageViewId }: HeartbeatPayload = await req.json();

    if (!pageViewId) {
      return NextResponse.json(
        { error: 'Missing pageViewId' },
        { status: 400 }
      );
    }

    try {
      // Используем сервисную роль для обновления heartbeat
      const supabaseAdmin = createClient({ useServiceRole: true });

      const { error } = await supabaseAdmin
        .from('PageViewEvent')
        .update({
          lastActivityAt: new Date().toISOString(),
          isActive: true,
        })
        .eq('id', pageViewId)
        .eq('userId', user.id); // Всё равно проверяем принадлежность записи пользователю

      if (error) {
        console.error('Error updating heartbeat (admin):', error);
        throw error; // Переходим к fallback-варианту
      }

      return NextResponse.json({ success: true });
    } catch (adminError) {
      // Fallback: если не удалось использовать сервисную роль, пробуем обычного клиента
      console.error('Error with admin client:', adminError);

      // Обновляем lastActivityAt и устанавливаем isActive в true
      const { error } = await supabase
        .from('PageViewEvent')
        .update({
          lastActivityAt: new Date().toISOString(),
          isActive: true,
        })
        .eq('id', pageViewId)
        .eq('userId', user.id); // Убеждаемся, что запись принадлежит текущему пользователю

      if (error) {
        console.error('Error updating heartbeat:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
