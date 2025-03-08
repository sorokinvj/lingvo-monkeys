'use client';

import { useEffect, useState } from 'react';

interface ActivityData {
  date: string;
  count: number;
}

interface ChartProps {
  endpoint: string;
}

export function UserActivityChart({ endpoint }: ChartProps) {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch activity data');
        }
        const data = await response.json();
        setActivityData(data.activity);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityData();
  }, [endpoint]);

  if (isLoading) {
    return <div className="p-8 text-center">Загрузка данных активности...</div>;
  }

  if (activityData.length === 0) {
    return <div className="p-8 text-center">Нет данных для отображения</div>;
  }

  // Find maximum value for scaling
  const maxValue = Math.max(...activityData.map((item) => item.count));

  return (
    <div className="w-full">
      <div className="flex h-[200px] items-end gap-2">
        {activityData.map((item, index) => {
          const heightPercentage =
            maxValue > 0 ? (item.count / maxValue) * 100 : 0;

          return (
            <div
              key={index}
              className="relative flex h-full flex-1 flex-col justify-end"
            >
              <div
                className="bg-primary w-full rounded-t"
                style={{ height: `${heightPercentage}%` }}
              ></div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                {new Date(item.date).toLocaleDateString('ru-RU', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-8 h-6"></div>
    </div>
  );
}
