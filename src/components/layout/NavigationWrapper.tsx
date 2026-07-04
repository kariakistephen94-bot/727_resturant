'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export function NavigationWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAdminPage || isAuthPage) {
    return null;
  }

  return <>{children}</>;
}
