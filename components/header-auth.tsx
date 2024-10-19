import { signOutAction } from '@/app/actions';
import { hasEnvVars } from '@/utils/supabase/check-env-vars';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { createClient } from '@/utils/supabase/server';

export default async function AuthButton() {
  const {
    data: { user },
  } = await createClient().auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-4 mr-4">
        <Link
          href="/upload"
          className="font-semibold text-base hover:underline hover:underline-offset-4 hover:decoration-primary"
        >
          Upload
        </Link>
      </div>
      <div className="flex items-center gap-4">
        Hey, {user.email}!
        <form action={signOutAction}>
          <Button type="submit" variant={'outline'}>
            Sign out
          </Button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={'outline'}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={'default'}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
