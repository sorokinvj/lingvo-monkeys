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
import { useQuery } from '@tanstack/react-query';
import { formatListeningTime } from '@/app/(noFooter)/admin/[email]/components/helpers';

interface UserStat {
  id: string;
  name: string;
  email: string;
  totalFiles: number;
  libraryCount: number;
  totalListeningTime: number;
  interactions: number;
  pageViews: number;
}

// Описания метрик
const METRIC_DESCRIPTIONS = {
  totalFiles: 'Общее количество файлов, загруженных пользователем',
  library: 'Количество файлов, прослушанных в библиотеке',
  minutes: 'Минут практики',
  interactions: 'Количество кликов по плееру и настройкам',
  pageViews: 'Количество просмотров страниц',
};

export function UserStatsTable() {
  const {
    isLoading,
    error,
    data: stats,
  } = useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats/user-details');
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      return response.json();
    },
  });

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

  if (!stats || stats.length === 0) {
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
                title="Файлы"
                description={METRIC_DESCRIPTIONS.totalFiles}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Библиотека"
                description={METRIC_DESCRIPTIONS.library}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Практика"
                description={METRIC_DESCRIPTIONS.minutes}
              />
            </TableHead>
            <TableHead className="text-right">
              <HeaderWithTooltip
                title="Взаимодействий"
                description={METRIC_DESCRIPTIONS.interactions}
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
          {stats.map((user: UserStat) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link href={`/admin/${user.email}`}>{user.email}</Link>
              </TableCell>
              <TableCell className="text-right">{user.totalFiles}</TableCell>
              <TableCell className="text-right">{user.libraryCount}</TableCell>
              <TableCell className="text-right">
                {formatListeningTime(user.totalListeningTime)}
              </TableCell>
              <TableCell className="text-right">{user.interactions}</TableCell>
              <TableCell className="text-right">{user.pageViews}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
