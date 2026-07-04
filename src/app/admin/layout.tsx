'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Home, UtensilsCrossed, Settings, LogOut, ShoppingCart, Flame, Tag } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const sidebarItems = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/menu', icon: UtensilsCrossed, label: 'Menu Items' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-md shadow-primary/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-amber-300">
                724 Restaurant &amp; Bar
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
            </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 text-base',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-base border-slate-600 text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 fixed left-0 top-0 h-screen z-40 shadow-2xl shadow-slate-900/20">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild className="md:hidden fixed left-4 top-4 z-50">
          <Button size="icon" variant="outline" className="bg-white shadow-md border-slate-200">
            <Menu className="h-6 w-6 text-slate-700" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="w-full md:ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight ml-12 md:ml-0">
            {sidebarItems.find(item => item.href === pathname)?.label || 'Dashboard'}
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user?.email || 'Admin'}</p>
              <p className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Online
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold shadow-md shadow-slate-200 border border-slate-700">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
