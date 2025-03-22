import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import AdminPage from './components/AdminPage';
import { isAdminEmail } from './helpers';

export default async function Admin() {
  const supabase = createClient();

  // Проверяем права доступа
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Проверка на админа
  const { data: userData } = await supabase
    .from('User')
    .select('email')
    .eq('id', user.id)
    .single();

  if (!isAdminEmail(userData?.email)) {
    redirect('/');
  }

  return <AdminPage />;
}
