'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  endpoint: string;
}

export function StatsCard({ title, value, endpoint }: StatsCardProps) {
  const [data, setData] = useState<string>(value);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result.value.toString());
      } catch (error) {
        console.error('Error fetching stats:', error);
        setData('Ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          ) : (
            data
          )}
        </div>
      </CardContent>
    </Card>
  );
}
