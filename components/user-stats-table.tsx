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

export function UserStatsTable() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/admin/stats/user-details');
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching user stats:', error);
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

  if (users.length === 0) {
    return <div className="p-8 text-center">Нет данных для отображения</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Минут в день</TableHead>
            <TableHead className="text-right">Всего файлов</TableHead>
            <TableHead className="text-right">Файлов в день</TableHead>
            <TableHead className="text-right">Файлов в неделю</TableHead>
            <TableHead className="text-right">Регулярность загрузки</TableHead>
            <TableHead className="text-right">Регулярность практики</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="text-right">{user.minutesPerDay}</TableCell>
              <TableCell className="text-right">{user.totalFiles}</TableCell>
              <TableCell className="text-right">{user.filesPerDay}</TableCell>
              <TableCell className="text-right">{user.filesPerWeek}</TableCell>
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
