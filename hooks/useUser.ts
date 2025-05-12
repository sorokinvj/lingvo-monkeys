import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      return data?.user;
    },
    staleTime: 5 * 60 * 1000,
  });
}
