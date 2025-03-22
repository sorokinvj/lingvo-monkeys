'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatsCard } from '@/components/stats-card';
import { UserStatsTable } from '@/components/user-stats-table';
import { UserActivityChart } from '@/components/user-activity-chart';

export default function AdminPage() {
  const router = useRouter();
  const [searchEmail, setSearchEmail] = useState('');

  // Обработчик поиска пользователя
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail) {
      router.push(`/admin/${encodeURIComponent(searchEmail)}`);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-10">Админ панель</h1>

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
          <StatsCard
            title="Прослушиваний"
            value="0"
            endpoint="/api/admin/stats/listening"
            description="Всего за все время"
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">
          Поиск пользователя для аудита
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Email пользователя"
            className="flex-1 p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Поиск
          </button>
        </form>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Активность пользователей</h2>
        <UserActivityChart
          endpoint="/api/admin/stats/upload-activity"
          description="Загрузка файлов за последние 30 дней"
        />
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-5">Активные пользователи</h2>
        <UserStatsTable />
      </div>

      <div className="mt-10">
        <Link href="/" className="text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
