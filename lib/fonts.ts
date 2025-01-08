import { Bebas_Neue, Didact_Gothic, Oswald } from 'next/font/google';

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
