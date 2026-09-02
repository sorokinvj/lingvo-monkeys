import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Tables, Columns } from '@/schema/schema';
import { UserAuditData } from '@/app/(withFooter)/admin/[email]/components/types';
import { isAdminEmail } from '@/app/(withFooter)/admin/helpers';

// Mark this route as dynamic to prevent static generation errors
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Роут ходит сервисным ключом и отдаёт всю историю событий любого
    // пользователя по email, поэтому доступ к нему обязан быть только у админа.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: currentUser } = await supabase
      .from(Tables.USER)
      .select('email')
      .eq('id', user.id)
      .single();

    if (!isAdminEmail(currentUser?.email)) {
      return NextResponse.json(
        { data: null, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const adminClient = createClient({ useServiceRole: true });
    // Получение email пользователя из параметров запроса
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          data: null,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Получение userId пользователя по email
    const { data: targetUser, error: targetUserError } = await adminClient
      .from(Tables.USER)
      .select('id')
      .eq('email', email)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        {
          data: null,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const userId = targetUser.id;

    // Получаем события пользователя через RPC функцию
    const { data: events, error: eventsError } = await adminClient.rpc(
      'get_user_audit_events',
      {
        user_id: userId,
        limit_per_table: 100,
      }
    );

    if (eventsError) {
      console.error('RPC ERROR', eventsError);
      return NextResponse.json(
        {
          data: null,
          error: eventsError.message,
        },
        { status: 500 }
      );
    }

    // Возвращаем типизированный ответ
    return NextResponse.json(events as UserAuditData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to fetch user audit data',
      },
      { status: 500 }
    );
  }
}
