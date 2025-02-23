'use client';
import { FC, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { usePathname } from 'next/navigation';
import { AvatarMenu } from './avatar-menu';
import { useOnClickOutside } from '@/hooks/useClickOutside';
import { signOutAction } from '@/app/actions';
import { AlignRight } from 'lucide-react';
import { Drawer } from './ui/drawer';
import { Button } from './ui/button';

export const Header: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: user } = useUser();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) return;
      const shouldCollapse = window.scrollY > window.innerHeight * 0.7;
      setIsCollapsed(shouldCollapse);
      if (shouldCollapse) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useOnClickOutside(menuRef, () => setIsMobileMenuOpen(false));

  const navConfig = {
    files: {
      title: 'Ваши файлы',
      href: '/upload',
      enabled: !!user,
    },
    faq: {
      title: 'FAQ',
      href: '/f-a-q',
    },
  };

  const handleSignOut = async () => {
    await signOutAction();
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`
      bg-white z-20 shadow-header md:relative w-full md:max-w-6xl md:mx-auto md:translate-x-0 md:right-auto rounded-full mx-auto
      transition-all duration-300 ease-in-out flex items-center justify-between px-4 py-4 pr-2 md:py-8 md:pr-0
      ${isCollapsed ? 'max-md:!w-14 max-md:!right-4 max-md:!left-auto max-md:!translate-x-0 max-md:!mx-0 max-md:!p-0' : ''}
    `}
    >
      <Link href="/">
        <h1
          className={`text-3xl font-bold text-black whitespace-nowrap
          ${isCollapsed ? 'max-md:hidden' : ''}`}
        >
          Lingvo Monkeys
        </h1>
      </Link>

      {/* Desktop Navigation */}
      <div className="md:items-center md:gap-8 hidden md:flex">
        {Object.entries(navConfig).map(
          ([key, value]) =>
            ('enabled' in value ? value.enabled : true) && (
              <Link href={value.href} key={key}>
                <div
                  className={`text-base hover:text-blue-600 hover:underline hover:underline-offset-4 hover:decoration-blue-600 hover:decoration-2 ${
                    pathname?.includes(value.href)
                      ? 'text-blue-900 decoration-blue-900 decoration-2 underline underline-offset-8'
                      : ''
                  }`}
                >
                  {value.title}
                </div>
              </Link>
            )
        )}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <AvatarMenu user={user} />
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <div className="text-base hover:text-blue-600 hover:underline hover:underline-offset-4 hover:decoration-blue-600 hover:decoration-2">
                  Войти
                </div>
              </Link>
              <Link href="/sign-up">
                <div className="text-base bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
                  Регистрация
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`p-2 hover:bg-gray-100 rounded-full ${
            isCollapsed ? 'max-md:mx-auto' : ''
          }`}
          aria-label="Menu"
        >
          <AlignRight className="w-8 h-8 font-bold" />
        </button>

        <Drawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          width="w-full"
          minWidth="min-w-[320px]"
          position="right"
          hasNoBackgroundOverlay={false}
          className="md:hidden"
        >
          <div className="flex flex-col gap-2 items-center">
            {Object.entries(navConfig).map(
              ([key, value]) =>
                ('enabled' in value ? value.enabled : true) && (
                  <Link
                    href={value.href}
                    key={key}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className={`text-lg py-2 ${
                        pathname?.includes(value.href)
                          ? 'text-blue-900 decoration-blue-900 decoration-2 underline underline-offset-8'
                          : 'text-gray-900 hover:text-blue-600'
                      }`}
                    >
                      {value.title}
                    </div>
                  </Link>
                )
            )}

            <hr className="w-full my-6" />

            {user ? (
              <>
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-gray-700 mb-2">{user.email}</div>
                  <Button onClick={handleSignOut} variant="outline">
                    Выйти
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 items-center">
                <Link
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline">Войти</Button>
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="default">Регистрация</Button>
                </Link>
              </div>
            )}
          </div>
        </Drawer>
      </div>
    </header>
  );
};
