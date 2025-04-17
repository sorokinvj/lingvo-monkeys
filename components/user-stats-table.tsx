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
  totalFiles: number;
  totalListeningTime: number;
  streak: number;
  playerInteractions: number;
  settingsChanges: number;
  pageViews: number;
}

// Описания метрик
const METRIC_DESCRIPTIONS = {
  totalFiles: 'Общее количество файлов, загруженных пользователем',
  totalListeningTime: 'Общее время прослушивания в секундах',
  streak: 'Максимальное количество дней подряд с практикой',
  playerInteractions:
    'Общее количество взаимодействий с плеером (play, pause, seek, etc.)',
  settingsChanges: 'Количество изменений настроек пользователя',
  pageViews: 'Количество просмотров страниц',
};

// Функция для форматирования времени
function formatTime(seconds: number): string {
  if (!seconds) return '0 мин';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

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
                title="Файлов загружено"
                description={METRIC_DESCRIPTIONS.totalFiles}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Время прослушивания"
                description={METRIC_DESCRIPTIONS.totalListeningTime}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Дней подряд"
                description={METRIC_DESCRIPTIONS.streak}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Взаимодействий"
                description={METRIC_DESCRIPTIONS.playerInteractions}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Просмотров страниц"
                description={METRIC_DESCRIPTIONS.pageViews}
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
              <TableCell className="text-right">{user.totalFiles}</TableCell>
              <TableCell className="text-right">
                {formatTime(user.totalListeningTime)}
              </TableCell>
              <TableCell className="text-right">{user.streak}</TableCell>
              <TableCell className="text-right">
                {user.playerInteractions}
              </TableCell>
              <TableCell className="text-right">{user.pageViews}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
