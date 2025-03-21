import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export type AnalyticsEvent = {
  eventType:
    | 'file_upload'
    | 'file_listening'
    | 'player_interaction'
    | 'transcript_interaction'
    | 'settings_change'
    | 'page_view';
  data: Record<string, any>;
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

    const event: AnalyticsEvent = await req.json();

    if (!event.eventType || !event.data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Добавляем идентификатор пользователя во все события
    const dataWithUser = {
      ...event.data,
      userId: user.id,
    };

    // Используем сервисную роль для отправки событий аналитики
    try {
      const supabaseAdmin = createClient({ useServiceRole: true });
      let table = '';

      // Определяем таблицу на основе типа события
      switch (event.eventType) {
        case 'file_upload':
          table = 'FileUploadEvent';
          break;
        case 'file_listening':
          table = 'FileListeningEvent';
          break;
        case 'player_interaction':
          table = 'PlayerInteractionEvent';
          break;
        case 'transcript_interaction':
          table = 'TranscriptInteractionEvent';
          break;
        case 'settings_change':
          table = 'SettingsChangeEvent';
          break;
        case 'page_view':
          table = 'PageViewEvent';
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid event type' },
            { status: 400 }
          );
      }

      // Вставляем данные в соответствующую таблицу
      const { data, error } = await supabaseAdmin
        .from(table)
        .insert(dataWithUser)
        .select('id')
        .single();

      if (error) {
        console.error(`Error tracking ${event.eventType}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Возвращаем ID созданной записи и статус успеха
      return NextResponse.json({
        success: true,
        id: data?.id,
      });
    } catch (adminError) {
      console.error('Error with admin client:', adminError);

      // Если не удалось использовать сервисную роль, пробуем обычного клиента
      let error;

      // Сохраняем событие в соответствующую таблицу
      switch (event.eventType) {
        case 'file_upload':
          const { error: uploadError } = await supabase
            .from('FileUploadEvent')
            .insert(dataWithUser);
          error = uploadError;
          break;

        case 'file_listening':
          const { error: listeningError } = await supabase
            .from('FileListeningEvent')
            .insert(dataWithUser);
          error = listeningError;
          break;

        case 'player_interaction':
          const { error: playerError } = await supabase
            .from('PlayerInteractionEvent')
            .insert(dataWithUser);
          error = playerError;
          break;

        case 'transcript_interaction':
          const { error: transcriptError } = await supabase
            .from('TranscriptInteractionEvent')
            .insert(dataWithUser);
          error = transcriptError;
          break;

        case 'settings_change':
          const { error: settingsError } = await supabase
            .from('SettingsChangeEvent')
            .insert(dataWithUser);
          error = settingsError;
          break;

        case 'page_view':
          const { error: pageViewError, data: pageViewData } = await supabase
            .from('PageViewEvent')
            .insert(dataWithUser)
            .select('id')
            .single();
          error = pageViewError;

          if (!error) {
            return NextResponse.json({
              success: true,
              id: pageViewData?.id,
            });
          }
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid event type' },
            { status: 400 }
          );
      }

      if (error) {
        console.error(`Error tracking ${event.eventType}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
