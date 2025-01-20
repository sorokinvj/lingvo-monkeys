import { didactGothic, oswald } from '@/lib/fonts';
import './globals.css';
import Providers from './providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Lingvo Monkeys',
  description: 'Простой способ выучить язык без скукоты.',
  ogImage: '/landing/lingvomonkeys_og.jpg',
  og: {
    type: 'website',
    url: defaultUrl,
    title: 'Lingvo Monkeys',
    description: 'Простой способ выучить язык без скукоты.',
    image: '/landing/lingvomonkeys_og.jpg',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lingvo Monkeys',
    description: 'Простой способ выучить язык без скукоты.',
    image: '/landing/lingvomonkeys_og.jpg',
  },
  telegram: {
    ogImage: '/landing/lingvomonkeys_og.jpg?v=2',
  },
  linkedin: {
    ogImage: '/landing/lingvomonkeys_og.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${didactGothic.variable} ${oswald.variable}`}>
        <Providers>
          <main className="min-h-screen flex flex-col items-start w-full overflow-hidden md:max-w-6xl md:mx-auto">
            <Header />
            <div className="w-full flex-1">{children}</div>
            <Footer />
          </main>
        </Providers>
      </body>
    </html>
  );
}
