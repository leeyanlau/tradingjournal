'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/config/routes';
import { ThemeToggle } from '@/components/theme-toggle';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          border-r bg-card p-4
          transition-transform duration-300
          overflow-y-auto

          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-bold">AOC Journal</div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-2 hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ThemeToggle />

        <nav className="mt-6 flex flex-col gap-2">
          {routes.map((route) => {
            const isActive = pathname.startsWith(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setSidebarOpen(false)}
                className={`block rounded px-3 py-2 text-sm transition ${
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

      {/* HAMBURGER FLOATING BUTTON */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 rounded-lg border bg-background p-2 shadow hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* MAIN CONTENT */}
      <main
        className={`
          transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {children}
      </main>
    </div>
  );
}
