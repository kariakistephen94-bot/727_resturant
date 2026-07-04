import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { WHATSAPP_NUMBER } from '@/lib/payment';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=724+Restaurant+And+Bar,+NERDC+Rd,+Agidingbi,+Lagos';

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 md:pt-20 pb-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Brand & Intro */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="724 Restaurant And Bar"
                width={200}
                height={95}
                className="h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-sm md:text-base leading-relaxed text-stone-400 max-w-md">
              Grilled fish, Naija classics and chilled drinks in the heart of Agidingbi, Ikeja.
              Dine in, take away, or get it delivered — we&apos;re open 24 hours, every day of the week.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-white/50 font-semibold text-xs tracking-[0.18em] uppercase">Quick Links</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <Link href="/#menu" className="hover:text-accent transition-colors">Order Now</Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-accent transition-colors">Track Order</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h4 className="text-white/50 font-semibold text-xs tracking-[0.18em] uppercase">Find Us</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-accent transition-colors"
                >
                  <WhatsAppIcon className="w-5 h-5 text-accent" />
                  Chat with us on WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-accent transition-colors"
                >
                  <MapPin className="w-5 h-5 text-accent" />
                  NERDC Rd, Agidingbi, Ikeja, Lagos
                </a>
              </li>
              <li>
                <span className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent" />
                  Open 24 hours · 7 days a week
                </span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-14 pt-8 border-t border-white/10 text-center text-xs md:text-sm text-stone-500">
          <p>&copy; {new Date().getFullYear()} 724 Restaurant And Bar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
