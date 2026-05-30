'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        ...
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      className="w-[100px]  fixed bottom-4 left-4 rounded-full px-3 py-2 "
      variant="outline"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? (
        <>
          <Moon className="w-4 h-4 mr-2" />
          Dark
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 mr-2" />
          Light
        </>
      )}
    </Button>
  );
}
