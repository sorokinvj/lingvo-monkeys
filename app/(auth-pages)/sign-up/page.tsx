'use client';

import { signUpAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseErrorMessage } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';

export default function Signup() {
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    const result = await signUpAction(formData);
    if ('error' in result) {
      setMessage(parseErrorMessage(result?.error));
    } else if ('success' in result) {
      setMessage(result.success);
    }
  };

  return (
    <>
      <form
        className="flex flex-col min-w-64 max-w-64 mx-auto"
        action={handleSubmit}
      >
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text text-foreground">
          Already have an account?{' '}
          <Link className="text-primary font-medium underline" href="/sign-in">
            Sign in
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
            minLength={6}
            required
          />
          <SubmitButton pendingText="Signing up...">Sign up</SubmitButton>
          {message}
        </div>
      </form>
    </>
  );
}
