'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Flame,
  Truck,
  User,
  Search,
  Clock,
  Download,
  Loader2,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CopyButton } from '@/components/ui/copy-button';
import { type Order } from '@/lib/orders';
import { buildCartId } from '@/context/cart-context';
import { formatNaira } from '@/lib/format';
import { getWhatsAppOrderUrl, type BankDetails } from '@/lib/whatsapp';
import { downloadOrderReceipt } from '@/lib/receipt-pdf';
import { defaultSiteSettings } from '@/lib/site-settings';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';

const steps = [
  { id: 1, label: 'Order Confirmed', icon: CheckCircle2 },
  { id: 2, label: 'In the Kitchen', icon: Flame },
  { id: 3, label: 'Ready for Pick-up', icon: User },
  { id: 4, label: 'Out for Delivery', icon: Truck },
];

// Map the order status to the progress timeline.
const statusProgress: Record<string, { step: number; percent: number }> = {
  pending: { step: 1, percent: 15 },
  confirmed: { step: 1, percent: 30 },
  preparing: { step: 2, percent: 55 },
  ready: { step: 3, percent: 80 },
  out_for_delivery: { step: 4, percent: 92 },
  delivered: { step: 4, percent: 100 },
  cancelled: { step: 0, percent: 0 },
};

const defaultBank: BankDetails = {
  bank: defaultSiteSettings.bankName,
  accountNumber: defaultSiteSettings.accountNumber,
  accountName: defaultSiteSettings.accountName,
};

interface ServerOrderItem {
  menu_item_id: number | null;
  name: string;
  price: number | string;
  quantity: number;
  image: string | null;
  addons: { name: string; price: number }[] | null;
}

interface ServerOrder {
  tracking_id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment_type: 'delivery' | 'pickup';
  fulfillment_address: string | null;
  fulfillment_area: string | null;
  fulfillment_notes: string | null;
  subtotal: number | string;
  delivery_fee: number | string;
  total: number | string;
  payment_confirmed: boolean;
  status: string;
  rider_phone: string | null;
  order_items: ServerOrderItem[];
}

function mapServerOrder(row: ServerOrder): Order {
  return {
    trackingId: row.tracking_id,
    createdAt: row.created_at,
    customer: {
      fullName: row.customer_name,
      phone: row.customer_phone,
      email: row.customer_email,
    },
    fulfillment: {
      type: row.fulfillment_type,
      address: row.fulfillment_address ?? '',
      area: row.fulfillment_area ?? '',
      notes: row.fulfillment_notes ?? '',
    },
    items: (row.order_items ?? []).map((it) => {
      const addons = Array.isArray(it.addons) ? it.addons : [];
      const price = Number(it.price);
      return {
        id: it.menu_item_id ?? 0,
        cartId: buildCartId(it.menu_item_id ?? 0, addons),
        name: it.name,
        price,
        basePrice: price - addons.reduce((sum, a) => sum + Number(a.price), 0),
        qty: it.quantity,
        image: it.image ?? '',
        addons,
      };
    }),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    paymentConfirmed: row.payment_confirmed,
    riderPhone: row.rider_phone,
  };
}

function TrackContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('id') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [bank, setBank] = useState<BankDetails>(defaultBank);

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

  const lookup = useCallback(async (rawId: string) => {
    const id = rawId.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders?tracking_id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(mapServerOrder(data.order));
        setStatus(data.order.status || 'pending');
      } else {
        setOrder(null);
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setQuery(id);
      lookup(id);
    }
  }, [searchParams, lookup]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(query);
  };

  const handleDownload = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      await downloadOrderReceipt(order, bank);
    } finally {
      setDownloading(false);
    }
  };

  const progressInfo = statusProgress[status] ?? statusProgress.pending;
  const currentStep = progressInfo.step;
  const progress = progressInfo.percent;

  return (
    <div className="pt-28 md:pt-32 pb-24 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold mb-4">Track Order</h1>
          <p className="text-muted-foreground">
            Enter your tracking ID from your order confirmation
          </p>
        </header>

        <form onSubmit={handleSearch} className="flex gap-2 mb-10 max-w-lg mx-auto">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 724-XXXXX"
            className="h-12 rounded-full bg-muted border-border font-mono uppercase"
          />
          <Button type="submit" className="rounded-full bg-primary px-6 shrink-0" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {searched && !loading && !order && (
          <div className="text-center glass-card rounded-3xl p-10">
            <p className="text-muted-foreground mb-4">
              No order found for <span className="font-mono font-bold text-foreground">{query}</span>
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/#menu">Place a new order</Link>
            </Button>
          </div>
        )}

        {order && (
          <>
            <div className="glass-card rounded-[3rem] p-8 md:p-12 border-border shadow-2xl mb-8">
              <div className="flex items-center justify-between gap-3 mb-6 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Tracking ID</p>
                  <p className="text-xl font-bold font-mono">{order.trackingId}</p>
                </div>
                <CopyButton value={order.trackingId} label="Tracking ID" />
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {order.fulfillment.type === 'delivery' ? 'Delivery' : 'Pickup'} ·{' '}
                {formatNaira(order.total)}
              </p>

              {!order.paymentConfirmed ? (
                /* Payment not yet confirmed by the admin */
                <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 md:p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">
                    Your payment has not yet been confirmed
                  </h3>
                  <p className="text-sm text-amber-700 max-w-md mx-auto">
                    We&apos;ve received your order but are still confirming your payment. Your order
                    progress will appear here as soon as payment is confirmed. If you&apos;ve already
                    paid, tap the WhatsApp button below to notify us.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-12 mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Order progress
                      </span>
                      <span className="text-sm font-bold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-muted" />
                  </div>

                  <div className="space-y-8 relative">
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-muted" />
                    {steps.map((step) => {
                      const Icon = step.icon;
                      const isActive = step.id <= currentStep;
                      return (
                        <div key={step.id} className="flex gap-8 relative z-10">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                              isActive
                                ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20'
                                : 'bg-background border-border text-muted-foreground'
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                            <div>
                              <h4
                                className={`text-xl font-bold ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                              >
                                {step.label}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isActive ? 'In progress / completed' : 'Upcoming'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Call the rider — shown once the order is out for delivery and a rider phone is set */}
            {order.paymentConfirmed && status === 'out_for_delivery' && order.riderPhone && (
              <div className="glass-card rounded-[2rem] p-6 border-border mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">Your order is on its way</p>
                    <p className="text-sm text-muted-foreground">
                      Call your rider on <span className="font-mono">{order.riderPhone}</span>
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full h-12 rounded-full bg-primary font-bold"
                >
                  <a href={`tel:${order.riderPhone.replace(/\s+/g, '')}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call Rider
                  </a>
                </Button>
              </div>
            )}

            {/* Receipt — always available while tracking */}
            <div className="glass-card rounded-[2rem] p-6 border-border mb-8">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                variant="outline"
                className="w-full h-12 rounded-full font-bold gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {downloading ? 'Preparing receipt...' : 'Download Receipt'}
              </Button>
            </div>

            <div className="glass-card rounded-[2rem] p-6 text-center border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Notify us on WhatsApp about your order
              </p>
              <Button
                asChild
                className="w-full h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold"
              >
                <a href={getWhatsAppOrderUrl(order, bank)} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-5 h-5 mr-2" />
                  Notify us on WhatsApp
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-muted-foreground">Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}
