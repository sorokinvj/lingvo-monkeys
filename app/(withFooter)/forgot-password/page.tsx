'use client';

import { forgotPasswordAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPassword() {
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  async function clientAction(formData: FormData) {
    const result = await forgotPasswordAction(formData);
    if (result?.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result?.success) {
      setMessage({ type: 'success', text: result.success });
    }
  }

  return (
    <div className="flex pt-48 md:pt-12">
      <form
        className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative"
        action={clientAction}
      >
        <h2 className="text-2xl font-medium text-gray-700">Сбросить пароль</h2>
        <p className="text-sm text-gray-400">
          Помните свой пароль?{' '}
          <Link
            className="text-violet-500 font-medium underline hover:text-white transition-colors"
            href="/sign-in"
          >
            Войти
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
          <SubmitButton className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors">
            Сбросить пароль
          </SubmitButton>
          {message && (
            <div
              className={`text-${message.type === 'error' ? 'red' : 'green'}-500 border-l-2 border-${message.type === 'error' ? 'red' : 'green'}-500 px-4`}
            >
              {message.text}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
