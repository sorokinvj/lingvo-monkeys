'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { fetchUserAuditData, processUserAuditData } from './helpers';
import { UserAuditData } from './types';
import StatisticsSection from './StatisticsSection';
import UserFiles from './UserFiles';
import EventTimeline from './EventTimeline';

export default function UserAuditPage({ email }: { email: string }) {
  const { data: currentUser } = useUser();
  const {
    data: auditData,
    error,
    isLoading,
  } = useQuery<UserAuditData>({
    queryKey: ['userAudit', email],
    queryFn: async () => fetchUserAuditData(email, currentUser?.email),
  });

  // Если данные загружаются
  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold">Загрузка данных аудита...</h2>
      </div>
    );
  }

  // Если данные отсутствуют или ошибка
  if (!auditData || error) {
    return (
      <div className="p-4">
        <Link
          href="/admin"
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад к админке
        </Link>
        <h2 className="text-xl font-semibold text-red-500">
          {error ? `Ошибка: ${error.message}` : 'Данные аудита отсутствуют'}
        </h2>
      </div>
    );
  }

  // Обрабатываем данные аудита с помощью хелпера
  const { events, fileNames } = processUserAuditData(auditData);

  return (
    <div className="p-4 max-w-6xl mx-auto flex flex-col gap-4">
      <Link
        href="/admin"
        className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Назад к админке
      </Link>
      <h1 className="text-2xl font-bold">Действия пользователя: {email}</h1>

      {/* Статистика */}
      <StatisticsSection auditData={auditData} />

      {/* Файлы пользователя */}
      <UserFiles auditData={auditData} />

      {/* Хронология действий */}
      <EventTimeline events={events} fileNames={fileNames} />
    </div>
  );
}
