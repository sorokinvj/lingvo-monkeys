import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type PageExitPayload = {
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

    const { pageViewId }: PageExitPayload = await req.json();

    if (!pageViewId) {
      return NextResponse.json(
        { error: 'Missing pageViewId' },
        { status: 400 }
      );
    }

    try {
      // Используем сервисную роль для обработки выхода со страницы
      const supabaseAdmin = createClient({ useServiceRole: true });

      // Получаем текущую запись
      const { data: pageView, error: fetchError } = await supabaseAdmin
        .from('PageViewEvent')
        .select('enteredAt')
        .eq('id', pageViewId)
        .eq('userId', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching page view (admin):', fetchError);
        throw fetchError; // Переходим к fallback
      }

      const exitedAt = new Date();
      const enteredAt = new Date(pageView.enteredAt);
      const durationSeconds = Math.floor(
        (exitedAt.getTime() - enteredAt.getTime()) / 1000
      );

      // Обновляем запись с данными о выходе
      const { error } = await supabaseAdmin
        .from('PageViewEvent')
        .update({
          isActive: false,
          exitedAt: exitedAt.toISOString(),
          duration: durationSeconds,
        })
        .eq('id', pageViewId)
        .eq('userId', user.id);

      if (error) {
        console.error('Error updating page exit (admin):', error);
        throw error; // Переходим к fallback
      }

      return NextResponse.json({ success: true });
    } catch (adminError) {
      // Fallback: используем обычного клиента, если сервисная роль не сработала
      console.error('Error with admin client:', adminError);

      // Получаем текущую запись
      const { data: pageView, error: fetchError } = await supabase
        .from('PageViewEvent')
        .select('enteredAt')
        .eq('id', pageViewId)
        .eq('userId', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching page view:', fetchError);
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }

      const exitedAt = new Date();
      const enteredAt = new Date(pageView.enteredAt);
      const durationSeconds = Math.floor(
        (exitedAt.getTime() - enteredAt.getTime()) / 1000
      );

      // Обновляем запись с данными о выходе
      const { error } = await supabase
        .from('PageViewEvent')
        .update({
          isActive: false,
          exitedAt: exitedAt.toISOString(),
          duration: durationSeconds,
        })
        .eq('id', pageViewId)
        .eq('userId', user.id);

      if (error) {
        console.error('Error updating page exit:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error processing page exit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
