'use client';

import { ThemeProvider } from 'next-themes';
import { TradesProvider } from './TradesProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TradesProvider>{children}</TradesProvider>
    </ThemeProvider>
  );
}
