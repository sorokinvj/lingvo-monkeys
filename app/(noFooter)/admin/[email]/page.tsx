import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import UserAuditPage from './components/UserAuditPage';
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

  return <UserAuditPage email={email} />;
}
