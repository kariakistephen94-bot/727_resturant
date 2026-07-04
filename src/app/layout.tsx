import type { Metadata } from 'next';
import './globals.css';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Navbar } from '@/components/layout/Navbar';
// import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import { Providers } from '@/components/providers';
import { NavigationWrapper } from '@/components/layout/NavigationWrapper';
import { MainWrapper } from '@/components/layout/MainWrapper';
import { Footer } from '@/components/layout/Footer';
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: '724 Restaurant And Bar | Open 24/7 in Agidingbi, Ikeja',
  description: '724 Restaurant And Bar — grilled fish, pounded yam & egusi, isi ewu, chilled drinks and good vibes on NERDC Road, Agidingbi, Lagos. Dine-in, takeaway & delivery, open 24 hours.',
  openGraph: {
    title: '724 Restaurant And Bar | Open 24/7 in Agidingbi, Ikeja',
    description: 'Grilled fish, pounded yam & egusi, isi ewu and chilled drinks on NERDC Road, Agidingbi, Lagos. Dine-in, takeaway & delivery — open 24 hours, every day.',
    siteName: '724 Restaurant And Bar',
    type: 'website',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: '724 Restaurant And Bar | Open 24/7 in Agidingbi, Ikeja',
    description: 'Grilled fish, Naija classics and chilled drinks — open 24/7 in Agidingbi, Ikeja, Lagos.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        <Providers>
          <NavigationWrapper>
            <Navbar />
            <MobileHeader />
          </NavigationWrapper>
          <MainWrapper>
            {children}
            
          </MainWrapper>
          <NavigationWrapper>
            <Footer />
          </NavigationWrapper>
          <NavigationWrapper>
            <MobileNav />
            {/* <FloatingWhatsApp /> */}
          </NavigationWrapper>
        </Providers>
        <Analytics/>
      </body>
    </html>
  );
}
