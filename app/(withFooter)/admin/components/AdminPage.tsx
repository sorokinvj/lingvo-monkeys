'use client';
import { StatsCard } from '@/components/stats-card';
import { UserStatsTable } from '@/components/user-stats-table';
import { UserActivityChart } from '@/components/user-activity-chart';
import { VideoEngagementStats } from '@/components/video-engagement-stats';

export default function AdminPage() {
  return (
    <div className="container py-10">
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Статистика</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatsCard
            title="Пользователей"
            value="0"
            endpoint="/api/admin/stats/users"
            description="Всего зарегистрировано"
          />
          <StatsCard
            title="Файлов"
            value="0"
            endpoint="/api/admin/stats/files"
            description="Всего загружено"
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Активность пользователей</h2>
        <UserActivityChart
          endpoint="/api/admin/stats/upload-activity"
          description="Загрузка файлов за последние 30 дней"
        />
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Аналитика контента</h2>
        <VideoEngagementStats />
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Все пользователи</h2>
        <UserStatsTable />
      </div>
    </div>
  );
}
