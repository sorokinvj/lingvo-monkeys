import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';
import UserAuditPage from './components/UserAuditPage';
import { fetchUserAuditData } from './components/helpers';
import { isAdminEmail } from '../helpers';

export default async function UserAudit({
  params,
}: {
  params: { email: string };
}) {
  const email = decodeURIComponent(params.email);
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

  // Предзагружаем данные аудита
  try {
    await queryClient.prefetchQuery({
      queryKey: ['userAudit', email],
      queryFn: () => fetchUserAuditData(email, user?.email),
    });
  } catch (error) {
    console.error('Failed to prefetch user audit data:', error);
    // Даже если предзагрузка не удалась, мы продолжаем рендеринг
    // Компонент UserAuditPage обработает ошибку на клиенте
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserAuditPage email={email} />
    </HydrationBoundary>
  );
}
