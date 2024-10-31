'use client';

import { Button } from '@/components/ui/button';
import { UserSettings } from '@/hooks/useSettings';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const ThemeSwitcher = ({
  onSelect,
}: {
  onSelect: (theme: UserSettings['theme']) => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const ICON_SIZE = 16;

  const themes = [
    {
      value: 'light',
      icon: Sun,
      label: 'Light',
    },
    {
      value: 'dark',
      icon: Moon,
      label: 'Dark',
    },
    {
      value: 'system',
      icon: Laptop,
      label: 'System',
    },
  ] as const;

  const handleSelect = (theme: UserSettings['theme']) => {
    setTheme(theme);
    onSelect(theme);
  };

  return (
    <div className="flex gap-2">
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSelect(value)}
          className={`flex items-center gap-2 ${
            theme === value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-muted'
          }`}
        >
          <Icon size={ICON_SIZE} />
          <span className="text-sm">{label}</span>
        </Button>
      ))}
    </div>
  );
};

export { ThemeSwitcher };
