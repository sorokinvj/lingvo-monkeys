import { Metadata } from 'next';
import ResetPage from './components/ResetPage';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Сбросить пароль',
};

const ResetPasswordPage = () => (
  <Suspense>
    <ResetPage />;
  </Suspense>
);

export default ResetPasswordPage;
