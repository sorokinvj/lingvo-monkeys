'use client';
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';

import Image from 'next/image';
import { useUser } from '@/hooks/useUser';

const Header: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) return; // Only track scroll on mobile
      const shouldCollapse = window.scrollY > window.innerHeight * 0.7;
      setIsCollapsed(shouldCollapse);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      className={`
      bg-white z-20 shadow-header fixed md:relative top-4 md:top-8 
      w-[calc(100%-2rem)] right-1/2 translate-x-1/2 md:max-w-6xl md:mx-auto md:translate-x-0 md:right-auto rounded-full mx-auto
      transition-all duration-300 ease-in-out
      ${isCollapsed ? 'max-md:!w-14 max-md:!right-4 max-md:!left-auto max-md:!translate-x-0 max-md:!mx-0 max-md:!p-0' : ''}
    `}
    >
      <nav
        className={`w-full flex flex-col items-center px-6 py-4 justify-center gap-4
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'max-md:!p-4' : ''}
      `}
      >
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'max-md:w-0 max-md:opacity-0' : 'w-auto opacity-100'}
        `}
        >
          <Link href="/">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-transparent bg-clip-text">
              Lingvo Monkeys
            </h1>
          </Link>
        </div>
        <div className="hidden md:flex md:items-center gap-8">
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

        {!user && (
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline">Sign in</Button>
            </Link>
          </div>
        )}

        <Button
          className="!p-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Image
            src="/images/mobile-menu.svg"
            width={24}
            height={24}
            alt="Menu"
          />
        </Button>
      </nav>
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        className="h-fit"
        width="w-full"
        minWidth="min-w-full"
      >
        <nav
          className="flex flex-col pr-2 py-4"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="flex flex-col gap-2">
            {Object.entries(navConfig).map(([key, value]) => (
              <Link href={value.href} key={key}>
                <div className="text-sm font-medium text-gray-900 w-full p-2">
                  {value.title}
                </div>
                <hr className="border-gray-200 w-full py-1" />
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-8 w-full">
            <Link href="/login" className="basis-1/2 w-full">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/schedule-demo" className="basis-1/2 w-full">
              <Button color="primary" className="w-full">
                Book a Demo
              </Button>
            </Link>
          </div>
        </nav>
      </Drawer>
    </header>
  );
};

export default Header;
