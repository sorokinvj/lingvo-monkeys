import { SignInForm } from '../../components/signin-form';
import { signInAction } from '@/app/actions';

export default function SignIn() {
  return (
    <div className="flex pt-48 md:pt-12">
      <SignInForm action={signInAction} />
    </div>
  );
}
