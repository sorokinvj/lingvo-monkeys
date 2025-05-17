import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/schema/schema';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(withFooter)/admin/helpers';

// Интерфейс для возвращаемых данных статистики
interface UserStatsResponse {
  id: string;
  name: string;
  email: string;
  totalFiles: number;
  libraryCount: number;
  totalListeningTime: number;
  interactions: number;
  pageViews: number;
}

/**
 * API-эндпоинт для получения детальной статистики по пользователям
 *
 * Возвращает массив объектов со следующими полями:
 * - id: идентификатор пользователя
 * - name: имя пользователя
 * - email: email пользователя
 * - totalFiles: общее количество файлов, загруженных пользователем
 * - libraryCount: количество файлов библиотеки, прослушанных более 1 минуты
 * - totalListeningTime: общее время прослушивания в секундах
 * - interactions: общее количество взаимодействий (плеер + настройки)
 * - pageViews: количество просмотров страниц
 */
export async function GET() {
  const supabase = createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from(Tables.USER)
    .select('email')
    .eq('id', user.id)
    .single();

  // Используем ту же функцию проверки что и на странице
  const isAdmin = isAdminEmail(userData?.email);

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Get all users
    const { data: users } = await supabase
      .from(Tables.USER)
      .select('id, name, email, createdAt')
      .order('createdAt', { ascending: false });

    if (!users) {
      return NextResponse.json({ users: [] });
    }

    // Получаем статистику взаимодействий с плеером для всех пользователей одним запросом
    const playerInteractionsResult = await supabase.rpc(
      'count_player_interactions',
      {}
    );

    // Проверяем структуру данных и создаем словарь userId -> количество взаимодействий
    const playerInteractionsMap: Record<string, number> = {};
    if (playerInteractionsResult.data) {
      playerInteractionsResult.data.forEach((stat: any) => {
        // Проверяем формат данных, возвращаемых функцией
        if (
          stat &&
          (typeof stat.userId !== 'undefined' ||
            typeof stat.userid !== 'undefined') &&
          typeof stat.count !== 'undefined'
        ) {
          // SQL функция возвращает userId (camelCase), а не userid (lowercase)
          const userId = stat.userId || stat.userid;
          playerInteractionsMap[userId] =
            typeof stat.count === 'string'
              ? parseInt(stat.count)
              : Number(stat.count);
        }
      });
    }

    // Получаем статистику просмотров страниц для всех пользователей одним запросом
    const pageViewsResult = await supabase.rpc('count_page_views', {});

    // Создаем словарь userId -> количество просмотров страниц
    const pageViewsMap: Record<string, number> = {};
    if (pageViewsResult.data) {
      pageViewsResult.data.forEach((stat: any) => {
        // Проверяем формат данных, возвращаемых функцией
        if (
          stat &&
          (typeof stat.userId !== 'undefined' ||
            typeof stat.userid !== 'undefined') &&
          typeof stat.count !== 'undefined'
        ) {
          // SQL функция возвращает userId (camelCase), а не userid (lowercase)
          const userId = stat.userId || stat.userid;
          pageViewsMap[userId] =
            typeof stat.count === 'string'
              ? parseInt(stat.count)
              : Number(stat.count);
        }
      });
    }

    // Данные для всех пользователей
    const userStats = await Promise.all(
      users.map(async (user) => {
        // Количество файлов
        const { count: totalFiles } = await supabase
          .from(Tables.FILE)
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Получаем агрегированную статистику прослушивания из RPC-функции
        const { data: listeningStats } = await supabase.rpc(
          'get_user_listening_stats',
          { user_id: user.id }
        );

        // Получаем данные из агрегированной статистики
        const stats = listeningStats || {
          total_seconds: 0,
          total_files_listened: 0,
          daily_stats: [],
        };

        const totalListeningTime = stats.total_seconds || 0;

        console.log(
          `Raw listening stats for ${user.email}:`,
          JSON.stringify(stats, null, 2)
        );

        // Получаем количество библиотечных файлов, которые пользователь прослушал
        // более 1 минуты суммарно, используя оптимизированную SQL-функцию
        const { data: directLibraryQuery } = await supabase.rpc(
          'get_library_count_for_user',
          { user_id_param: user.id }
        );

        console.log(
          `Direct library query for ${user.email}:`,
          directLibraryQuery
        );

        // Используем результат либо из прямого SQL-запроса, либо из предыдущего запроса
        const libraryCount = directLibraryQuery?.count || 0;

        // Получаем данные о изменениях настроек
        const { count: settingsChanges } = await supabase
          .from('SettingsChangeEvent')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Используем данные из предварительно полученных словарей
        const playerInteractions = playerInteractionsMap[user.id] || 0;
        // Объединяем взаимодействия (плеер + настройки)
        const interactions = playerInteractions + (settingsChanges || 0);
        const pageViews = pageViewsMap[user.id] || 0;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalFiles: totalFiles || 0,
          libraryCount,
          totalListeningTime,
          interactions,
          pageViews,
        };
      })
    );

    // Сортируем пользователей по общему времени прослушивания (по убыванию)
    userStats.sort((a, b) => b.totalListeningTime - a.totalListeningTime);

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
