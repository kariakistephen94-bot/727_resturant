'use client';

import Image from 'next/image';
import Link from 'next/link';

export function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 md:hidden pt-4 px-4">
      <div className="glass-dark h-[4.25rem] rounded-2xl flex items-center justify-center">
        <Link href="/" className="flex items-center justify-center py-1">
          <Image
            src="/logo.png"
            alt="724 Restaurant And Bar"
            width={220}
            height={182}
            className="h-14 w-auto max-w-[min(220px,78vw)] object-contain"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
