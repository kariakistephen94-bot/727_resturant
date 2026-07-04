'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Utensils, ArrowRight, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveTableContext } from '@/lib/table-session';

// Landing page behind the QR code printed on each table.
// Scanning stores the table context, then the guest orders from the normal menu.
export default function TableLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, setState] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [tableLabel, setTableLabel] = useState('');

  useEffect(() => {
    const lookupTable = async () => {
      try {
        const res = await fetch(`/api/tables/${encodeURIComponent(id)}`);
        if (!res.ok) {
          setState('invalid');
          return;
        }
        const data = await res.json();
        saveTableContext({ tableId: data.table.id, tableLabel: data.table.label });
        setTableLabel(data.table.label);
        setState('ready');
      } catch {
        setState('invalid');
      }
    };
    lookupTable();
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center glass-card rounded-[2.5rem] p-8 md:p-10 border-border shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="724 Restaurant And Bar"
            width={220}
            height={105}
            className="h-16 w-auto object-contain"
            priority
          />
        </div>

        {state === 'loading' && (
          <div className="py-10">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Finding your table...</p>
          </div>
        )}

        {state === 'invalid' && (
          <div className="py-6">
            <h1 className="text-2xl font-headline font-bold mb-3">Table not found</h1>
            <p className="text-muted-foreground text-sm mb-6">
              This QR code doesn&apos;t match any of our tables. Please re-scan the code
              on your table or ask a member of staff for help.
            </p>
            <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8">
              <Link href="/#menu">Browse the menu anyway</Link>
            </Button>
          </div>
        )}

        {state === 'ready' && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Utensils className="w-9 h-9 text-primary" />
            </div>
            <p className="text-primary font-semibold text-xs tracking-[0.2em] uppercase mb-2">
              Welcome to 724
            </p>
            <h1 className="text-3xl md:text-4xl font-headline font-bold mb-3">
              Table {tableLabel}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Order straight from your phone — we&apos;ll bring everything to your table.
              Add more rounds anytime; you pay once, after your meal.
            </p>
            <Button
              asChild
              className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg"
            >
              <Link href="/#menu">
                View menu &amp; order
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-5">
              <Clock className="w-3.5 h-3.5" />
              Open 24 hours · pay when you&apos;re done
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
