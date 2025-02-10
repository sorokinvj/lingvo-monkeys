import { SignUpForm } from '@/components/signup-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Регистрация',
};

export default function Signup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
