import { GeistSans } from 'geist/font/sans';

import './globals.css';
import Providers from './providers';
import Header from '@/components/header';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Lingvo Monkeys',
  description: 'The fastest way to learn new languages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          <Header />
          <main className="min-h-screen h-full flex flex-col p-4 max-w-6xl mx-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
