import { roboto, oswald } from '@/lib/fonts';
import './globals.css';
import Providers from './providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import SignUpConfirmation from '@/components/signup-confirmation';
import { Suspense } from 'react';

// Canonical origin for metadata/OG links. Hosted on Cloudflare Workers, so
// there is no VERCEL_URL; production falls back to the real domain.
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://lingvomonkeys.com'
    : 'http://localhost:3000');

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
        url: `${baseUrl}/landing/lingvomonkeys_og.jpg?v=5`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lingvo Monkeys',
    description: 'Простой способ выучить язык без скукоты.',
    images: [`${baseUrl}/landing/lingvomonkeys_og.jpg?v=5`],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body
        className={`${roboto.variable} ${oswald.variable} bg-white text-black`}
      >
        <Providers>
          {children}
          <Suspense fallback={<div />}>
            <SignUpConfirmation />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
