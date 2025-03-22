import { createClient } from '@/utils/supabase/client';
import { Tables, Columns } from '@/schema/schema';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { File } from '@/schema/models';

export const useFiles = (userId: string | undefined) => {
  const supabase = createClient();
  return useQuery<File[]>({
    queryKey: ['files'],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const { data, error } = await supabase
        .from(Tables.FILE)
        .select('*')
        .eq(Columns.COMMON.USER_ID, userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
