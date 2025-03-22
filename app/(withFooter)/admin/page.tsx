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

  if (!isAdminEmail(user?.email)) {
    redirect('/');
  }

  // Создаем клиент запросов
  const queryClient = new QueryClient();

  // Здесь можно предзагрузить данные для админ-панели
  // (например, статистику и пр.)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminPage />
    </HydrationBoundary>
  );
}
