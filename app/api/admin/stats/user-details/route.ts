import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/schema/schema';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(withFooter)/admin/helpers';

// Интерфейс для данных, возвращаемых функцией get_user_listening_stats
interface UserListeningStats {
  totalSeconds: number;
  totalFilesListened: number;
  streak: number;
  dailyStats: Array<{
    date: string;
    totalListeningSeconds: number;
    totalFilesUploaded: number;
    filesListened: any[];
  }>;
}

// Интерфейс для статистики взаимодействий
interface CountResult {
  userId: string;
  count: string;
}

/**
 * API-эндпоинт для получения детальной статистики по пользователям
 *
 * Возвращает массив объектов со следующими полями:
 * - id: идентификатор пользователя
 * - name: имя пользователя
 * - email: email пользователя
 * - totalFiles: общее количество файлов, загруженных пользователем
 * - totalListeningTime: общее время прослушивания в секундах
 * - streak: максимальное количество дней подряд с активностью
 * - playerInteractions: общее количество взаимодействий с плеером
 * - settingsChanges: количество изменений настроек
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
    console.log('Calling count_player_interactions RPC...');
    const playerInteractionsResult = await supabase.rpc(
      'count_player_interactions',
      {}
    );
    console.log('Player interactions result:', playerInteractionsResult);

    // Проверяем структуру данных и создаем словарь userId -> количество взаимодействий
    const playerInteractionsMap: Record<string, number> = {};
    if (playerInteractionsResult.data) {
      console.log(
        'Player interactions data structure:',
        JSON.stringify(playerInteractionsResult.data)
      );
      playerInteractionsResult.data.forEach((stat: any) => {
        // Проверяем формат данных, возвращаемых функцией
        console.log('Player interaction stat item:', stat);
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
    console.log('Final player interactions map:', playerInteractionsMap);

    // Получаем статистику просмотров страниц для всех пользователей одним запросом
    console.log('Calling count_page_views RPC...');
    const pageViewsResult = await supabase.rpc('count_page_views', {});
    console.log('Page views result:', pageViewsResult);

    // Создаем словарь userId -> количество просмотров страниц
    const pageViewsMap: Record<string, number> = {};
    if (pageViewsResult.data) {
      console.log(
        'Page views data structure:',
        JSON.stringify(pageViewsResult.data)
      );
      pageViewsResult.data.forEach((stat: any) => {
        // Проверяем формат данных, возвращаемых функцией
        console.log('Page view stat item:', stat);
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
    console.log('Final page views map:', pageViewsMap);

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
        const stats = (listeningStats as UserListeningStats) || {
          totalSeconds: 0,
          streak: 0,
        };
        const totalListeningTime = stats.totalSeconds || 0;
        const streak = stats.streak || 0;

        // Получаем данные о изменениях настроек из отдельного запроса
        const { count: settingsChanges } = await supabase
          .from('SettingsChangeEvent')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Используем данные из предварительно полученных словарей
        const playerInteractions = playerInteractionsMap[user.id] || 0;
        const pageViews = pageViewsMap[user.id] || 0;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalFiles: totalFiles || 0,
          totalListeningTime,
          streak,
          playerInteractions,
          settingsChanges: settingsChanges || 0,
          pageViews,
        };
      })
    );

    return NextResponse.json({ users: userStats });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
