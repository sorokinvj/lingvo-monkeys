import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export type AnalyticsEvent = {
  eventType:
    | 'file_upload'
    | 'file_listening'
    | 'player_interaction'
    | 'transcript_interaction'
    | 'settings_change'
    | 'page_view'
    | 'file_status_change';
  data: Record<string, any>;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    // Создаем клиент с сервисной ролью для всех операций
    const supabaseAdmin = createClient({ useServiceRole: true });

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
    const dataWithUser: Record<string, any> = {
      ...event.data,
      userId: user.id,
    };

    // Специальная обработка для обновления статуса файла
    if (
      event.eventType === 'file_status_change' &&
      event.data.fileId &&
      event.data.uploadEventId
    ) {
      const { data, error } = await supabaseAdmin
        .from('FileUploadEvent')
        .update({
          status: event.data.status,
          ...(event.data.error ? { errorMessage: event.data.error } : {}),
        })
        .eq('id', event.data.uploadEventId)
        .eq('fileId', event.data.fileId)
        .eq('userId', user.id)
        .select('id')
        .single();

      if (error) {
        console.error('Error updating file status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        id: data?.id,
      });
    }

    // Определяем таблицу на основе типа события
    let table = '';
    switch (event.eventType) {
      case 'file_upload':
        table = 'FileUploadEvent';
        // Добавляем статус при создании записи о загрузке
        dataWithUser.status = dataWithUser.status || 'uploading';
        break;
      case 'file_listening':
        table = 'FileListeningEvent';
        break;
      case 'player_interaction':
        table = 'PlayerInteractionEvent';
        break;
      case 'transcript_interaction': // Перенаправляем в PlayerInteractionEvent
        table = 'PlayerInteractionEvent';
        // Добавляем source для отличия от обычных взаимодействий с плеером
        dataWithUser.source = 'transcript';
        dataWithUser.actionType = 'transcript_seek';
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

    // Вставляем данные в соответствующую таблицу, всегда используя сервисную роль
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
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
