'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface ActivityData {
  date: string;
  count: number;
}

interface ChartProps {
  endpoint: string;
  description?: string;
}

export function UserActivityChart({ endpoint, description }: ChartProps) {
  const {
    data: activityData,
    isLoading,
    error,
    refetch,
  } = useQuery<ActivityData[], Error>({
    queryKey: ['activityData'],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      return data.activity || [];
    },
  });

  useEffect(() => {
    refetch();
  }, [endpoint, refetch]);

  if (isLoading) {
    return <div className="p-8 text-center">Загрузка данных активности...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Ошибка загрузки данных
      </div>
    );
  }

  if (!activityData || activityData.length === 0) {
    return <div className="p-8 text-center">Нет данных для отображения</div>;
  }

  // Find maximum value for scaling
  const maxValue = Math.max(...activityData.map((item) => item.count));

  return (
    <div className="w-full">
      {description && (
        <div className="mb-4 text-sm text-gray-500">
          <p>{description}</p>
        </div>
      )}
      <div className="flex h-[200px] items-end gap-2">
        {activityData.map((item, index) => {
          const heightPercentage =
            maxValue > 0 ? (item.count / maxValue) * 100 : 0;

          const date = new Date(item.date);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

          return (
            <div
              key={index}
              className="relative flex h-full flex-1 flex-col justify-end"
            >
              <div
                className="bg-sky-100 w-full rounded-t"
                style={{ height: `${heightPercentage}%` }}
              ></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                {formattedDate}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-8 h-6"></div>
    </div>
  );
}
