import { SignInForm } from '../components/signin-form';
import { signInAction } from '@/app/actions';

export default function SignIn() {
  return <SignInForm action={signInAction} />;
}
