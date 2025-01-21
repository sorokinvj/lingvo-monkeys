import { LandingPage } from '@/components/LandingPage/LandingPage';

export const metadata = {
  title: 'LingvoMonkeys',
  description: 'Быстрый способ изучить язык без скукоты',
};

export default async function Index() {
  return <LandingPage />;
}
