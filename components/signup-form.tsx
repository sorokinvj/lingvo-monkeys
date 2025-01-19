'use client';

import { useState } from 'react';
import { signUpAction } from '@/app/actions';
import { parseErrorMessage } from '@/lib/utils';
import { Input, Label } from '@headlessui/react';
import Link from 'next/link';
import { SubmitButton } from './submit-button';

export const SignUpForm = () => {
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
    <div className="w-full flex justify-center">
      <form
        className="flex flex-col min-w-64 mx-auto relative py-2 md:py-12"
        action={handleSubmit}
      >
        <h2 className="text-2xl font-medium text-gray-700">Регистрация</h2>
        <p className="text-sm text-gray-400">
          Есть аккаунт?{' '}
          <Link
            className="text-blue-900 font-medium underline hover:text-white transition-colors"
            href="/sign-in"
          >
            Войти
          </Link>
        </p>

        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email" className="text-gray-700">
            Почта
          </Label>
          <Input
            name="email"
            placeholder="you@example.com"
            required
            className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
          />

          <Label htmlFor="password" className="text-gray-700">
            Пароль
          </Label>
          <Input
            type="password"
            name="password"
            placeholder="Ваш пароль"
            minLength={6}
            required
            className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
          />

          <SubmitButton
            className="bg-blue-900 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            pendingText="🌈 🌈 🌈 "
          >
            ✨ Создать аккаунт ✨
          </SubmitButton>
          {message}
        </div>
      </form>
    </div>
  );
};
