import { useQuery } from '@tanstack/react-query';
import { File } from '@/schema/models';

export const useCollection = (limit?: number) => {
  return useQuery<File[]>({
    queryKey: ['collection'],
    queryFn: async () => {
      const response = await fetch('/api/collection');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch collection');
      }

      const data = await response.json();

      // Если указан лимит, возвращаем только указанное количество файлов
      if (limit && data.length > limit) {
        return data.slice(0, limit);
      }

      return data;
    },
  });
};
