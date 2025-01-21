import { Bebas_Neue, Didact_Gothic, Oswald, Roboto } from 'next/font/google';

export const didactGothic = Didact_Gothic({
  weight: '400',
  subsets: ['cyrillic'],
  variable: '--font-didact',
  display: 'swap',
});

export const oswald = Oswald({
  weight: ['300', '400', '600'],
  subsets: ['cyrillic'],
  variable: '--font-oswald',
  display: 'swap',
});

export const roboto = Roboto({
  weight: ['300', '400', '700'],
  subsets: ['cyrillic'],
  variable: '--font-roboto',
  display: 'swap',
});
