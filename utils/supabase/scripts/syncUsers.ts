import dotenv from 'dotenv';
import { Tables, Columns } from '@/schema/schema';
const parsed = dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function syncUsers() {
  console.log('Environment variables loaded:');
  console.log('URL length:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length);
  console.log(
    'Service role key length:',
    process.env.SUPABASE_SERVICE_ROLE_KEY?.length
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      'Supabase URL or service role key is not defined',
      'URL exists:',
      !!supabaseUrl,
      'Key exists:',
      !!supabaseServiceRoleKey
    );
    return;
  }

  if (supabaseServiceRoleKey.length < 100) {
    console.error('Service role key appears to be truncated');
    console.error('Key length:', supabaseServiceRoleKey.length);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: authUsers, error: authError } =
    await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  for (const authUser of authUsers.users) {
    const { data: existingUser, error: checkError } = await supabase
      .from(Tables.USER)
      .select('id')
      .eq('id', authUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking user ${authUser.id}:`, checkError);
      continue;
    }

    if (!existingUser) {
      const { error: insertError } = await supabase.from(Tables.USER).insert({
        id: authUser.id,
        name: authUser.user_metadata.full_name || 'Anonymous',
        email: authUser.email,
      });

      if (insertError) {
        console.error(`Error inserting user ${authUser.id}:`, insertError);
      } else {
        console.log(`Created User record for ${authUser.id}`);
      }
    }
  }

  console.log('User synchronization complete');
}

syncUsers();
