import FAQPage from './components/FAQPage';

export const metadata = {
  title: 'FAQ | Lingvomonkeys',
};

export default async function FAQ() {
  console.log('FAQ page');
  return <FAQPage />;
}
