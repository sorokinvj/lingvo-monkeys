'use client';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { FC, useState } from 'react';
import Image from 'next/image';

interface SignInFormProps {
  action: (formData: FormData) => Promise<any>;
}

export const SignInForm: FC<SignInFormProps> = ({ action }) => {
  const [message, setMessage] = useState<string | null>(null);

  async function clientAction(formData: FormData) {
    const result = await action(formData);
    if (result?.error) {
      setMessage(result.error);
    } else if (result?.success) {
      window.location.href = '/upload';
    }
  }

  return (
    <form
      className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative"
      action={clientAction}
    >
      <h2 className="text-2xl font-medium text-gray-700">Sign in</h2>
      <p className="text-sm text-gray-400">
        Don't have an account?{' '}
        <Link
          className="text-violet-500 font-medium underline hover:text-white transition-colors"
          href="/sign-up"
        >
          Sign up
        </Link>
      </p>

      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email" className="text-gray-700">
          Email
        </Label>
        <Input
          name="email"
          placeholder="you@example.com"
          required
          className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
        />

        <Label htmlFor="password" className="text-gray-700">
          Password
        </Label>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
          className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
        />

        <Link
          className="text-violet-500 text-sm font-medium underline hover:text-white transition-colors -mt-2 mb-2"
          href="/forgot-password"
        >
          Forgot password?
        </Link>

        <SubmitButton
          className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
          pendingText="🌈 Magic happening..."
        >
          ✨ Sign in ✨
        </SubmitButton>
        {message && <p className="text-red-500">{message}</p>}
      </div>
    </form>
  );
};
