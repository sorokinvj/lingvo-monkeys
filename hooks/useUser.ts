import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

export const useUser = () => {
  const supabase = createClient();
  return useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });
};
