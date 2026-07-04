'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Download,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  getLastOrder,
  getOrderByTrackingId,
  type Order,
} from '@/lib/orders';
import { formatNaira } from '@/lib/format';
import { downloadOrderReceipt } from '@/lib/receipt-pdf';
import { getWhatsAppOrderUrl, type BankDetails } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { defaultSiteSettings } from '@/lib/site-settings';

const defaultBank: BankDetails = {
  bank: defaultSiteSettings.bankName,
  accountNumber: defaultSiteSettings.accountNumber,
  accountName: defaultSiteSettings.accountName,
};

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const trackingParam = searchParams.get('tracking');
  const [order, setOrder] = useState<Order | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [bank, setBank] = useState<BankDetails>(defaultBank);

  useEffect(() => {
    const fromSession = getLastOrder();
    if (fromSession && (!trackingParam || fromSession.trackingId === trackingParam)) {
      setOrder(fromSession);
      return;
    }
    if (trackingParam) {
      setOrder(getOrderByTrackingId(trackingParam));
    }
  }, [trackingParam]);

  useEffect(() => {
    const loadBank = async () => {
      try {
        const res = await fetch('/api/site-settings');
        const data = await res.json();
        if (data) {
          setBank({
            bank: data.bankName ?? defaultBank.bank,
            accountNumber: data.accountNumber ?? defaultBank.accountNumber,
            accountName: data.accountName ?? defaultBank.accountName,
          });
        }
      } catch {
        // keep defaults
      }
    };
    loadBank();
  }, []);

  if (!order) {
    return (
      <div className="pt-28 md:pt-32 pb-24 px-4 text-center">
        <p className="text-muted-foreground mb-6">Order not found.</p>
        <Button asChild className="rounded-full bg-primary">
          <Link href="/#menu">Back to menu</Link>
        </Button>
      </div>
    );
  }

  const whatsappUrl = getWhatsAppOrderUrl(order, bank);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadOrderReceipt(order, bank);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pt-28 md:pt-32 pb-24 px-4 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-3">
            Order placed!
          </h1>
          <p className="text-muted-foreground">
            Thank you, {order.customer.fullName}. We&apos;ll confirm once payment is verified.
          </p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border-border shadow-2xl space-y-6">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="724 Restaurant And Bar"
              width={280}
              height={134}
              className="h-24 md:h-28 w-auto max-w-[280px] object-contain"
            />
          </div>

          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Your tracking ID
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-bold font-mono tracking-wide">
                {order.trackingId}
              </p>
              <CopyButton value={order.trackingId} label="Tracking ID" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Save this ID to track your order
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total paid</span>
              <span className="font-bold text-primary">{formatNaira(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fulfillment</span>
              <span className="font-bold capitalize">{order.fulfillment.type}</span>
            </div>
            {order.fulfillment.type === 'delivery' && (
              <div className="flex gap-2 text-muted-foreground pt-1">
                <MapPin className="w-4 h-4 shrink-0 text-primary" />
                <span>
                  {order.fulfillment.address}, {order.fulfillment.area}
                </span>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-full glass border-border font-bold"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Generating...' : 'Download receipt'}
            </Button>
            <Button asChild className="h-12  text-gray rounded-full glass border-border font-bold">
              <Link href={`/track?id=${encodeURIComponent(order.trackingId)}`}>
                Track order
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 glass-card rounded-[2rem] p-6 border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Notify us on WhatsApp about your order so we can confirm payment and start preparing your meal.
          </p>
          <Button
            asChild
            className="w-full h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="w-5 h-5 mr-2" />
              Notify us on WhatsApp
            </a>
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href="/#menu">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 text-center text-muted-foreground">Loading...</div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
