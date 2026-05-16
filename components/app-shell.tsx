'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/config/routes';
import { ThemeToggle } from '@/components/theme-toggle';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <aside className="flex-none w-64 border-r bg-card p-4">
        <div className="mb-6 text-lg font-bold">AOC Journal</div>
        <ThemeToggle />

        <nav className="flex flex-col gap-2">
          {routes.map((route) => {
            const isActive = pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                className={`w-full block rounded px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 bg-background">{children}</main>
    </div>
  );
}
