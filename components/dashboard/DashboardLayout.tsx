import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="p-6 space-y-6">{children}</div>;
}
