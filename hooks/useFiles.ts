import { createClient } from '@/utils/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { File } from '@/schema/models';

export const useFiles = (userId: string | undefined) => {
  const supabase = createClient();
  return useQuery<File[]>({
    queryKey: ['files', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await supabase
        .from('File')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
