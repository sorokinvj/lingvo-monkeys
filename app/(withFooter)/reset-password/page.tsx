'use client';

import { resetPasswordAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ResetPassword() {
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const type = searchParams.get('type');
  const supabase = createClient();

  useEffect(() => {
    async function verifyToken() {
      if (!token || !email) {
        setMessage({
          type: 'error',
          text: 'Ссылка недействительна. Попробуйте сбросить еще раз.',
        });
        setLoading(false);
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'recovery',
        });

        if (error) {
          console.error('OTP verification error:', error);
          setMessage({
            type: 'error',
            text: 'Ссылка недействительна или срок её действия истёк. Пожалуйста, запросите новую ссылку для сброса пароля.',
          });
        } else {
          setVerified(true);
        }
      } catch (err) {
        console.error('Verification error:', err);
        setMessage({
          type: 'error',
          text: 'Произошла ошибка при проверке ссылки сброса пароля.',
        });
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, email, type, supabase.auth]);

  async function clientAction(formData: FormData) {
    if (!token || !email || !verified) {
      setMessage({
        type: 'error',
        text: 'Ссылка недействительна или не подтверждена.',
      });
      return;
    }

    // Add email to formData so we can include it in our logs if needed
    formData.append('email', email);

    const result = await resetPasswordAction(formData);
    if (result?.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result?.success) {
      setMessage({ type: 'success', text: result.success });
    }
  }

  if (loading) {
    return (
      <div className="flex pt-48 md:pt-12">
        <div className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative">
          <h2 className="text-2xl font-medium text-gray-700">
            Сбросить пароль
          </h2>
          <p className="text-sm text-gray-400">
            Проверка ссылки для сброса пароля...
          </p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!verified && message?.type === 'error') {
    return (
      <div className="flex pt-48 md:pt-12">
        <div className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative">
          <h2 className="text-2xl font-medium text-gray-700">
            Ошибка сброса пароля
          </h2>
          <div className="mt-4 text-red-500 border-l-2 border-red-500 px-4">
            {message.text}
          </div>
          <div className="mt-4">
            <a
              href="/forgot-password"
              className="text-blue-600 underline hover:text-blue-800 transition-colors"
            >
              Запросить новую ссылку
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex pt-48 md:pt-12">
      <form
        className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative"
        action={clientAction}
      >
        <h2 className="text-2xl font-medium text-gray-700">Сбросить пароль</h2>
        <p className="text-sm text-gray-400">
          Пожалуйста, введите ваш новый пароль ниже.
        </p>

        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="password" className="text-gray-700">
            Новый пароль
          </Label>
          <Input
            type="password"
            name="password"
            placeholder="Новый пароль"
            required
            className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
          />

          <Label htmlFor="confirmPassword" className="text-gray-700">
            Подтвердите пароль
          </Label>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Подтвердите пароль"
            required
            className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
          />

          <SubmitButton className="bg-gradient-to-r bg-blue-900 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors">
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
