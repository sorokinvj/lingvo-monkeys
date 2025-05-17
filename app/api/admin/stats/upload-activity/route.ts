import { createClient } from '@/utils/supabase/server';
import { Tables } from '@/schema/schema';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(noFooter)/admin/helpers';

/**
 * API-эндпоинт для получения данных о регулярности загрузки файлов
 *
 * Возвращает массив объектов с полями:
 * - date: дата в формате ISO (YYYY-MM-DD)
 * - count: количество загруженных файлов в этот день
 *
 * Данные включают последние 30 дней.
 *
 * Формула расчета:
 * 1. Получаем все файлы, загруженные за последние 30 дней
 * 2. Группируем их по дате загрузки
 * 3. Для каждого дня подсчитываем количество загруженных файлов
 * 4. Формируем массив с данными для каждого дня, включая дни без загрузок (count=0)
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
    // Get date for 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Get uploaded files grouped by day
    const { data } = await supabase
      .from(Tables.FILE)
      .select('createdAt')
      .gte('createdAt', thirtyDaysAgo.toISOString())
      .order('createdAt', { ascending: true });

    if (!data) {
      return NextResponse.json({ activity: [] });
    }

    // Group by day
    const dailyActivity: { [key: string]: number } = {};

    // Initialize all days in the range with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateString = date.toISOString().split('T')[0];
      dailyActivity[dateString] = 0;
    }

    // Count uploads by day
    data.forEach((file) => {
      const dateString = new Date(file.createdAt).toISOString().split('T')[0];

      if (dailyActivity[dateString] !== undefined) {
        dailyActivity[dateString]++;
      }
    });

    // Convert to array format for chart
    const activity = Object.entries(dailyActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error fetching upload activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload activity' },
      { status: 500 }
    );
  }
}
