import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API-эндпоинт для получения детальной статистики по пользователям
 *
 * Возвращает массив объектов со следующими полями:
 * - id: идентификатор пользователя
 * - name: имя пользователя
 * - email: email пользователя
 * - minutesPerDay: среднее количество минут практики в день за последние 30 дней
 *   (в текущей реализации используются тестовые данные)
 * - totalFiles: общее количество файлов, загруженных пользователем
 * - filesPerDay: количество файлов, загруженных пользователем сегодня (с 00:00)
 * - filesPerWeek: количество файлов, загруженных пользователем за последние 7 дней
 * - uploadConsistency: процент дней с загрузкой файлов за последние 30 дней
 *   Формула: (количество дней с загрузками / 30) * 100%
 * - practiceConsistency: процент дней с практикой за последние 30 дней
 *   (в текущей реализации используются тестовые данные)
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
    .from('User')
    .select('email')
    .eq('id', user.id)
    .single();

  // Используем тот же метод проверки что и на странице
  const isAdmin = userData?.email === 'sorokinvj@gmail.com';

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  try {
    // Get all users
    const { data: users } = await supabase
      .from('User')
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

    // Get all files with user data for counting
    const { data: files } = await supabase
      .from('File')
      .select('userId, createdAt');

    // For each user, calculate their statistics
    const userStats = await Promise.all(
      users.map(async (user) => {
        // Count total files uploaded by this user
        const totalFiles = files
          ? files.filter((file) => file.userId === user.id).length
          : 0;

        // Count files uploaded today by this user
        const filesPerDay = files
          ? files.filter(
              (file) =>
                file.userId === user.id && new Date(file.createdAt) >= today
            ).length
          : 0;

        // Count files uploaded this week by this user
        const filesPerWeek = files
          ? files.filter(
              (file) =>
                file.userId === user.id && new Date(file.createdAt) >= weekAgo
            ).length
          : 0;

        // Calculate upload consistency (percentage of days with uploads in the last 30 days)
        // This is a simplistic calculation and could be improved
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const userFiles = files
          ? files.filter(
              (file) =>
                file.userId === user.id &&
                new Date(file.createdAt) >= thirtyDaysAgo
            )
          : [];

        // Count unique days with uploads
        const uploadDays = new Set();
        userFiles.forEach((file) => {
          const dateStr = new Date(file.createdAt).toISOString().split('T')[0];
          uploadDays.add(dateStr);
        });

        const uploadConsistency = Math.round((uploadDays.size / 30) * 100);

        // Note: Minutes per day and practice consistency would require additional
        // data tracking that we don't have yet. For now, we'll use placeholder data.

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          minutesPerDay: Math.floor(Math.random() * 30), // Placeholder
          totalFiles,
          filesPerDay,
          filesPerWeek,
          uploadConsistency,
          practiceConsistency: Math.floor(Math.random() * 100), // Placeholder
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
