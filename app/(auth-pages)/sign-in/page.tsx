'use client';

import { signInAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    const result = await signInAction(formData);
    if ('error' in result) {
      setMessage(result.error);
    } else if ('success' in result) {
      setMessage(result.success);
      router.push('/upload');
    }
  };

  return (
    <>
      <form
        className="flex flex-col min-w-64 max-w-64 mx-auto"
        action={handleSubmit}
      >
        <h1 className="text-2xl font-medium">Sign in</h1>
        <p className="text-sm text text-foreground">
          Don't have an account?{' '}
          <Link className="text-primary font-medium underline" href="/sign-up">
            Sign up
          </Link>
        </p>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">Email</Label>
          <Input name="email" placeholder="you@example.com" required />
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
          />
          <SubmitButton pendingText="Signing in...">Sign in</SubmitButton>
          {message}
        </div>
      </form>
    </>
  );
}
