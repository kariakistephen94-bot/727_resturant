'use client';

import { usePathname } from 'next/navigation';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { WHATSAPP_NUMBER } from '@/lib/payment';

export function FloatingWhatsApp() {
  const pathname = usePathname();

  // Hidden on the home page (the menu/order CTAs already cover it there).
  if (pathname === '/') {
    return null;
  }

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 bottom-24 md:bottom-8 z-40 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce md:animate-none"
    >
      <WhatsAppIcon className="w-7 h-7" />
      <span className="sr-only">Contact on WhatsApp</span>
    </a>
  );
}
