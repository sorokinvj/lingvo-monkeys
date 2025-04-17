import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/app/(withFooter)/admin/helpers';

/**
 * API-эндпоинт для получения данных о регулярности практики
 *
 * Возвращает массив объектов с полями:
 * - date: дата в формате ISO (YYYY-MM-DD)
 * - count: количество сессий практики в этот день
 *
 * Данные включают последние 30 дней.
 *
 * Формула расчета: На данный момент используются тестовые данные.
 * В будущей реализации будет подсчитываться количество сессий практики
 * (прослушиваний аудио) за каждый день.
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

    // Note: This is a placeholder as we don't yet have a table to track reading/practice sessions
    // You will need to create a table to track user practice sessions and then query it here
    // For now, we'll return sample data for demonstration purposes

    // Sample data for the chart
    const activity = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));

      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10), // Random practice count for demonstration
      };
    });

    return NextResponse.json({ activity });

    /* Actual implementation would look like this:
    
    // Get practice sessions grouped by day
    const { data } = await supabase
      .from('PracticeSessions')  // You would need to create this table
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
    
    // Count practice sessions by day
    data.forEach(session => {
      const dateString = new Date(session.createdAt).toISOString().split('T')[0];
      
      if (dailyActivity[dateString] !== undefined) {
        dailyActivity[dateString]++;
      }
    });
    
    // Convert to array format for chart
    const activity = Object.entries(dailyActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({ activity });
    */
  } catch (error) {
    console.error('Error fetching practice activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practice activity' },
      { status: 500 }
    );
  }
}
