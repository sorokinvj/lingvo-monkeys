import LandingPage from '@/components/landing/LandingPage';

export const metadata = {
  title: 'Be Monkey',
  description: 'Listen to your audience',
};

export default async function Index() {
  return <LandingPage />;
}
