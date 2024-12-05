import { forgotPasswordAction } from '@/app/actions';
import { FormMessage, Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'LM | Forgot Password',
};

export default function ForgotPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
  return (
    <div className="flex pt-48 md:pt-12">
      <form className="py-2 md:py-12 flex flex-col min-w-64 mx-auto relative">
        <h2 className="text-2xl font-medium text-gray-700">Reset Password</h2>
        <p className="text-sm text-gray-400">
          Remember your password?{' '}
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
          <SubmitButton
            className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            formAction={forgotPasswordAction}
          >
            Reset Password
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
