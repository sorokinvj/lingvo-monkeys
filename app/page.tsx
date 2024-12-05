import { SignInForm } from '../components/signin-form';
import { signInAction } from '@/app/actions';

export default async function Index() {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignInForm action={signInAction} />
    </div>
  );
}
