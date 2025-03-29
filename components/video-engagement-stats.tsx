'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoEngagementStats {
  totalPlays: number;
  uniquePlays: number;
  totalCompletions: number;
  uniqueCompletions: number;
  completionRate: string;
}

export function VideoEngagementStats() {
  const [data, setData] = useState<VideoEngagementStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(false);

        const response = await fetch('/api/admin/stats/video-engagement');
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching video engagement stats:', error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Вовлеченность видео на лендинге
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Вовлеченность видео на лендинге
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Ошибка загрузки данных</div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    { label: 'Всего просмотров', value: data.totalPlays },
    { label: 'Уникальных просмотров', value: data.uniquePlays },
    { label: 'Просмотров до конца', value: data.totalCompletions },
    { label: 'Уникальных завершений', value: data.uniqueCompletions },
    { label: 'Процент завершения', value: data.completionRate },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          Вовлеченность видео на лендинге
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <p className="text-xs text-gray-500">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
