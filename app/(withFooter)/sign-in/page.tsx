import { Suspense } from 'react';
import { SignInForm } from '../../../components/signin-form';
import { signInAction } from '@/app/actions';

export const metadata = {
  title: 'Войти',
};

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="w-full h-full flex justify-center">
        <SignInForm action={signInAction} />
      </div>
    </Suspense>
  );
}
