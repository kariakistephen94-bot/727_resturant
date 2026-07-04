'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PaymentDetails } from '@/components/checkout/payment-details';
import { useCart } from '@/context/cart-context';
import { formatNaira } from '@/lib/format';
import { generateTrackingId, saveOrder, type FulfillmentType } from '@/lib/orders';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>('delivery');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = subtotal;

  const getImageSrc = (image: string | null | undefined) => {
    if (!image) return PlaceHolderImages[0]?.imageUrl || '/placeholder.png';
    if (image.startsWith('http') || image.startsWith('data:')) return image;
    const placeholder = PlaceHolderImages.find((i) => i.id === image);
    return placeholder?.imageUrl || image; 
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required';
    if (!phone.trim()) next.phone = 'Phone number is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Enter a valid email';
    if (fulfillmentType === 'delivery') {
      if (!address.trim()) next.address = 'Delivery address is required';
      if (!area.trim()) next.area = 'Area / landmark is required';
    }
    if (!paymentConfirmed)
      next.payment = 'Please confirm you have made the payment';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate() || items.length === 0) return;
    setSubmitting(true);

    const trackingId = generateTrackingId();

    const orderPayload = {
      tracking_id: trackingId,
      customer_name: fullName.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim(),
      fulfillment_type: fulfillmentType,
      fulfillment_address: address.trim() || null,
      fulfillment_area: area.trim() || null,
      fulfillment_notes: notes.trim() || null,
      subtotal,
      delivery_fee: 0,
      total,
      payment_confirmed: false,
      status: 'pending',
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image,
        addons: item.addons,
      })),
    };


    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });


      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error('[Checkout] ❌ Order failed:', data.error || data);
        setSubmitting(false);
        return;
      }

    } catch (err) {
      setSubmitting(false);
      return;
    }

    // Save locally for quick retrieval in confirmation page
    const localOrder = {
      trackingId,
      createdAt: new Date().toISOString(),
      customer: { fullName: fullName.trim(), phone: phone.trim(), email: email.trim() },
      fulfillment: {
        type: fulfillmentType,
        address: address.trim(),
        area: area.trim(),
        notes: notes.trim(),
      },
      items: [...items],
      subtotal,
      total,
      paymentConfirmed: false,
    };
    saveOrder(localOrder);

    setIsSuccess(true);
    clearCart();
    router.push(`/order/confirmation?tracking=${encodeURIComponent(trackingId)}`);
  };

  if (isSuccess) {
    return (
      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-16 sm:pb-20 md:pb-24 px-3 sm:px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground text-base sm:text-lg animate-pulse">Confirming your order...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-16 sm:pb-20 md:pb-24 px-3 sm:px-4 min-h-screen flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-base sm:text-lg mb-4 sm:mb-6">Your cart is empty.</p>
        <Button asChild className="rounded-full bg-primary text-sm sm:text-base">
          <Link href="/#menu">Browse Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-16 sm:pb-20 md:pb-24 px-3 sm:px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary mb-6 sm:mb-8 text-xs sm:text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back to cart
        </Link>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-bold mb-6 sm:mb-8 md:mb-10 px-1">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 md:gap-10">
          <div className="lg:col-span-3 space-y-6 sm:space-y-8">
            {/* Your Details Section */}
            <section className="glass-card rounded-xl sm:rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Your details</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                  <Label htmlFor="fullName" className="text-sm sm:text-base">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ada Okafor"
                    className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-background border-input text-sm sm:text-base"
                  />
                  {errors.fullName && (
                    <p className="text-[10px] sm:text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-background border-input text-sm sm:text-base"
                  />
                  {errors.phone && (
                    <p className="text-[10px] sm:text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-background border-input text-sm sm:text-base"
                  />
                  {errors.email && (
                    <p className="text-[10px] sm:text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Pickup or Delivery Section */}
            <section className="glass-card rounded-xl sm:rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Pickup or delivery</h2>
              <RadioGroup
                value={fulfillmentType}
                onValueChange={(v) => setFulfillmentType(v as FulfillmentType)}
                className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6"
              >
                <label
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 sm:p-4 cursor-pointer transition-colors ${
                    fulfillmentType === 'delivery'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted'
                  }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" />
                  <div>
                    <p className="font-bold text-sm sm:text-base">Delivery</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      35–45 mins
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 sm:p-4 cursor-pointer transition-colors ${
                    fulfillmentType === 'pickup'
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted'
                  }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div>
                    <p className="font-bold text-sm sm:text-base">Pickup</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Collect at our kitchen</p>
                  </div>
                </label>
              </RadioGroup>

              {fulfillmentType === 'delivery' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="address" className="text-sm sm:text-base">Delivery address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, house number, estate"
                      className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-background border-input text-sm sm:text-base"
                    />
                    {errors.address && (
                      <p className="text-[10px] sm:text-xs text-destructive">{errors.address}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="area" className="text-sm sm:text-base">Area / landmark</Label>
                    <Input
                      id="area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Agidingbi, Ogba, Ikeja"
                      className="h-10 sm:h-12 rounded-lg sm:rounded-xl bg-background border-input text-sm sm:text-base"
                    />
                    {errors.area && (
                      <p className="text-[10px] sm:text-xs text-destructive">{errors.area}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2 mt-3 sm:mt-4">
                <Label htmlFor="notes" className="text-sm sm:text-base">Order notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra pepper, call on arrival, etc."
                  className="min-h-[70px] sm:min-h-[80px] rounded-lg sm:rounded-xl bg-background border-input text-sm sm:text-base"
                />
              </div>
            </section>

            {/* Payment Section */}
            <section className="glass-card rounded-xl sm:rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 border-border">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Payment</h2>
              <PaymentDetails />
              <div className="mt-4 sm:mt-6 flex items-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-border bg-muted p-3 sm:p-4">
                <Checkbox
                  id="paymentConfirmed"
                  checked={paymentConfirmed}
                  onCheckedChange={(c) => setPaymentConfirmed(c === true)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="paymentConfirmed"
                  className="text-xs sm:text-sm leading-relaxed cursor-pointer"
                >
                  Yes, I&apos;ve made the payment to the account above for{' '}
                  <span className="font-bold text-primary">{formatNaira(total)}</span>
                </label>
              </div>
              {errors.payment && (
                <p className="text-[10px] sm:text-xs text-destructive mt-2 sm:mt-2">{errors.payment}</p>
              )}
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl sm:rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6 lg:p-8 border-border sticky top-20 sm:top-24 lg:top-28">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Order summary</h2>
              
              {/* Items List */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-48 sm:max-h-56 md:max-h-64 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-2 sm:gap-3 items-center">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl overflow-hidden shrink-0 bg-muted">
                      <Image
                        src={getImageSrc(item.image)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, 56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate">{item.name}</p>
                      {item.addons.length > 0 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {item.addons.map((a) => a.name).join(', ')}
                        </p>
                      )}
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {item.qty} × {formatNaira(item.price)}
                      </p>
                    </div>
                    <p className="font-bold text-xs sm:text-sm shrink-0">
                      {formatNaira(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="space-y-2 sm:space-y-3 border-t border-border pt-3 sm:pt-4 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold pt-1 sm:pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatNaira(total)}</span>
                </div>
              </div>
              
              {/* Place Order Button */}
              <Button
                className="w-full h-11 sm:h-12 md:h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm sm:text-base md:text-lg mt-5 sm:mt-6 md:mt-8 active:scale-95 transition-transform"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                {submitting ? 'Placing order...' : 'Place order'}
                <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}