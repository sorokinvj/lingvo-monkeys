import { SignInForm } from '../../components/signin-form';
import { signInAction } from '@/app/actions';

export const metadata = {
  title: 'Войти | Lingvomonkeys',
};

export default function SignIn() {
  return (
    <div className="w-full h-full flex justify-center">
      <SignInForm action={signInAction} />
    </div>
  );
}
