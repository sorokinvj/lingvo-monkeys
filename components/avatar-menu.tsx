'use client';

import { useCallback, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { signOutAction } from '@/app/actions';
import { useOnClickOutside } from '@/hooks/useClickOutside';
import { Shell } from 'lucide-react';

interface AvatarMenuProps {
  user: User;
}

export function AvatarMenu({ user }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    await signOutAction();
    router.refresh();
  }, [router]);

  useOnClickOutside(menuRef, () => setIsOpen(false));

  const initials = user.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
        aria-label="User menu"
      >
        <Shell className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-sm text-gray-700 truncate">
              {user.email}
            </div>
            <div className="border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
