'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <main className={isAdminPage || isAuthPage ? '' : 'pb-20 pt-[7.25rem] md:pt-0 md:pb-0 min-h-screen'}>
      {children}
    </main>
  );
}
