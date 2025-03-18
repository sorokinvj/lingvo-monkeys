import UploadPage from './components/UploadPage';
import { createClient } from '@/utils/supabase/server';

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'LM | Upload',
};

export default async function Upload() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const queryClient = new QueryClient();

  queryClient.prefetchQuery({
    queryKey: ['files', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('File')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UploadPage />
    </HydrationBoundary>
  );
}
