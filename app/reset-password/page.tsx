import { resetPasswordAction } from '@/app/actions';
import { FormMessage, Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const metadata = {
  title: 'Сбросить пароль',
};

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
  return (
    <div className="flex pt-48 md:pt-12">
      <form className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative">
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

          <SubmitButton
            className="bg-gradient-to-r bg-blue-900 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            formAction={resetPasswordAction}
          >
            Сбросить пароль
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
