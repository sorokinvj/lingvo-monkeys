import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';

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
  upload_events: any[];
  listening_events: any[];
  player_events: any[];
  settings_events: any[];
  page_view_events: any[];
}

// Функция для преобразования snake_case в camelCase
function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Для массивов обрабатываем каждый элемент
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  // Для объектов преобразуем ключи
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Преобразование ключа из snake_case в camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );

      // Рекурсивно обрабатываем значение
      result[camelKey] = snakeToCamel(obj[key]);

      // Важные поля для совместимости с существующим кодом
      if (key === 'created_at') result['createdAt'] = result[camelKey];
      if (key === 'user_id') result['userId'] = result[camelKey];
      if (key === 'file_id') result['fileId'] = result[camelKey];
      if (key === 'entered_at') result['enteredAt'] = result[camelKey];
      if (key === 'exited_at') result['exitedAt'] = result[camelKey];
      if (key === 'last_activity_at')
        result['lastActivityAt'] = result[camelKey];
      if (key === 'setting_key') result['settingKey'] = result[camelKey];
      if (key === 'new_value') result['newValue'] = result[camelKey];
      if (key === 'old_value') result['oldValue'] = result[camelKey];
      if (key === 'action_type') result['actionType'] = result[camelKey];
    }
  }
  return result;
}

// Кэш результатов для часто запрашиваемых пользователей
const resultsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

export async function GET(request: NextRequest) {
  try {
    const adminClient = createClient({ useServiceRole: true });

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
      .from(Tables.USER)
      .select('id')
      .eq('email', email)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = targetUser.id;

    // Получаем файлы пользователя для связывания с событиями
    const { data: userFilesData, error: userFilesError } = await adminClient
      .from(Tables.FILE)
      .select('*')
      .eq(Columns.COMMON.USER_ID, userId);

    if (userFilesError) {
      console.error(
        'Ошибка при получении файлов пользователя:',
        userFilesError
      );
      return NextResponse.json(
        { error: userFilesError.message },
        { status: 500 }
      );
    }

    // Создаем camelCase массив файлов
    const userFiles = userFilesData
      ? (snakeToCamel(userFilesData) as UserFile[])
      : [];

    // Создаем словарь для быстрого доступа к имени файла по его id
    const fileNames: Record<string, string> = {};
    userFiles.forEach((file) => {
      fileNames[file.id] = file.name || 'Неизвестный файл';
    });

    // Получаем все события для пользователя
    const { data: allEventsData, error: allEventsError } =
      await adminClient.rpc('get_user_audit_events', {
        user_id: userId,
        limit_per_table: 5,
      });

    if (allEventsError) {
      console.error(
        'Ошибка при получении событий пользователя:',
        allEventsError
      );
      return NextResponse.json(
        { error: allEventsError.message },
        { status: 500 }
      );
    }

    if (
      !allEventsData ||
      !Array.isArray(allEventsData) ||
      allEventsData.length === 0
    ) {
      // Если данных нет, возвращаем структуру, соответствующую UserAuditData
      const emptyResult = {
        user: { email, id: userId },
        files: userFiles,
        fileNames,
        events: {
          uploadEvents: [],
          listeningEvents: [],
          playerEvents: [],
          settingsEvents: [],
          pageViewEvents: [],
        },
      };

      // Сохраняем результат в кэше
      resultsCache.set(cacheKey, {
        data: emptyResult,
        timestamp: Date.now(),
      });

      return NextResponse.json(emptyResult);
    }

    // Извлекаем реальную структуру данных из ответа RPC
    const eventsRawData = allEventsData[0]?.get_user_audit_events || {};

    // Преобразуем данные RPC в нужный формат и camelCase
    const typedEvents = snakeToCamel(eventsRawData) as RPCResult;

    // Защита от null/undefined для всех коллекций
    const uploadEvents = Array.isArray(typedEvents?.upload_events)
      ? typedEvents.upload_events
      : [];
    const listeningEvents = Array.isArray(typedEvents?.listening_events)
      ? typedEvents.listening_events
      : [];
    const playerEvents = Array.isArray(typedEvents?.player_events)
      ? typedEvents.player_events
      : [];
    const settingsEvents = Array.isArray(typedEvents?.settings_events)
      ? typedEvents.settings_events
      : [];
    const pageViewEvents = Array.isArray(typedEvents?.page_view_events)
      ? typedEvents.page_view_events
      : [];

    // Добавляем eventType для всех событий
    const transformUploadEvents = uploadEvents.map((event) => ({
      ...event,
      eventType: 'file_upload',
    }));

    const transformListeningEvents = listeningEvents.map((event) => ({
      ...event,
      eventType: 'file_listening',
    }));

    const transformPlayerEvents = playerEvents.map((event) => ({
      ...event,
      eventType: 'player_interaction',
    }));

    const transformSettingsEvents = settingsEvents.map((event) => ({
      ...event,
      eventType: 'settings_change',
    }));

    const transformPageViewEvents = pageViewEvents.map((event) => ({
      ...event,
      eventType: 'page_view',
    }));

    const events: EventsResult = {
      uploadEvents: transformUploadEvents.map((event: Event) => ({
        ...event,
        fileName:
          fileNames[event.fileId] || event.fileName || 'Неизвестный файл',
      })),
      listeningEvents: transformListeningEvents.map((event: Event) => ({
        ...event,
        fileName: fileNames[event.fileId] || 'Неизвестный файл',
      })),
      playerEvents: transformPlayerEvents.map((event: Event) => ({
        ...event,
        fileName: fileNames[event.fileId] || 'Неизвестный файл',
      })),
      settingsEvents: transformSettingsEvents,
      pageViewEvents: transformPageViewEvents,
    };

    // Подготовка данных для ответа
    const result = {
      user: { email, id: userId },
      files: userFiles,
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
