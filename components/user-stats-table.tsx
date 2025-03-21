'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/ui-table';

interface UserStat {
  id: string;
  name: string;
  email: string;
  minutesPerDay: number;
  totalFiles: number;
  filesPerDay: number;
  filesPerWeek: number;
  uploadConsistency: number;
  practiceConsistency: number;
}

// Описания формул расчета для каждого параметра
const METRIC_DESCRIPTIONS = {
  minutesPerDay:
    'Среднее количество минут практики в день за последние 30 дней',
  totalFiles: 'Общее количество файлов, загруженных пользователем',
  uploadConsistency:
    'Процент дней с загрузкой файлов за последние 30 дней. Формула: (количество дней с загрузками / 30) * 100%',
  practiceConsistency:
    'Процент дней с практикой за последние 30 дней. Формула: (количество дней с практикой / 30) * 100%',
};

export function UserStatsTable() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const response = await fetch('/api/admin/stats/user-details');
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center">Загрузка данных пользователей...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Ошибка загрузки данных
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="p-8 text-center">Нет данных для отображения</div>;
  }

  // Компонент для отображения заголовка с описанием
  const HeaderWithTooltip = ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => (
    <div className="group relative">
      <div>
        {title} <span className="cursor-help text-gray-400">ℹ️</span>
      </div>
      <div className="absolute left-0 top-full z-10 mt-1 hidden w-64 rounded-md bg-black p-2 text-xs text-white shadow-lg group-hover:block">
        {description}
      </div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div className="p-4 mb-4 text-sm text-gray-500 border-b">
        <p className="mb-2">
          <strong>Описание метрик:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          {Object.entries(METRIC_DESCRIPTIONS).map(([key, desc]) => (
            <li key={key}>
              <strong>{key}:</strong> {desc}
            </li>
          ))}
        </ul>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Минут в день"
                description={METRIC_DESCRIPTIONS.minutesPerDay}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Всего файлов"
                description={METRIC_DESCRIPTIONS.totalFiles}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Регулярность загрузки"
                description={METRIC_DESCRIPTIONS.uploadConsistency}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Регулярность практики"
                description={METRIC_DESCRIPTIONS.practiceConsistency}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="text-right">{user.minutesPerDay}</TableCell>
              <TableCell className="text-right">{user.totalFiles}</TableCell>
              <TableCell className="text-right">
                {user.uploadConsistency}%
              </TableCell>
              <TableCell className="text-right">
                {user.practiceConsistency}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
