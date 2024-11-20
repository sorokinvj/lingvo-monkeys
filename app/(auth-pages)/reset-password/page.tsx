import { resetPasswordAction } from '@/app/actions';
import { FormMessage, Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

export const metadata = {
  title: 'Reset Password',
};

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
  return (
    <form className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative">
      <Image
        src="/logo-icon.png"
        width={100}
        height={100}
        alt="Lingvo Monkeys"
        className="mx-auto mb-2 hover:animate-bounce hover:scale-110 transition-all duration-300"
      />

      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
        Lingvo Monkeys
      </h1>

      <h2 className="text-2xl font-medium text-gray-700">Reset password</h2>
      <p className="text-sm text-gray-400">
        Please enter your new password below.
      </p>

      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="password" className="text-gray-700">
          New password
        </Label>
        <Input
          type="password"
          name="password"
          placeholder="New password"
          required
          className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
        />

        <Label htmlFor="confirmPassword" className="text-gray-700">
          Confirm password
        </Label>
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          required
          className="border-gray-700 placeholder:text-gray-500 focus:ring-gray-600 hover:border-gray-600 transition-colors"
        />

        <SubmitButton
          className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
          formAction={resetPasswordAction}
        >
          Reset password
        </SubmitButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
