'use client';

import { signUpAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseErrorMessage } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

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
    <div className="flex pt-48 md:pt-12">
      <form
        className="flex flex-col min-w-64 mx-auto relative py-2 md:py-12"
        action={handleSubmit}
      >
        <h2 className="text-2xl font-medium text-gray-700">Sign up</h2>
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            className="text-violet-500 font-medium underline hover:text-white transition-colors"
            href="/sign-in"
          >
            Sign in
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
            minLength={6}
            required
            className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
          />

          <SubmitButton
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            pendingText="🌈 Magic happening..."
          >
            ✨ Sign up ✨
          </SubmitButton>
          {message}
        </div>
      </form>
    </div>
  );
}
