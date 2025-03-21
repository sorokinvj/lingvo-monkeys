import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Интерфейсы для типизации данных
interface UserFile {
  id: string;
  name: string;
}

interface Event {
  id: string;
  userId: string;
  [key: string]: any;
}

interface EventsResult {
  uploadEvents: any[];
  listeningEvents: any[];
  playerEvents: any[];
  settingsEvents: any[];
  pageViewEvents: any[];
}

interface RPCResult {
  upload_events?: any[];
  listening_events?: any[];
  player_events?: any[];
  settings_events?: any[];
  page_view_events?: any[];
}

// Кэш результатов для часто запрашиваемых пользователей
const resultsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const adminClient = createClient({ useServiceRole: true });

    // Получение и проверка текущего пользователя
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка прав администратора
    const { data: userData, error: userDataError } = await supabase
      .from('User')
      .select('email')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json(
        { error: 'Failed to get user data' },
        { status: 500 }
      );
    }

    const isAdmin =
      userData.email === 'sorokinvj@gmail.com' ||
      userData.email === 'bichiko@gmail.com';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Получение email пользователя из параметров запроса
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Проверяем кэш
    const cacheKey = `audit_${email}`;
    const cachedResult = resultsCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult.data);
    }

    // Получение userId пользователя по email
    const { data: targetUser, error: targetUserError } = await adminClient
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = targetUser.id;

    // Получаем файлы пользователя с использованием RPC-функции
    const { data: userFiles, error: userFilesError } = await adminClient
      .rpc('get_user_files', { user_id: userId })
      .maybeSingle();

    // В случае если RPC не настроена, используем обычный запрос
    let filesData: UserFile[] = [];
    if (userFilesError || !userFiles) {
      console.error(
        'RPC get_user_files не настроена или произошла ошибка:',
        userFilesError
      );

      const { data, error } = await adminClient
        .from('File')
        .select('id, name')
        .eq('userId', userId);

      if (!error && data) {
        filesData = data as UserFile[];
      } else {
        console.error('Fallback user files error:', error);
      }
    } else {
      filesData = userFiles as UserFile[];
    }

    // Создаем словарь для быстрого доступа к названиям файлов
    const fileNames: Record<string, string> = {};
    filesData.forEach((file) => {
      fileNames[file.id] = file.name;
    });

    // Получаем все события одним SQL-запросом (используя RPC)
    const { data: allEvents, error: allEventsError } = await adminClient
      .rpc('get_user_audit_events', { user_id: userId, limit_per_table: 100 })
      .maybeSingle();

    let events: EventsResult = {
      uploadEvents: [],
      listeningEvents: [],
      playerEvents: [],
      settingsEvents: [],
      pageViewEvents: [],
    };

    // Если RPC не настроена, делаем отдельные запросы
    if (allEventsError || !allEvents) {
      console.error(
        'RPC get_user_audit_events не настроена или произошла ошибка:',
        allEventsError
      );

      // Получаем отдельные наборы данных
      const [
        { data: uploadEvents },
        { data: listeningEvents },
        { data: playerEvents },
        { data: settingsEvents },
        { data: pageViewEvents },
      ] = await Promise.all([
        adminClient
          .from('FileUploadEvent')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
          .limit(100),
        adminClient
          .from('FileListeningEvent')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
          .limit(100),
        adminClient
          .from('PlayerInteractionEvent')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
          .limit(100),
        adminClient
          .from('SettingsChangeEvent')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
          .limit(50),
        adminClient
          .from('PageViewEvent')
          .select('*')
          .eq('userId', userId)
          .order('enteredAt', { ascending: false })
          .limit(100),
      ]);

      events = {
        uploadEvents: (uploadEvents || []).map((event: Event) => ({
          ...event,
          eventType: 'file_upload',
          fileName:
            fileNames[event.fileId] || event.fileName || 'Неизвестный файл',
        })),
        listeningEvents: (listeningEvents || []).map((event: Event) => ({
          ...event,
          eventType: 'file_listening',
          fileName: fileNames[event.fileId] || 'Неизвестный файл',
        })),
        playerEvents: (playerEvents || []).map((event: Event) => ({
          ...event,
          eventType: 'player_interaction',
          fileName: fileNames[event.fileId] || 'Неизвестный файл',
        })),
        settingsEvents: (settingsEvents || []).map((event: Event) => ({
          ...event,
          eventType: 'settings_change',
        })),
        pageViewEvents: (pageViewEvents || []).map((event: Event) => ({
          ...event,
          eventType: 'page_view',
          createdAt: event.enteredAt, // Для унификации сортировки
        })),
      };
    } else {
      const typedEvents = allEvents as RPCResult;
      // Если RPC успешно отработала, преобразуем результаты
      events = {
        uploadEvents: (typedEvents.upload_events || []).map((event: Event) => ({
          ...event,
          eventType: 'file_upload',
          fileName:
            fileNames[event.fileId] || event.fileName || 'Неизвестный файл',
        })),
        listeningEvents: (typedEvents.listening_events || []).map(
          (event: Event) => ({
            ...event,
            eventType: 'file_listening',
            fileName: fileNames[event.fileId] || 'Неизвестный файл',
          })
        ),
        playerEvents: (typedEvents.player_events || []).map((event: Event) => ({
          ...event,
          eventType: 'player_interaction',
          fileName: fileNames[event.fileId] || 'Неизвестный файл',
        })),
        settingsEvents: (typedEvents.settings_events || []).map(
          (event: Event) => ({
            ...event,
            eventType: 'settings_change',
          })
        ),
        pageViewEvents: (typedEvents.page_view_events || []).map(
          (event: Event) => ({
            ...event,
            eventType: 'page_view',
            createdAt: event.enteredAt, // Для унификации сортировки
          })
        ),
      };
    }

    // Подготовка данных для ответа
    const result = {
      user: { email, id: userId },
      files: filesData,
      fileNames,
      events,
    };

    // Сохраняем результат в кэше
    resultsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in user audit API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user audit data' },
      { status: 500 }
    );
  }
}
