import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(withFooter)/admin/helpers';

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

    // Get current date for calculations
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Get a week ago
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Данные для всех пользователей
    const userStats = await Promise.all(
      users.map(async (user) => {
        // Количество файлов
        const { count: totalFiles } = await supabase
          .from(Tables.FILE)
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Получаем данные о прослушивании
        const { data: listeningData } = await supabase
          .from('FileListeningEvent')
          .select('durationSeconds')
          .eq('userId', user.id);

        const totalListeningTime = listeningData
          ? listeningData.reduce(
              (sum, event) => sum + (event.durationSeconds || 0),
              0
            )
          : 0;

        // Получаем данные о взаимодействии с плеером
        const { count: playerInteractions } = await supabase
          .from('PlayerInteractionEvent')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Получаем данные о изменениях настроек
        const { count: settingsChanges } = await supabase
          .from('SettingsChangeEvent')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Получаем данные о просмотрах страниц
        const { count: pageViews } = await supabase
          .from('PageViewEvent')
          .select('*', { count: 'exact', head: true })
          .eq('userId', user.id);

        // Получаем дни с активностью для расчета streak
        const { data: dailyActivity } = await supabase
          .from('FileListeningEvent')
          .select('date')
          .eq('userId', user.id)
          .order('date', { ascending: true });

        let streak = 0;
        if (dailyActivity && dailyActivity.length > 0) {
          // Упрощенный расчет streak - найти максимальную последовательность дней
          // Создаем массив уникальных дат без использования spread оператора для Set
          const uniqueDatesSet = new Set(
            dailyActivity.map((event) => event.date)
          );
          const uniqueDates = Array.from(uniqueDatesSet).sort();
          let currentStreak = 1;
          let maxStreak = 1;

          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currDate = new Date(uniqueDates[i]);

            // Проверяем, являются ли даты последовательными
            const diffInDays = Math.floor(
              (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffInDays === 1) {
              currentStreak++;
              maxStreak = Math.max(maxStreak, currentStreak);
            } else {
              currentStreak = 1;
            }
          }

          streak = maxStreak;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          totalFiles: totalFiles || 0,
          totalListeningTime,
          streak,
          playerInteractions: playerInteractions || 0,
          settingsChanges: settingsChanges || 0,
          pageViews: pageViews || 0,
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
