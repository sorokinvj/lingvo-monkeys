'use client';
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';

import { useUser } from '@/hooks/useUser';

const Header: FC = () => {
  const { data: user } = useUser();

  const navConfig = {
    signIn: {
      title: 'Sign In',
      href: '/sign-in',
      enabled: !user,
    },
    files: {
      title: 'Your Files',
      href: '/upload',
      enabled: !!user,
    },
    faq: {
      title: 'FAQ',
      href: '/faq',
    },
  };

  return (
    <header
      className={`relative top-4 md:top-8 
      w-[calc(100%-2rem)] right-1/2 translate-x-1/2 md:max-w-6xl md:mx-auto md:translate-x-0 md:right-auto rounded-full mx-auto
      transition-all duration-300 ease-in-out
    `}
    >
      <nav
        className={`w-full flex flex-col items-center px-6 py-4 justify-center gap-4
        transition-all duration-300 ease-in-out
      `}
      >
        <div>
          <Link href="/">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
              Lingvo Monkeys
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-8 bg-white p-4 rounded-full">
          {Object.entries(navConfig).map(
            ([key, value]) =>
              ('enabled' in value ? value.enabled : true) && (
                <Link href={value.href} key={key}>
                  <div className="text-base text-gray-90 hover:text-violet-500">
                    {value.title}
                  </div>
                </Link>
              )
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
