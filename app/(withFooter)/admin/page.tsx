import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { StatsCard } from '@/components/stats-card';
import { UserStatsTable } from '@/components/user-stats-table';
import { UserActivityChart } from '@/components/user-activity-chart';

export default async function AdminDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user is admin (you'll need to add admin role to your users table)
  const { data: userData } = await supabase
    .from('User')
    .select('email, id')
    .eq('id', user.id)
    .single();

  const isAdmin =
    userData?.email === 'sorokinvj@gmail.com' ||
    userData?.email === 'bichiko@gmail.com';
  console.log(userData);
  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Админская панель</h1>

      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Пользователей"
            value="Загрузка..."
            endpoint="/api/admin/stats/users"
            description="Общее количество зарегистрированных пользователей в системе"
          />
          <StatsCard
            title="Загруженных файлов"
            value="Загрузка..."
            endpoint="/api/admin/stats/files"
            description="Общее количество файлов, загруженных всеми пользователями"
          />
          <StatsCard
            title="Файлов сегодня"
            value="Загрузка..."
            endpoint="/api/admin/stats/files-today"
            description="Количество файлов, загруженных за сегодняшний день (с 00:00)"
          />
          <StatsCard
            title="Файлов за неделю"
            value="Загрузка..."
            endpoint="/api/admin/stats/files-week"
            description="Количество файлов, загруженных за последние 7 дней"
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Регулярность загрузки</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <UserActivityChart
            endpoint="/api/admin/stats/upload-activity"
            description="Количество файлов, загруженных пользователями за каждый день в течение последних 30 дней"
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Регулярность практики</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <UserActivityChart
            endpoint="/api/admin/stats/practice-activity"
            description="Количество сессий практики (прослушиваний) за каждый день в течение последних 30 дней"
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Статистика пользователей
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <UserStatsTable />
        </div>
      </section>
    </div>
  );
}
