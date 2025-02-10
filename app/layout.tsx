import { roboto, oswald } from '@/lib/fonts';
import './globals.css';
import Providers from './providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import SignUpConfirmation from '@/components/signup-confirmation';

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Lingvo Monkeys',
  description: 'Простой способ выучить язык без скукоты.',
  openGraph: {
    type: 'website',
    title: 'Lingvo Monkeys',
    description: 'Простой способ выучить язык без скукоты.',
    images: [
      {
        url: `${baseUrl}/landing/lingvomonkeys_og.jpg?v=4`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lingvo Monkeys',
    description: 'Простой способ выучить язык без скукоты.',
    images: [`${baseUrl}/landing/lingvomonkeys_og.jpg?v=4`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${oswald.variable}`}>
        <Providers>
          <main className="min-h-screen flex flex-col items-start w-full overflow-hidden md:overflow-visible md:max-w-6xl md:mx-auto">
            <Header />
            <div className="w-full flex-1">{children}</div>
            <Footer />
          </main>
          <SignUpConfirmation />
        </Providers>
      </body>
    </html>
  );
}
