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
import Link from 'next/link';
import { InfoIcon } from 'lucide-react';

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
      <div className="flex items-center gap-2 justify-end">
        {title}
        <InfoIcon className="w-4 h-4" />
      </div>
      <div className="absolute left-0 top-full z-10 mt-1 hidden w-64 rounded-md bg-black p-2 text-xs text-white shadow-lg group-hover:block">
        {description}
      </div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell>
                <Link href={`/admin/${user.email}`}>{user.email}</Link>
              </TableCell>
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
