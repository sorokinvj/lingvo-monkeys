import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StatsCard } from '@/components/stats-card';
import { UserStatsTable } from '@/components/user-stats-table';
import { UserActivityChart } from '@/components/user-activity-chart';

export default async function AdminDashboard() {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is authenticated and has admin role
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

  // This assumes you have a way to identify admins
  // You may need to add an "isAdmin" column to your User table
  // For now, I'll use a hardcoded admin email check as an example
  const isAdmin =
    userData?.email &&
    (userData.email === process.env.ADMIN_EMAIL ||
      userData.email.endsWith('@lingvomonkeys.com'));

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Админская панель</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Общая статистика</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Пользователей"
            value="Загрузка..."
            endpoint="/api/admin/stats/users"
          />
          <StatsCard
            title="Загруженных файлов"
            value="Загрузка..."
            endpoint="/api/admin/stats/files"
          />
          <StatsCard
            title="Файлов сегодня"
            value="Загрузка..."
            endpoint="/api/admin/stats/files-today"
          />
          <StatsCard
            title="Файлов за неделю"
            value="Загрузка..."
            endpoint="/api/admin/stats/files-week"
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Регулярность загрузки</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <UserActivityChart endpoint="/api/admin/stats/upload-activity" />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Регулярность практики</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <UserActivityChart endpoint="/api/admin/stats/practice-activity" />
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
