// file: utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { createClient as createClientBase } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type ClientOptions = {
  useServiceRole?: boolean;
};

export const createClient = (options?: ClientOptions) => {
  const { useServiceRole = false } = options || {};

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase URL is not set');
  }

  // Для service role используем другой ключ и другой метод
  if (useServiceRole) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase service role key is not set');
    }

    return createClientBase(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );
  }

  // Обычный клиент с аутентификацией через cookies
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase anon key is not set');
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
