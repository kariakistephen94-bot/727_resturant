'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Menu', href: '/#menu' },
  { name: 'Track Order', href: '/track' },
  { name: 'Contact', href: '/contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-5">
        <div className="glass h-16 md:h-[4.5rem] rounded-full flex items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center shrink-0 group py-1">
            <Image
              src="/logo.png"
              alt="724 Restaurant And Bar"
              width={280}
              height={231}
              className="h-10 md:h-12 lg:h-14 w-auto object-contain group-hover:scale-[1.02] transition-transform"
              priority
            />
          </Link>

          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors ease-apple hover:text-foreground',
                  pathname === link.href ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-muted">
              <Link href="/#menu">
                <Search className="w-5 h-5" />
              </Link>
            </Button>
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button
              asChild
              className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white font-semibold transition-all ease-apple hover:scale-[1.03] active:scale-100"
            >
              <Link href="/#menu">Order Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
