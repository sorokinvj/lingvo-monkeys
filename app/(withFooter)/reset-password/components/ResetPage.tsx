'use client';
import { resetPasswordAction } from '@/app/actions';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ResetPage() {
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const isVerified = searchParams.get('verified') === 'true';
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Check for server-verification status and errors
  useEffect(() => {
    // Handle error redirects from the server
    if (error) {
      setMessage({
        type: 'error',
        text: error_description || 'Произошла ошибка при сбросе пароля.',
      });
      setLoading(false);
      return;
    }

    // If verified flag is present from server-side verification
    if (isVerified && email) {
      setVerified(true);
      setLoading(false);
      return;
    }

    // If no token or email, show error
    if (!token || !email) {
      setMessage({
        type: 'error',
        text: 'Ссылка недействительна. Попробуйте сбросить еще раз.',
      });
      setLoading(false);
      return;
    }

    // No need for client-side verifyOtp since it's now performed on the server
    setLoading(false);
  }, [isVerified, token, email, error, error_description]);

  async function clientAction(formData: FormData) {
    if (!verified) {
      setMessage({
        type: 'error',
        text: 'Ссылка недействительна или не подтверждена.',
      });
      return;
    }

    // Add email to formData so we can include it in our logs if needed
    formData.append('email', email || '');

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
